CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(64) NOT NULL UNIQUE,
  track_id UUID NOT NULL,
  version_id UUID NOT NULL,
  track_name VARCHAR(255) NOT NULL,
  version_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  revoked_at TIMESTAMP
);
