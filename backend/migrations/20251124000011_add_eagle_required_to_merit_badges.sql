-- Migration: Add eagle_required flag to merit_badges
-- Adds a new column to store whether a merit badge is Eagle required.
-- Column stored as TEXT 'true'/'false' for consistency with existing CSV import logic.

ALTER TABLE merit_badges ADD COLUMN eagle_required BOOLEAN NOT NULL DEFAULT false;

-- Backfill: ensure existing badges flagged correctly if previously seeded (script will overwrite later)
-- No data update performed here; the recalculation script sets accurate values.

COMMENT ON COLUMN merit_badges.eagle_required IS 'Boolean flag indicating if the badge is Eagle-required.';
