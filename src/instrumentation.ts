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
      await sql`CREATE TABLE IF NOT EXISTS style_presets (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(255) NOT NULL, style JSONB NOT NULL, created_at TIMESTAMP DEFAULT NOW() NOT NULL)`;
      await sql`CREATE TABLE IF NOT EXISTS generation_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), track_id UUID, version_id UUID, provider VARCHAR(32) NOT NULL, model VARCHAR(64), status VARCHAR(32) NOT NULL, duration_ms INTEGER, created_at TIMESTAMP DEFAULT NOW() NOT NULL)`;
      await sql`ALTER TABLE tracks ADD COLUMN IF NOT EXISTS user_id TEXT`;
      await sql`ALTER TABLE themes ADD COLUMN IF NOT EXISTS user_id TEXT`;
      await sql`ALTER TABLE style_presets ADD COLUMN IF NOT EXISTS user_id TEXT`;
      await sql`ALTER TABLE generation_logs ADD COLUMN IF NOT EXISTS user_id TEXT`;
      await sql`CREATE INDEX IF NOT EXISTS tracks_user_id_idx ON tracks (user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS themes_user_id_idx ON themes (user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS style_presets_user_id_idx ON style_presets (user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS generation_logs_user_id_idx ON generation_logs (user_id)`;
      await sql`CREATE TABLE IF NOT EXISTS user_settings (user_id TEXT PRIMARY KEY, display_name VARCHAR(255), llm_provider VARCHAR(32) DEFAULT 'openrouter' NOT NULL, llm_model VARCHAR(128), default_music_provider VARCHAR(32) DEFAULT 'suno' NOT NULL, default_genre VARCHAR(100), openrouter_key_enc TEXT, minimax_key_enc TEXT, suno_key_enc TEXT, created_at TIMESTAMP DEFAULT NOW() NOT NULL, updated_at TIMESTAMP DEFAULT NOW() NOT NULL)`;
      await sql`CREATE TABLE IF NOT EXISTS skills (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id TEXT, name VARCHAR(255) NOT NULL, description TEXT DEFAULT '' NOT NULL, category VARCHAR(50) DEFAULT 'general' NOT NULL, instructions TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW() NOT NULL, updated_at TIMESTAMP DEFAULT NOW() NOT NULL)`;
      await sql`CREATE INDEX IF NOT EXISTS skills_user_id_idx ON skills (user_id)`;
    } catch (err) {
      // Non-fatal: if the column already exists or DB is unreachable, continue normally
      console.warn("[instrumentation] auto-migration warning:", err);
    }
  }
}
