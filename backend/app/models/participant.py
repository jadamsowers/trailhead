from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.db.base import Base


class Participant(Base):
    """Participant model for scouts and adults attending trips"""
    __tablename__ = "participants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    signup_id = Column(UUID(as_uuid=True), ForeignKey("signups.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    age = Column(Integer, nullable=False)
    participant_type = Column(String(50), nullable=False, index=True)  # 'scout' or 'adult'
    is_adult = Column(Boolean, default=False, nullable=False)
    gender = Column(String(20), nullable=False, index=True)  # 'male', 'female', 'other'
    
    # Scout-specific fields
    troop_number = Column(String(50), index=True)  # e.g., "123", "456" (null for adults)
    patrol_name = Column(String(100))  # e.g., "Eagle Patrol", "Wolf Patrol" (null for adults)
    
    # Adult-specific fields
    has_youth_protection = Column(Boolean, default=False, nullable=False)
    vehicle_capacity = Column(Integer, default=0, nullable=False)
    
    # Medical information
    medical_notes = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    signup = relationship("Signup", back_populates="participants")
    dietary_restrictions = relationship("DietaryRestriction", back_populates="participant", cascade="all, delete-orphan")
    allergies = relationship("Allergy", back_populates="participant", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Participant(id={self.id}, name={self.name}, type={self.participant_type})>"


class DietaryRestriction(Base):
    """Dietary restriction model for tracking participant dietary needs"""
    __tablename__ = "dietary_restrictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    participant_id = Column(UUID(as_uuid=True), ForeignKey("participants.id", ondelete="CASCADE"), nullable=False, index=True)
    restriction_type = Column(String(100), nullable=False)  # vegetarian, vegan, gluten-free, etc.

    # Relationships
    participant = relationship("Participant", back_populates="dietary_restrictions")

    def __repr__(self):
        return f"<DietaryRestriction(id={self.id}, type={self.restriction_type})>"


class Allergy(Base):
    """Allergy model for tracking participant allergies"""
    __tablename__ = "allergies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    participant_id = Column(UUID(as_uuid=True), ForeignKey("participants.id", ondelete="CASCADE"), nullable=False, index=True)
    allergy_type = Column(String(100), nullable=False)  # peanuts, tree nuts, shellfish, etc.

    # Relationships
    participant = relationship("Participant", back_populates="allergies")

    def __repr__(self):
        return f"<Allergy(id={self.id}, type={self.allergy_type})>"