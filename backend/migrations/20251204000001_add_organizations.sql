-- Add Organizations (Instance) table
-- Each organization represents a distinct Trailhead instance (e.g., "Troop 123", "Ivy Scouts", "District 5")
-- Organizations can have multiple troops and manage their roster independently

CREATE TABLE "public"."organizations" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" character varying(255) NOT NULL,
  "description" text NULL,
  "is_setup_complete" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE INDEX "ix_organizations_id" ON "public"."organizations" ("id");
CREATE INDEX "ix_organizations_name" ON "public"."organizations" ("name");

-- Add organization_id to troops table
ALTER TABLE "public"."troops" ADD COLUMN "organization_id" uuid NULL;
ALTER TABLE "public"."troops" ADD CONSTRAINT "troops_organization_id_fkey" 
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE NO ACTION ON DELETE CASCADE;
CREATE INDEX "ix_troops_organization_id" ON "public"."troops" ("organization_id");

-- Add organization_id to users table (to track which organization a user belongs to)
ALTER TABLE "public"."users" ADD COLUMN "organization_id" uuid NULL;
ALTER TABLE "public"."users" ADD CONSTRAINT "users_organization_id_fkey" 
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE NO ACTION ON DELETE SET NULL;
CREATE INDEX "ix_users_organization_id" ON "public"."users" ("organization_id");
