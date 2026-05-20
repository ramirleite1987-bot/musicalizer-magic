export async function register() {
  if (process.env.NEON_LOCAL_PROXY) {
    const originalFetch = globalThis.fetch;
    const proxyTarget = process.env.NEON_LOCAL_PROXY;
    globalThis.fetch = (async (
      input: RequestInfo | URL,
      init?: RequestInit
    ) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      if (url.includes("/sql") && url.includes("localtest.me")) {
        return originalFetch(proxyTarget, init);
      }
      return originalFetch(input, init);
    }) as typeof fetch;
  }

  // Auto-apply pending schema migrations on cold start (idempotent — uses IF NOT EXISTS)
  if (process.env.DATABASE_URL) {
    try {
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(process.env.DATABASE_URL);
      await sql`ALTER TABLE tracks ADD COLUMN IF NOT EXISTS tags jsonb NOT NULL DEFAULT '[]'::jsonb`;
    } catch (err) {
      // Non-fatal: if the column already exists or DB is unreachable, continue normally
      console.warn("[instrumentation] auto-migration warning:", err);
    }
  }
}
