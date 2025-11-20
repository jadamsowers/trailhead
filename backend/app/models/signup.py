from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.db.base import Base


class Signup(Base):
    """Signup model for family trip registrations"""
    __tablename__ = "signups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    family_contact_name = Column(String(255), nullable=False)
    family_contact_email = Column(String(255), nullable=False)
    family_contact_phone = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    trip = relationship("Trip", back_populates="signups")
    participants = relationship("Participant", back_populates="signup", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Signup(id={self.id}, trip_id={self.trip_id}, contact={self.family_contact_name})>"

    @property
    def participant_count(self):
        """Get total number of participants in this signup"""
        return len(self.participants)

    @property
    def scout_count(self):
        """Get number of scouts in this signup"""
        return sum(1 for p in self.participants if p.participant_type == "scout")

    @property
    def adult_count(self):
        """Get number of adults in this signup"""
        return sum(1 for p in self.participants if p.participant_type == "adult")