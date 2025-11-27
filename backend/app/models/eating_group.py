from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.db.base import Base


class EatingGroup(Base):
    """Eating group model for grubmaster meal planning"""
    __tablename__ = "eating_groups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    outing_id = Column(UUID(as_uuid=True), ForeignKey("outings.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    outing = relationship("Outing", back_populates="eating_groups")
    members = relationship("EatingGroupMember", back_populates="eating_group", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<EatingGroup(id={self.id}, outing_id={self.outing_id}, name={self.name})>"

    @property
    def member_count(self):
        """Get total number of members in this eating group"""
        return len(self.members)

    @property
    def grubmaster_count(self):
        """Get number of grubmasters in this eating group"""
        return sum(1 for m in self.members if m.is_grubmaster)

    @property
    def grubmasters(self):
        """Get list of grubmaster members"""
        return [m for m in self.members if m.is_grubmaster]


class EatingGroupMember(Base):
    """Eating group member model linking participants to eating groups"""
    __tablename__ = "eating_group_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    eating_group_id = Column(UUID(as_uuid=True), ForeignKey("eating_groups.id", ondelete="CASCADE"), nullable=False, index=True)
    participant_id = Column(UUID(as_uuid=True), ForeignKey("participants.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    is_grubmaster = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    eating_group = relationship("EatingGroup", back_populates="members")
    participant = relationship("Participant", back_populates="eating_group_membership")

    def __repr__(self):
        return f"<EatingGroupMember(id={self.id}, eating_group_id={self.eating_group_id}, participant_id={self.participant_id}, is_grubmaster={self.is_grubmaster})>"
