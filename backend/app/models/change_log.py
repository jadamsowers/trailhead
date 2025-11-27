from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_mixin
import uuid
from datetime import datetime

from app.db.base import Base

class ChangeLog(Base):
    """Change log entries used for incremental offline sync.
    Each row represents a mutation event for a domain entity.
    Query using created_at + id for keyset pagination.
    """
    __tablename__ = "change_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    entity_type = Column(String(50), nullable=False, index=True)  # e.g. 'outing', 'signup', 'participant'
    entity_id = Column(UUID(as_uuid=True), nullable=True, index=True)  # UUID of the entity affected (nullable for global events)
    op_type = Column(String(10), nullable=False)  # 'create' | 'update' | 'delete'
    version = Column(Integer, nullable=False, default=1)  # Incrementing version per (entity_type, entity_id)
    payload_hash = Column(String(64), nullable=True)  # Optional content hash to allow client skip if unchanged structure
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    def __repr__(self):  # pragma: no cover - debug helper
        return f"<ChangeLog(id={self.id}, entity_type={self.entity_type}, op_type={self.op_type}, version={self.version})>"
