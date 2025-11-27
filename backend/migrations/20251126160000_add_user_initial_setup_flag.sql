-- Add initial_setup_complete flag to users table
-- Version: 20251126160000_add_user_initial_setup_flag.sql

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS initial_setup_complete BOOLEAN NOT NULL DEFAULT FALSE;
