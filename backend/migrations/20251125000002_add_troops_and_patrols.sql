-- Add Troops and Patrols tables plus relational foreign keys
-- Troops represent distinct scouting units; Patrols belong to Troops
-- Also adds relational references to family_members and outings for restriction logic

-- Create "troops" table
CREATE TABLE "public"."troops" (
  "id" uuid NOT NULL,
  "number" character varying(50) NOT NULL,
  "charter_org" character varying(255) NULL,
  "meeting_location" character varying(255) NULL,
  "meeting_day" character varying(20) NULL,
  "notes" text NULL,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL,
  PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "uq_troops_number" ON "public"."troops" ("number");
CREATE INDEX "ix_troops_id" ON "public"."troops" ("id");

-- Create "patrols" table
CREATE TABLE "public"."patrols" (
  "id" uuid NOT NULL,
  "troop_id" uuid NOT NULL,
  "name" character varying(100) NOT NULL,
  "is_active" boolean NOT NULL,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "patrols_troop_id_fkey" FOREIGN KEY ("troop_id") REFERENCES "public"."troops" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
CREATE UNIQUE INDEX "uq_patrols_troop_id_name" ON "public"."patrols" ("troop_id", "name");
CREATE INDEX "ix_patrols_id" ON "public"."patrols" ("id");
CREATE INDEX "ix_patrols_troop_id" ON "public"."patrols" ("troop_id");

-- Add relational columns to family_members (non-breaking; legacy troop_number/patrol_name retained)
ALTER TABLE "public"."family_members" ADD COLUMN "troop_id" uuid NULL;
ALTER TABLE "public"."family_members" ADD COLUMN "patrol_id" uuid NULL;
ALTER TABLE "public"."family_members" ADD CONSTRAINT "family_members_troop_id_fkey" FOREIGN KEY ("troop_id") REFERENCES "public"."troops"("id") ON UPDATE NO ACTION ON DELETE SET NULL;
ALTER TABLE "public"."family_members" ADD CONSTRAINT "family_members_patrol_id_fkey" FOREIGN KEY ("patrol_id") REFERENCES "public"."patrols"("id") ON UPDATE NO ACTION ON DELETE SET NULL;
CREATE INDEX "ix_family_members_troop_id" ON "public"."family_members" ("troop_id");
CREATE INDEX "ix_family_members_patrol_id" ON "public"."family_members" ("patrol_id");

-- Add outing restriction column (optional troop lock for signups)
ALTER TABLE "public"."outings" ADD COLUMN "restricted_troop_id" uuid NULL;
ALTER TABLE "public"."outings" ADD CONSTRAINT "outings_restricted_troop_id_fkey" FOREIGN KEY ("restricted_troop_id") REFERENCES "public"."troops"("id") ON UPDATE NO ACTION ON DELETE SET NULL;
CREATE INDEX "ix_outings_restricted_troop_id" ON "public"."outings" ("restricted_troop_id");
