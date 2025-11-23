-- Create "users" table
CREATE TABLE "public"."users" (
  "id" uuid NOT NULL,
  "email" character varying(255) NOT NULL,
  "hashed_password" character varying(255) NOT NULL,
  "full_name" character varying(255) NOT NULL,
  "role" character varying(50) NOT NULL,
  "is_active" boolean NOT NULL,
  "is_initial_admin" boolean NOT NULL,
  "phone" character varying(50) NULL,
  "emergency_contact_name" character varying(255) NULL,
  "emergency_contact_phone" character varying(50) NULL,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL,
  PRIMARY KEY ("id")
);
-- Create index "ix_users_email" to table: "users"
CREATE UNIQUE INDEX "ix_users_email" ON "public"."users" ("email");
-- Create index "ix_users_id" to table: "users"
CREATE INDEX "ix_users_id" ON "public"."users" ("id");
-- Create index "ix_users_role" to table: "users"
CREATE INDEX "ix_users_role" ON "public"."users" ("role");
-- Create "family_members" table
CREATE TABLE "public"."family_members" (
  "id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "name" character varying(255) NOT NULL,
  "member_type" character varying(50) NOT NULL,
  "date_of_birth" date NULL,
  "gender" character varying(20) NULL,
  "troop_number" character varying(50) NULL,
  "patrol_name" character varying(100) NULL,
  "has_youth_protection" boolean NOT NULL,
  "youth_protection_expiration" date NULL,
  "vehicle_capacity" integer NOT NULL,
  "medical_notes" text NULL,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "family_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "ix_family_members_gender" to table: "family_members"
CREATE INDEX "ix_family_members_gender" ON "public"."family_members" ("gender");
-- Create index "ix_family_members_id" to table: "family_members"
CREATE INDEX "ix_family_members_id" ON "public"."family_members" ("id");
-- Create index "ix_family_members_member_type" to table: "family_members"
CREATE INDEX "ix_family_members_member_type" ON "public"."family_members" ("member_type");
-- Create index "ix_family_members_troop_number" to table: "family_members"
CREATE INDEX "ix_family_members_troop_number" ON "public"."family_members" ("troop_number");
-- Create index "ix_family_members_user_id" to table: "family_members"
CREATE INDEX "ix_family_members_user_id" ON "public"."family_members" ("user_id");
-- Create "family_member_allergies" table
CREATE TABLE "public"."family_member_allergies" (
  "id" uuid NOT NULL,
  "family_member_id" uuid NOT NULL,
  "allergy" character varying(100) NOT NULL,
  "severity" character varying(50) NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "family_member_allergies_family_member_id_fkey" FOREIGN KEY ("family_member_id") REFERENCES "public"."family_members" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "ix_family_member_allergies_family_member_id" to table: "family_member_allergies"
CREATE INDEX "ix_family_member_allergies_family_member_id" ON "public"."family_member_allergies" ("family_member_id");
-- Create index "ix_family_member_allergies_id" to table: "family_member_allergies"
CREATE INDEX "ix_family_member_allergies_id" ON "public"."family_member_allergies" ("id");
-- Create "family_member_dietary_preferences" table
CREATE TABLE "public"."family_member_dietary_preferences" (
  "id" uuid NOT NULL,
  "family_member_id" uuid NOT NULL,
  "preference" character varying(100) NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "family_member_dietary_preferences_family_member_id_fkey" FOREIGN KEY ("family_member_id") REFERENCES "public"."family_members" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "ix_family_member_dietary_preferences_family_member_id" to table: "family_member_dietary_preferences"
CREATE INDEX "ix_family_member_dietary_preferences_family_member_id" ON "public"."family_member_dietary_preferences" ("family_member_id");
-- Create index "ix_family_member_dietary_preferences_id" to table: "family_member_dietary_preferences"
CREATE INDEX "ix_family_member_dietary_preferences_id" ON "public"."family_member_dietary_preferences" ("id");
-- Create "outings" table
CREATE TABLE "public"."outings" (
  "id" uuid NOT NULL,
  "name" character varying(255) NOT NULL,
  "outing_date" date NOT NULL,
  "end_date" date NULL,
  "location" character varying(255) NOT NULL,
  "description" text NULL,
  "max_participants" integer NOT NULL,
  "capacity_type" character varying(20) NOT NULL,
  "is_overnight" boolean NOT NULL,
  "outing_lead_name" character varying(255) NULL,
  "outing_lead_email" character varying(255) NULL,
  "outing_lead_phone" character varying(50) NULL,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL,
  PRIMARY KEY ("id")
);
-- Create index "ix_outings_end_date" to table: "outings"
CREATE INDEX "ix_outings_end_date" ON "public"."outings" ("end_date");
-- Create index "ix_outings_id" to table: "outings"
CREATE INDEX "ix_outings_id" ON "public"."outings" ("id");
-- Create index "ix_outings_outing_date" to table: "outings"
CREATE INDEX "ix_outings_outing_date" ON "public"."outings" ("outing_date");
-- Create "signups" table
CREATE TABLE "public"."signups" (
  "id" uuid NOT NULL,
  "outing_id" uuid NOT NULL,
  "family_contact_name" character varying(255) NOT NULL,
  "family_contact_email" character varying(255) NOT NULL,
  "family_contact_phone" character varying(50) NULL,
  "created_at" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "signups_outing_id_fkey" FOREIGN KEY ("outing_id") REFERENCES "public"."outings" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "ix_signups_id" to table: "signups"
CREATE INDEX "ix_signups_id" ON "public"."signups" ("id");
-- Create index "ix_signups_outing_id" to table: "signups"
CREATE INDEX "ix_signups_outing_id" ON "public"."signups" ("outing_id");
-- Create "participants" table
CREATE TABLE "public"."participants" (
  "id" uuid NOT NULL,
  "signup_id" uuid NOT NULL,
  "family_member_id" uuid NOT NULL,
  "created_at" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "participants_family_member_id_fkey" FOREIGN KEY ("family_member_id") REFERENCES "public"."family_members" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "participants_signup_id_fkey" FOREIGN KEY ("signup_id") REFERENCES "public"."signups" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "ix_participants_family_member_id" to table: "participants"
CREATE INDEX "ix_participants_family_member_id" ON "public"."participants" ("family_member_id");
-- Create index "ix_participants_id" to table: "participants"
CREATE INDEX "ix_participants_id" ON "public"."participants" ("id");
-- Create index "ix_participants_signup_id" to table: "participants"
CREATE INDEX "ix_participants_signup_id" ON "public"."participants" ("signup_id");
-- Create "refresh_tokens" table
CREATE TABLE "public"."refresh_tokens" (
  "id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "token" character varying(500) NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp NOT NULL,
  "revoked" boolean NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "ix_refresh_tokens_id" to table: "refresh_tokens"
CREATE INDEX "ix_refresh_tokens_id" ON "public"."refresh_tokens" ("id");
-- Create index "ix_refresh_tokens_token" to table: "refresh_tokens"
CREATE INDEX "ix_refresh_tokens_token" ON "public"."refresh_tokens" ("token");
-- Create index "ix_refresh_tokens_user_id" to table: "refresh_tokens"
CREATE INDEX "ix_refresh_tokens_user_id" ON "public"."refresh_tokens" ("user_id");
