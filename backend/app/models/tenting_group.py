from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.db.base import Base


class TentingGroup(Base):
    """Tenting group model for managing scout tent assignments"""
    __tablename__ = "tenting_groups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    outing_id = Column(UUID(as_uuid=True), ForeignKey("outings.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    outing = relationship("Outing", back_populates="tenting_groups")
    members = relationship("TentingGroupMember", back_populates="tenting_group", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<TentingGroup(id={self.id}, outing_id={self.outing_id}, name={self.name})>"

    @property
    def member_count(self):
        """Get total number of members in this tenting group"""
        return len(self.members)


class TentingGroupMember(Base):
    """Tenting group member model linking participants to tenting groups"""
    __tablename__ = "tenting_group_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenting_group_id = Column(UUID(as_uuid=True), ForeignKey("tenting_groups.id", ondelete="CASCADE"), nullable=False, index=True)
    participant_id = Column(UUID(as_uuid=True), ForeignKey("participants.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    tenting_group = relationship("TentingGroup", back_populates="members")
    participant = relationship("Participant", back_populates="tenting_group_membership")

    def __repr__(self):
        return f"<TentingGroupMember(id={self.id}, tenting_group_id={self.tenting_group_id}, participant_id={self.participant_id})>"
