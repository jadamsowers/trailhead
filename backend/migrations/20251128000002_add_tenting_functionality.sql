-- Add tenting functionality for scout tent assignments
-- 1. Create tenting_groups table for managing tent assignments
-- 2. Create tenting_group_members table to track scouts in tents

-- Create tenting_groups table
CREATE TABLE "public"."tenting_groups" (
    "id" uuid NOT NULL,
    "outing_id" uuid NOT NULL,
    "name" character varying(100) NOT NULL,
    "notes" text NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id"),
    CONSTRAINT "tenting_groups_outing_id_fkey" FOREIGN KEY ("outing_id") REFERENCES "public"."outings" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
CREATE INDEX "ix_tenting_groups_id" ON "public"."tenting_groups" ("id");
CREATE INDEX "ix_tenting_groups_outing_id" ON "public"."tenting_groups" ("outing_id");

-- Create tenting_group_members table
CREATE TABLE "public"."tenting_group_members" (
    "id" uuid NOT NULL,
    "tenting_group_id" uuid NOT NULL,
    "participant_id" uuid NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id"),
    CONSTRAINT "tenting_group_members_tenting_group_id_fkey" FOREIGN KEY ("tenting_group_id") REFERENCES "public"."tenting_groups" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
    CONSTRAINT "tenting_group_members_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "public"."participants" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
CREATE INDEX "ix_tenting_group_members_id" ON "public"."tenting_group_members" ("id");
CREATE INDEX "ix_tenting_group_members_tenting_group_id" ON "public"."tenting_group_members" ("tenting_group_id");
CREATE INDEX "ix_tenting_group_members_participant_id" ON "public"."tenting_group_members" ("participant_id");
-- Each participant can only be in one tenting group per outing
CREATE UNIQUE INDEX "uq_tenting_group_members_participant_id" ON "public"."tenting_group_members" ("participant_id");
