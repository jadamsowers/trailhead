-- Add icon column to outings table
ALTER TABLE outings ADD COLUMN IF NOT EXISTS icon VARCHAR(50) NULL;