-- Add cancellation_deadline to outings table
-- Migration: 20251126000001_add_cancellation_deadline.sql

ALTER TABLE outings ADD COLUMN cancellation_deadline TIMESTAMP WITHOUT TIME ZONE;
