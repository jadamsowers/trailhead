-- Create change_log table for incremental offline synchronization
CREATE TABLE "public"."change_log" (
  "id" uuid NOT NULL,
  "entity_type" character varying(50) NOT NULL,
  "entity_id" uuid NULL,
  "op_type" character varying(10) NOT NULL,
  "version" integer NOT NULL DEFAULT 1,
  "payload_hash" character varying(64) NULL,
  "created_at" timestamp NOT NULL,
  PRIMARY KEY ("id")
);

-- Indexes to accelerate delta queries and entity lookups
CREATE INDEX "ix_change_log_created_at" ON "public"."change_log" ("created_at");
CREATE INDEX "ix_change_log_entity_type_created_at" ON "public"."change_log" ("entity_type", "created_at");
CREATE INDEX "ix_change_log_entity_type_entity_id" ON "public"."change_log" ("entity_type", "entity_id");

-- Uniqueness constraint for version sequencing per entity
CREATE UNIQUE INDEX "uq_change_log_entity_version" ON "public"."change_log" ("entity_type", "entity_id", "version");

COMMENT ON TABLE "public"."change_log" IS 'Append-only change log for incremental client sync';
COMMENT ON COLUMN "public"."change_log"."payload_hash" IS 'Optional stable hash of entity payload for client-side diff suppression';
