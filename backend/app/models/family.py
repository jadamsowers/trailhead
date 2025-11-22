from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.db.base import Base


class FamilyMember(Base):
    """Family member model for storing reusable parent and scout information"""
    __tablename__ = "family_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Basic information
    name = Column(String(255), nullable=False)
    member_type = Column(String(50), nullable=False, index=True)  # 'parent' or 'scout'
    date_of_birth = Column(Date, nullable=True)  # Required for scouts, optional for parents
    
    # Scout-specific fields
    troop_number = Column(String(50), index=True)  # e.g., "123", "456"
    patrol_name = Column(String(100))  # e.g., "Eagle Patrol", "Wolf Patrol"
    
    # Parent-specific fields
    has_youth_protection = Column(Boolean, default=False, nullable=False)
    youth_protection_expiration = Column(Date, nullable=True)  # Expiration date for SAFE Youth Training certificate
    vehicle_capacity = Column(Integer, default=0, nullable=False)  # Number of passengers (excluding driver)
    
    # Medical information
    medical_notes = Column(Text)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="family_members")
    dietary_preferences = relationship("FamilyMemberDietaryPreference", back_populates="family_member", cascade="all, delete-orphan")
    allergies = relationship("FamilyMemberAllergy", back_populates="family_member", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<FamilyMember(id={self.id}, name={self.name}, type={self.member_type})>"


class FamilyMemberDietaryPreference(Base):
    """Dietary preference model for family members"""
    __tablename__ = "family_member_dietary_preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    family_member_id = Column(UUID(as_uuid=True), ForeignKey("family_members.id", ondelete="CASCADE"), nullable=False, index=True)
    preference = Column(String(100), nullable=False)  # vegetarian, vegan, gluten-free, kosher, halal, etc.

    # Relationships
    family_member = relationship("FamilyMember", back_populates="dietary_preferences")

    def __repr__(self):
        return f"<FamilyMemberDietaryPreference(id={self.id}, preference={self.preference})>"


class FamilyMemberAllergy(Base):
    """Allergy model for family members"""
    __tablename__ = "family_member_allergies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    family_member_id = Column(UUID(as_uuid=True), ForeignKey("family_members.id", ondelete="CASCADE"), nullable=False, index=True)
    allergy = Column(String(100), nullable=False)  # peanuts, tree nuts, shellfish, dairy, eggs, etc.
    severity = Column(String(50))  # mild, moderate, severe, life-threatening

    # Relationships
    family_member = relationship("FamilyMember", back_populates="allergies")

    def __repr__(self):
        return f"<FamilyMemberAllergy(id={self.id}, allergy={self.allergy}, severity={self.severity})>"