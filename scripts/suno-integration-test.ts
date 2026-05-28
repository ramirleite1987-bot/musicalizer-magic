/**
 * Self-contained integration test for the Suno music-generation client.
 *
 * Spins up an in-process mock that emulates the Suno HTTP API, points the
 * client at it via env vars, then drives the real client functions
 * (`createGeneration`, `getGenerationStatus`, `toSunoModelVersion`) and
 * asserts the request shape and the queued -> processing -> complete
 * lifecycle. No database, Vercel Blob token, or running Next.js server
 * required.
 *
 * Run with:  npx tsx scripts/suno-integration-test.ts
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";

type RecordedRequest = {
  method: string;
  url: string;
  auth: string;
  body: Record<string, unknown> | null;
};

const recorded: RecordedRequest[] = [];
const pollCounts: Record<string, number> = {};

function startMockSuno(): Promise<{ baseUrl: string; close: () => void }> {
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      let parsed: Record<string, unknown> | null = null;
      try {
        parsed = body ? JSON.parse(body) : null;
      } catch {
        /* ignore */
      }
      recorded.push({
        method: req.method ?? "",
        url: req.url ?? "",
        auth: (req.headers["authorization"] as string) ?? "",
        body: parsed,
      });

      res.setHeader("Content-Type", "application/json");
      const addr = server.address() as AddressInfo;

      if (req.method === "POST" && req.url?.endsWith("/generate")) {
        const taskId = "task-" + Math.random().toString(36).slice(2, 10);
        pollCounts[taskId] = 0;
        res.statusCode = 200;
        return res.end(JSON.stringify({ taskId, status: "queued" }));
      }

      const m = req.url?.match(/\/status\/([^/?]+)/);
      if (req.method === "GET" && m) {
        const taskId = m[1];
        const n = (pollCounts[taskId] = (pollCounts[taskId] ?? 0) + 1);
        if (n < 2) {
          res.statusCode = 200;
          return res.end(JSON.stringify({ taskId, status: "processing" }));
        }
        res.statusCode = 200;
        return res.end(
          JSON.stringify({
            taskId,
            status: "complete",
            audioUrl: `http://127.0.0.1:${addr.port}/audio/${taskId}.mp3`,
          })
        );
      }

      res.statusCode = 404;
      res.end(JSON.stringify({ error: "not found" }));
    });
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address() as AddressInfo;
      resolve({
        baseUrl: `http://127.0.0.1:${addr.port}/v2`,
        close: () => server.close(),
      });
    });
  });
}

const checks: { name: string; ok: boolean; details?: string }[] = [];
function check(name: string, ok: boolean, details = "") {
  checks.push({ name, ok, details });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${details ? "  — " + details : ""}`);
}

async function main() {
  const mock = await startMockSuno();
  process.env.SUNO_API_KEY = "test-suno-key";
  process.env.SUNO_API_BASE_URL = mock.baseUrl;

  // Import AFTER env is set so the client reads the mock base URL.
  const suno = await import("../src/lib/suno/client");

  // --- model version mapping ---
  check("toSunoModelVersion('v4') -> chirp-v4", suno.toSunoModelVersion("v4") === "chirp-v4");
  check(
    "toSunoModelVersion('v3.5') -> chirp-v3-5",
    suno.toSunoModelVersion("v3.5") === "chirp-v3-5"
  );
  check(
    "toSunoModelVersion('chirp-v3-0') passthrough",
    suno.toSunoModelVersion("chirp-v3-0") === "chirp-v3-0"
  );
  check("toSunoModelVersion('') default -> chirp-v4", suno.toSunoModelVersion("") === "chirp-v4");

  // --- createGeneration ---
  const gen = await suno.createGeneration({
    prompt: "A retro synthwave track with driving bassline",
    negativePrompt: "muddy bass",
    lyrics: "",
    style: {
      genre: "Electronic",
      moods: ["Energetic", "Dreamy"],
      tempo: 125,
      key: "A",
      isMinor: true,
      instruments: ["Synth", "Drums", "Bass"],
      vocalStyle: "None",
      duration: "3min",
      sunoApiVersion: "v4",
    },
  });
  check("createGeneration returns a taskId", typeof gen.taskId === "string" && gen.taskId.length > 0, gen.taskId);

  const genReq = recorded.find((r) => r.method === "POST" && r.url.endsWith("/generate"));
  check("POST /generate was sent", !!genReq);
  if (genReq) {
    check(
      "Authorization header carries SUNO_API_KEY",
      genReq.auth === "Bearer test-suno-key",
      genReq.auth
    );
    const b = genReq.body ?? {};
    check("body.prompt includes genre + tempo + key", typeof b.prompt === "string" && /Electronic/.test(b.prompt as string) && /125 BPM/.test(b.prompt as string) && /Key of A minor/.test(b.prompt as string), b.prompt as string);
    check("body.duration parses '3min' to 180", b.duration === 180, String(b.duration));
    check("body.make_instrumental true when vocalStyle None", b.make_instrumental === true, String(b.make_instrumental));
    check("body.mv mapped to chirp-v4", b.mv === "chirp-v4", String(b.mv));
    check("body.negative_prompt forwarded", b.negative_prompt === "muddy bass", String(b.negative_prompt));
    check("lyrics omitted for instrumental track", !("lyrics" in b));
  }

  // --- getGenerationStatus lifecycle ---
  const s1 = await suno.getGenerationStatus(gen.taskId);
  check("first status poll -> processing", s1.status === "processing", s1.status);
  const s2 = await suno.getGenerationStatus(gen.taskId);
  check("second status poll -> complete with audioUrl", s2.status === "complete" && !!s2.audioUrl, `${s2.status} ${s2.audioUrl ?? ""}`);

  // --- lyrics forwarded when vocals requested ---
  recorded.length = 0;
  await suno.createGeneration({
    prompt: "ballad",
    lyrics: "[Verse]\nhello world",
    style: {
      genre: "Pop",
      moods: ["Melancholic"],
      tempo: 90,
      key: "E",
      isMinor: true,
      instruments: ["Guitar"],
      vocalStyle: "Female",
      duration: "2min",
      sunoApiVersion: "v3.5",
    },
  });
  const vocalReq = recorded.find((r) => r.url.endsWith("/generate"));
  check(
    "lyrics forwarded when vocalStyle != None",
    !!vocalReq && (vocalReq.body as Record<string, unknown>).lyrics === "[Verse]\nhello world"
  );
  check(
    "duration parses '2min' to 120",
    !!vocalReq && (vocalReq.body as Record<string, unknown>).duration === 120
  );
  check(
    "make_instrumental false when vocals requested",
    !!vocalReq && (vocalReq.body as Record<string, unknown>).make_instrumental === false
  );

  mock.close();

  const failed = checks.filter((c) => !c.ok).length;
  console.log(`\n=== ${checks.length - failed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
