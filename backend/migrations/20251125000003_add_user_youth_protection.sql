-- Add youth_protection_expiration to users table
ALTER TABLE "users" ADD COLUMN "youth_protection_expiration" date NULL;
