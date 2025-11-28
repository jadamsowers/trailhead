from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.db.base import Base

# Import the association table (will be defined in outing.py)
# We import it here to avoid circular import issues
def get_outing_troops_table():
    from app.models.outing import outing_troops
    return outing_troops


class Troop(Base):
    """Troop model representing a scouting unit"""
    __tablename__ = "troops"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    number = Column(String(50), nullable=False, unique=True)
    charter_org = Column(String(255), nullable=True)
    meeting_location = Column(String(255), nullable=True)
    meeting_day = Column(String(20), nullable=True)  # e.g., 'Tuesday'
    notes = Column(Text, nullable=True)
    treasurer_email = Column(String(255), nullable=True)  # Email for receipt submission
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    patrols = relationship("Patrol", back_populates="troop", cascade="all, delete-orphan")
    family_members = relationship("FamilyMember", back_populates="troop")
    restricted_outings = relationship("Outing", back_populates="restricted_troop")
    allowed_outings = relationship("Outing", secondary="outing_troops", back_populates="allowed_troops")

    def __repr__(self):
        return f"<Troop(id={self.id}, number={self.number})>"


class Patrol(Base):
    """Patrol model representing a subdivision within a troop"""
    __tablename__ = "patrols"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    troop_id = Column(UUID(as_uuid=True), ForeignKey("troops.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    troop = relationship("Troop", back_populates="patrols")
    family_members = relationship("FamilyMember", back_populates="patrol")

    def __repr__(self):
        return f"<Patrol(id={self.id}, troop_id={self.troop_id}, name={self.name})>"
