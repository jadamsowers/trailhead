-- Add signup closure fields to outings table
-- Migration: 20251124000010_add_signup_closure.sql

-- Add signups_close_at field for automatic closure based on date/time
ALTER TABLE outings 
ADD COLUMN signups_close_at TIMESTAMP WITHOUT TIME ZONE;

-- Add signups_closed field for manual closure by admins
ALTER TABLE outings 
ADD COLUMN signups_closed BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index for querying outings with open signups
CREATE INDEX ix_outings_signups_closed ON outings (signups_closed);

-- Add index for querying outings by signup closure date
CREATE INDEX ix_outings_signups_close_at ON outings (signups_close_at);
