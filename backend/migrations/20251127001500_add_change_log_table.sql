-- Create change_log table for incremental sync
CREATE TABLE IF NOT EXISTS change_log (
  id uuid PRIMARY KEY,
  entity_type varchar(50) NOT NULL,
  entity_id uuid NULL,
  op_type varchar(10) NOT NULL,
  version integer NOT NULL DEFAULT 1,
  payload_hash varchar(64) NULL,
  created_at timestamp NOT NULL
);

-- Indexes to support delta queries and filtering
CREATE INDEX IF NOT EXISTS ix_change_log_entity_type ON change_log(entity_type);
CREATE INDEX IF NOT EXISTS ix_change_log_entity_id ON change_log(entity_id);
CREATE INDEX IF NOT EXISTS ix_change_log_created_at ON change_log(created_at);
CREATE INDEX IF NOT EXISTS ix_change_log_entity_composite ON change_log(entity_type, entity_id);

COMMENT ON TABLE change_log IS 'Append-only log of entity changes for offline incremental synchronization.';
COMMENT ON COLUMN change_log.entity_type IS 'Type of entity (outing|signup|participant|place|requirement|user etc.)';
COMMENT ON COLUMN change_log.entity_id IS 'UUID of the entity affected; nullable for global events';
COMMENT ON COLUMN change_log.op_type IS 'create|update|delete';
COMMENT ON COLUMN change_log.version IS 'Monotonic version per (entity_type, entity_id)';
COMMENT ON COLUMN change_log.payload_hash IS 'Optional SHA-256 hash of serialized entity payload for client dedup';
COMMENT ON COLUMN change_log.created_at IS 'UTC timestamp when the change was recorded';
