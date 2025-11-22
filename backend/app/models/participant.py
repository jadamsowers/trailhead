from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.db.base import Base


class Participant(Base):
    """Participant model linking signups to family members"""
    __tablename__ = "participants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    signup_id = Column(UUID(as_uuid=True), ForeignKey("signups.id", ondelete="CASCADE"), nullable=False, index=True)
    family_member_id = Column(UUID(as_uuid=True), ForeignKey("family_members.id", ondelete="CASCADE"), nullable=False, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    signup = relationship("Signup", back_populates="participants")
    family_member = relationship("FamilyMember", backref="participant_signups")
    dietary_restrictions = relationship("DietaryRestriction", back_populates="participant", cascade="all, delete-orphan")
    allergies = relationship("Allergy", back_populates="participant", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Participant(id={self.id}, signup_id={self.signup_id}, family_member_id={self.family_member_id})>"

    # Properties to access family member data
    @property
    def name(self):
        return self.family_member.name if self.family_member else None
    
    @property
    def age(self):
        if self.family_member and self.family_member.date_of_birth:
            from datetime import date
            today = date.today()
            dob = self.family_member.date_of_birth
            return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        return None
    
    @property
    def is_adult(self):
        return self.family_member.member_type == 'adult' if self.family_member else False
    
    @property
    def gender(self):
        return self.family_member.gender if self.family_member else None
    
    @property
    def troop_number(self):
        return self.family_member.troop_number if self.family_member else None
    
    @property
    def patrol_name(self):
        return self.family_member.patrol_name if self.family_member else None
    
    @property
    def has_youth_protection(self):
        return self.family_member.has_youth_protection if self.family_member else False
    
    @property
    def vehicle_capacity(self):
        return self.family_member.vehicle_capacity if self.family_member else 0
    
    @property
    def medical_notes(self):
        return self.family_member.medical_notes if self.family_member else None
    
    @property
    def participant_type(self):
        return self.family_member.member_type if self.family_member else None


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