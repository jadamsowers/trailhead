-- Add timezone column to users for per-user local time rendering
-- Version: 20251126150000_add_user_timezone.sql

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) NOT NULL DEFAULT 'America/New_York';
