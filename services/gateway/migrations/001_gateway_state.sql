-- Phase 13: single JSON document (same shape as FileStore store.json)
CREATE TABLE IF NOT EXISTS gateway_state (
  id text PRIMARY KEY,
  body jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
