import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { trackVersions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getGenerationStatus } from "@/lib/suno/client";
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

  if (!version.sunoTaskId) {
    return NextResponse.json({ status: version.status });
  }

  if (version.status !== "generating") {
    return NextResponse.json({
      status: version.status,
      audioUrl: version.audioUrl,
    });
  }

  try {
    const sunoStatus = await getGenerationStatus(version.sunoTaskId);

    if (sunoStatus.status === "complete" && sunoStatus.audioUrl) {
      // Download from Suno and upload to Vercel Blob
      const audioRes = await fetch(sunoStatus.audioUrl);
      const audioBlob = await audioRes.blob();
      const fileName = `suno-${version.sunoTaskId}.mp3`;

      const blob = await put(`audio/${fileName}`, audioBlob, {
        access: "public",
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

    if (sunoStatus.status === "failed") {
      await db
        .update(trackVersions)
        .set({
          status: "draft",
          sunoTaskId: null,
          updatedAt: new Date(),
        })
        .where(eq(trackVersions.id, versionId));

      return NextResponse.json({
        status: "failed",
        error: sunoStatus.error ?? "Generation failed",
      });
    }

    return NextResponse.json({ status: sunoStatus.status });
  } catch (error) {
    console.error("Suno status check error:", error);
    return NextResponse.json({
      status: "generating",
      error: "Status check failed, will retry",
    });
  }
}
