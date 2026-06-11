import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50MB

const ALLOWED_EXTENSIONS = new Set([
  "mp3",
  "wav",
  "m4a",
  "aac",
  "ogg",
  "opus",
  "flac",
  "webm",
]);

const ALLOWED_MIME_PREFIXES = ["audio/", "video/webm"];

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size === 0 || file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "File must be between 1 byte and 50MB" },
      { status: 400 }
    );
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mimeAllowed = ALLOWED_MIME_PREFIXES.some((prefix) =>
    file.type.startsWith(prefix)
  );
  if (!ALLOWED_EXTENSIONS.has(extension) || !mimeAllowed) {
    return NextResponse.json(
      { error: "Only audio files are allowed" },
      { status: 400 }
    );
  }

  // Strip path separators and control characters from the user-supplied name
  const safeName = file.name
    .replace(/[/\\]/g, "_")
    .replace(/[^\w.\- ]/g, "_")
    .slice(-100);

  const blob = await put(`audio/${Date.now()}-${safeName}`, file, {
    access: "public",
  });

  return NextResponse.json({ url: blob.url, fileName: file.name });
}
