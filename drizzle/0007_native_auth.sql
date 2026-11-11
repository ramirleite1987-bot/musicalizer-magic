CREATE TABLE IF NOT EXISTS auth_users (
  id TEXT PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  name VARCHAR(80) NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash VARCHAR(64) PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS auth_sessions_expires_at_idx ON auth_sessions (expires_at);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS auth_attempts (
  key VARCHAR(64) PRIMARY KEY,
  attempts INTEGER NOT NULL,
  reset_at TIMESTAMPTZ NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS auth_attempts_reset_at_idx ON auth_attempts (reset_at);
