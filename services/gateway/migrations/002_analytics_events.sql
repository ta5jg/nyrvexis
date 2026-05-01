-- Phase 13: append-only product analytics (ingest → warehouse later)
CREATE TABLE IF NOT EXISTS analytics_events (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id text,
  name text NOT NULL,
  props jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_name_idx ON analytics_events (name);
