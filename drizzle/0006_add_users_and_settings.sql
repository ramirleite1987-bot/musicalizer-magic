ALTER TABLE tracks ADD COLUMN IF NOT EXISTS user_id TEXT;--> statement-breakpoint
ALTER TABLE themes ADD COLUMN IF NOT EXISTS user_id TEXT;--> statement-breakpoint
ALTER TABLE style_presets ADD COLUMN IF NOT EXISTS user_id TEXT;--> statement-breakpoint
ALTER TABLE generation_logs ADD COLUMN IF NOT EXISTS user_id TEXT;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS tracks_user_id_idx ON tracks (user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS themes_user_id_idx ON themes (user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS style_presets_user_id_idx ON style_presets (user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS generation_logs_user_id_idx ON generation_logs (user_id);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '' NOT NULL,
  category VARCHAR(50) DEFAULT 'general' NOT NULL,
  instructions TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS skills_user_id_idx ON skills (user_id);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY,
  display_name VARCHAR(255),
  llm_provider VARCHAR(32) DEFAULT 'openrouter' NOT NULL,
  llm_model VARCHAR(128),
  default_music_provider VARCHAR(32) DEFAULT 'suno' NOT NULL,
  default_genre VARCHAR(100),
  openrouter_key_enc TEXT,
  minimax_key_enc TEXT,
  suno_key_enc TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
