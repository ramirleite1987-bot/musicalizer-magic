CREATE TABLE IF NOT EXISTS generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID,
  version_id UUID,
  provider VARCHAR(32) NOT NULL,
  model VARCHAR(64),
  status VARCHAR(32) NOT NULL,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
