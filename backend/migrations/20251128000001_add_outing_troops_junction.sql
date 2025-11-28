-- Add outing_troops junction table for many-to-many relationship between outings and troops
CREATE TABLE IF NOT EXISTS "public"."outing_troops" (
  "outing_id" uuid NOT NULL,
  "troop_id" uuid NOT NULL,
  PRIMARY KEY ("outing_id", "troop_id"),
  CONSTRAINT "outing_troops_outing_id_fkey" FOREIGN KEY ("outing_id") REFERENCES "public"."outings"("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "outing_troops_troop_id_fkey" FOREIGN KEY ("troop_id") REFERENCES "public"."troops"("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS "ix_outing_troops_outing_id" ON "public"."outing_troops" ("outing_id");
CREATE INDEX IF NOT EXISTS "ix_outing_troops_troop_id" ON "public"."outing_troops" ("troop_id");
