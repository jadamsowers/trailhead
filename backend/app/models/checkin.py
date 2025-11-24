from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.db.base import Base


class CheckIn(Base):
    """CheckIn model for tracking participant attendance at outings"""
    __tablename__ = "checkins"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    outing_id = Column(UUID(as_uuid=True), ForeignKey("outings.id", ondelete="CASCADE"), nullable=False, index=True)
    signup_id = Column(UUID(as_uuid=True), ForeignKey("signups.id", ondelete="CASCADE"), nullable=False, index=True)
    participant_id = Column(UUID(as_uuid=True), ForeignKey("participants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Who performed the check-in (user email or name)
    checked_in_by = Column(String(255), nullable=False)
    
    # When the check-in occurred
    checked_in_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    outing = relationship("Outing", backref="checkins")
    signup = relationship("Signup", backref="checkins")
    participant = relationship("Participant", backref="checkins")

    # Ensure one check-in per participant per outing
    __table_args__ = (
        UniqueConstraint('outing_id', 'participant_id', name='uq_checkin_outing_participant'),
    )

    def __repr__(self):
        return f"<CheckIn(id={self.id}, outing_id={self.outing_id}, participant_id={self.participant_id})>"
