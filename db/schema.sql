-- Content store for the portfolio.
--
-- site_settings holds one row per editable block of copy (profile, hero, about, ...).
-- site_items holds one row per repeatable entry (projects, skills, certificates, ...).
-- The `data` column is JSONB, so the shape of an entry is owned by the app, not the schema.

CREATE TABLE IF NOT EXISTS site_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection TEXT NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0,
  data       JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS site_items_collection_position_idx
  ON site_items (collection, position);
