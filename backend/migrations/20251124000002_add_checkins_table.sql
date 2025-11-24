-- Create "checkins" table
CREATE TABLE "public"."checkins" (
  "id" uuid NOT NULL,
  "outing_id" uuid NOT NULL,
  "signup_id" uuid NOT NULL,
  "participant_id" uuid NOT NULL,
  "checked_in_by" character varying(255) NOT NULL,
  "checked_in_at" timestamp NOT NULL,
  "created_at" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_checkin_outing_participant" UNIQUE ("outing_id", "participant_id"),
  CONSTRAINT "checkins_outing_id_fkey" FOREIGN KEY ("outing_id") REFERENCES "public"."outings" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "checkins_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "public"."participants" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "checkins_signup_id_fkey" FOREIGN KEY ("signup_id") REFERENCES "public"."signups" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "ix_checkins_id" to table: "checkins"
CREATE INDEX "ix_checkins_id" ON "public"."checkins" ("id");
-- Create index "ix_checkins_outing_id" to table: "checkins"
CREATE INDEX "ix_checkins_outing_id" ON "public"."checkins" ("outing_id");
-- Create index "ix_checkins_participant_id" to table: "checkins"
CREATE INDEX "ix_checkins_participant_id" ON "public"."checkins" ("participant_id");
-- Create index "ix_checkins_signup_id" to table: "checkins"
CREATE INDEX "ix_checkins_signup_id" ON "public"."checkins" ("signup_id");
