import { beforeEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({ userId: "user_test" as string | null }));

vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: authState.userId }),
}));

const putMock = vi.hoisted(() =>
  vi.fn(async (pathname: string) => ({
    url: `https://blob.test/${pathname}`,
  }))
);

vi.mock("@vercel/blob", () => ({ put: putMock }));

import { POST } from "@/app/api/upload/route";

function requestWithFile(file: File | null): Request {
  const formData = new FormData();
  if (file) formData.append("file", file);
  return { formData: async () => formData } as unknown as Request;
}

function audioFile(
  name: string,
  { type = "audio/mpeg", size }: { type?: string; size?: number } = {}
): File {
  const file = new File(["abc"], name, { type });
  if (size !== undefined) {
    Object.defineProperty(file, "size", { value: size });
  }
  return file;
}

describe("POST /api/upload", () => {
  beforeEach(() => {
    authState.userId = "user_test";
    putMock.mockClear();
  });

  it("rejects unauthenticated requests", async () => {
    authState.userId = null;
    const res = await POST(requestWithFile(audioFile("song.mp3")));
    expect(res.status).toBe(401);
    expect(putMock).not.toHaveBeenCalled();
  });

  it("rejects requests without a file", async () => {
    const res = await POST(requestWithFile(null));
    expect(res.status).toBe(400);
  });

  it("rejects empty files", async () => {
    const res = await POST(requestWithFile(audioFile("song.mp3", { size: 0 })));
    expect(res.status).toBe(400);
  });

  it("rejects files over 50MB", async () => {
    const res = await POST(
      requestWithFile(audioFile("song.mp3", { size: 50 * 1024 * 1024 + 1 }))
    );
    expect(res.status).toBe(400);
    expect(putMock).not.toHaveBeenCalled();
  });

  it("rejects disallowed extensions even with an audio MIME type", async () => {
    const res = await POST(
      requestWithFile(audioFile("malware.exe", { type: "audio/mpeg" }))
    );
    expect(res.status).toBe(400);
    expect(putMock).not.toHaveBeenCalled();
  });

  it("rejects non-audio MIME types even with an allowed extension", async () => {
    const res = await POST(
      requestWithFile(audioFile("song.mp3", { type: "application/octet-stream" }))
    );
    expect(res.status).toBe(400);
    expect(putMock).not.toHaveBeenCalled();
  });

  it("rejects files without an extension", async () => {
    const res = await POST(requestWithFile(audioFile("noextension")));
    expect(res.status).toBe(400);
  });

  it("uploads a valid audio file", async () => {
    const res = await POST(requestWithFile(audioFile("My Song.mp3")));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.url).toMatch(/^https:\/\/blob\.test\/audio\//);
    expect(json.fileName).toBe("My Song.mp3");
    expect(putMock).toHaveBeenCalledOnce();
  });

  it("strips path separators from the stored blob name", async () => {
    const res = await POST(
      requestWithFile(audioFile("..\\..$/etc/passwd's song.mp3"))
    );
    expect(res.status).toBe(200);
    const [pathname] = putMock.mock.calls[0];
    // Only the fixed "audio/" prefix may contain a slash
    expect(pathname).toMatch(/^audio\/\d+-[^/\\]+$/);
  });
});
