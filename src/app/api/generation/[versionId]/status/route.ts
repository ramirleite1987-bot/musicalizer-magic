import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { trackVersions, generationLogs } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getGenerationStatus, inferAudioFile, resolveProvider } from "@/lib/music";
import { put } from "@vercel/blob";

type RouteContext = {
  params: Promise<{ versionId: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { versionId } = await params;
  const db = getDb();

  const [version] = await db
    .select()
    .from(trackVersions)
    .where(eq(trackVersions.id, versionId))
    .limit(1);

  if (!version) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  const provider = resolveProvider(version.style);
  const taskId = version.providerTaskId ?? version.sunoTaskId;

  if (!taskId) {
    return NextResponse.json({ status: version.status });
  }

  if (version.status !== "generating") {
    return NextResponse.json({
      status: version.status,
      audioUrl: version.audioUrl,
    });
  }

  try {
    const status = await getGenerationStatus(provider, taskId);

    if (status.status === "complete" && status.audioUrl) {
      const audioRes = await fetch(status.audioUrl);
      const audioBuffer = await audioRes.arrayBuffer();
      const { extension, contentType } = inferAudioFile(provider, version.style);
      const fileName = `${provider}-${taskId}.${extension}`;

      const blob = await put(`audio/${fileName}`, audioBuffer, {
        access: "public",
        contentType,
      });

      await db
        .update(trackVersions)
        .set({
          status: "complete",
          audioUrl: blob.url,
          audioFileName: fileName,
          updatedAt: new Date(),
        })
        .where(eq(trackVersions.id, versionId));

      // Update generation log with final status and duration
      try {
        const [startedLog] = await db
          .select()
          .from(generationLogs)
          .where(
            and(
              eq(generationLogs.versionId, versionId),
              eq(generationLogs.status, "started")
            )
          )
          .orderBy(desc(generationLogs.createdAt))
          .limit(1);

        if (startedLog) {
          const durationMs = Date.now() - startedLog.createdAt.getTime();
          await db
            .update(generationLogs)
            .set({ status: "complete", durationMs })
            .where(eq(generationLogs.id, startedLog.id));
        } else {
          const model =
            provider === "minimax"
              ? (version.style as { minimaxModel?: string })?.minimaxModel ?? "music-1.5"
              : (version.style as { sunoApiVersion?: string })?.sunoApiVersion ?? "v4";
          await db.insert(generationLogs).values({
            trackId: version.trackId,
            versionId,
            provider,
            model,
            status: "complete",
          });
        }
      } catch {
        // Non-fatal
      }

      return NextResponse.json({
        status: "complete",
        audioUrl: blob.url,
      });
    }

    if (status.status === "failed") {
      await db
        .update(trackVersions)
        .set({
          status: "draft",
          providerTaskId: null,
          sunoTaskId: null,
          updatedAt: new Date(),
        })
        .where(eq(trackVersions.id, versionId));

      // Update generation log with failed status
      try {
        const [startedLog] = await db
          .select()
          .from(generationLogs)
          .where(
            and(
              eq(generationLogs.versionId, versionId),
              eq(generationLogs.status, "started")
            )
          )
          .orderBy(desc(generationLogs.createdAt))
          .limit(1);

        if (startedLog) {
          const durationMs = Date.now() - startedLog.createdAt.getTime();
          await db
            .update(generationLogs)
            .set({ status: "failed", durationMs })
            .where(eq(generationLogs.id, startedLog.id));
        } else {
          const model =
            provider === "minimax"
              ? (version.style as { minimaxModel?: string })?.minimaxModel ?? "music-1.5"
              : (version.style as { sunoApiVersion?: string })?.sunoApiVersion ?? "v4";
          await db.insert(generationLogs).values({
            trackId: version.trackId,
            versionId,
            provider,
            model,
            status: "failed",
          });
        }
      } catch {
        // Non-fatal
      }

      return NextResponse.json({
        status: "failed",
        error: status.error ?? "Generation failed",
      });
    }

    return NextResponse.json({ status: status.status });
  } catch (error) {
    console.error(`${provider} status check error:`, error);
    return NextResponse.json({
      status: "generating",
      error: "Status check failed, will retry",
    });
  }
}
