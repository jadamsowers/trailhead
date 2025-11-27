-- Add grubmaster functionality
-- 1. Add treasurer_email to troops table for receipt submission
-- 2. Add food_budget_per_person and meal_count to outings table
-- 3. Create eating_groups table to manage grubmaster assignments
-- 4. Create eating_group_members table to track participants in eating groups
-- 5. Add grubmaster_request to participants table

-- Add treasurer_email to troops table
ALTER TABLE "public"."troops" ADD COLUMN "treasurer_email" character varying(255) NULL;

-- Add food budget fields to outings table
ALTER TABLE "public"."outings" ADD COLUMN "food_budget_per_person" numeric(10,2) NULL;
ALTER TABLE "public"."outings" ADD COLUMN "meal_count" integer NULL;
ALTER TABLE "public"."outings" ADD COLUMN "budget_type" character varying(20) DEFAULT 'total' NULL;
COMMENT ON COLUMN "public"."outings"."budget_type" IS 'Either total (budget_per_person is for entire outing) or per_meal (budget_per_person * meal_count)';

-- Add grubmaster request field to participants table
ALTER TABLE "public"."participants" ADD COLUMN "grubmaster_interest" boolean DEFAULT false NOT NULL;
ALTER TABLE "public"."participants" ADD COLUMN "grubmaster_reason" character varying(50) NULL;
COMMENT ON COLUMN "public"."participants"."grubmaster_reason" IS 'rank_requirement, cooking_merit_badge, or just_because';

-- Create eating_groups table
CREATE TABLE "public"."eating_groups" (
    "id" uuid NOT NULL,
    "outing_id" uuid NOT NULL,
    "name" character varying(100) NOT NULL,
    "notes" text NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id"),
    CONSTRAINT "eating_groups_outing_id_fkey" FOREIGN KEY ("outing_id") REFERENCES "public"."outings" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
CREATE INDEX "ix_eating_groups_id" ON "public"."eating_groups" ("id");
CREATE INDEX "ix_eating_groups_outing_id" ON "public"."eating_groups" ("outing_id");

-- Create eating_group_members table
CREATE TABLE "public"."eating_group_members" (
    "id" uuid NOT NULL,
    "eating_group_id" uuid NOT NULL,
    "participant_id" uuid NOT NULL,
    "is_grubmaster" boolean DEFAULT false NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id"),
    CONSTRAINT "eating_group_members_eating_group_id_fkey" FOREIGN KEY ("eating_group_id") REFERENCES "public"."eating_groups" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
    CONSTRAINT "eating_group_members_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "public"."participants" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
CREATE INDEX "ix_eating_group_members_id" ON "public"."eating_group_members" ("id");
CREATE INDEX "ix_eating_group_members_eating_group_id" ON "public"."eating_group_members" ("eating_group_id");
CREATE INDEX "ix_eating_group_members_participant_id" ON "public"."eating_group_members" ("participant_id");
-- Each participant can only be in one eating group per outing
CREATE UNIQUE INDEX "uq_eating_group_members_participant_id" ON "public"."eating_group_members" ("participant_id");
