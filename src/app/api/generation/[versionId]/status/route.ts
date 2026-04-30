import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { trackVersions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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
