-- Add roster_members table for storing imported roster data from my.scouting.org
-- This serves as a staging area and source of truth for BSA member data

CREATE TABLE "public"."roster_members" (
  "bsa_member_id" character varying(50) NOT NULL,
  "full_name" character varying(255) NOT NULL,
  "first_name" character varying(100) NULL,
  "middle_name" character varying(100) NULL,
  "last_name" character varying(100) NULL,
  "suffix" character varying(50) NULL,
  "email" character varying(255) NULL,
  "mobile_phone" character varying(50) NULL,
  "city" character varying(100) NULL,
  "state" character varying(50) NULL,
  "zip_code" character varying(20) NULL,
  "position" character varying(100) NULL,
  "ypt_date" date NULL,
  "ypt_expiration" date NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("bsa_member_id")
);

CREATE INDEX "ix_roster_members_bsa_member_id" ON "public"."roster_members" ("bsa_member_id");
