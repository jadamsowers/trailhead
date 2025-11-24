from sqlalchemy import Column, String, Integer, Boolean, Date, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.db.base import Base


class Outing(Base):
    """Outing model for managing Scouting Outings"""
    __tablename__ = "outings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), nullable=False)
    outing_date = Column(Date, nullable=False, index=True)  # Start date for overnight outings, single date for day outings
    end_date = Column(Date, nullable=True, index=True)  # End date for overnight outings only
    location = Column(String(255), nullable=False)
    description = Column(Text)
    max_participants = Column(Integer, nullable=False)
    capacity_type = Column(String(20), default='fixed', nullable=False)  # 'fixed' or 'vehicle'
    is_overnight = Column(Boolean, default=False, nullable=False)
    outing_lead_name = Column(String(255), nullable=True)
    outing_lead_email = Column(String(255), nullable=True)
    outing_lead_phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    icon = Column(String(50), nullable=True)  # Outing icon (Bootstrap icon name or emoji)

    # Relationships
    signups = relationship("Signup", back_populates="outing", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Outing(id={self.id}, name={self.name}, date={self.outing_date})>"

    @property
    def signup_count(self):
        """Calculate total number of participants signed up"""
        return sum(len(signup.participants) for signup in self.signups)

    @property
    def total_vehicle_capacity(self):
        """Calculate total vehicle capacity from all adult participants"""
        total = 0
        for signup in self.signups:
            for participant in signup.participants:
                if participant.is_adult and participant.vehicle_capacity:
                    total += participant.vehicle_capacity
        return total

    @property
    def available_spots(self):
        """Calculate remaining available spots based on capacity type"""
        if self.capacity_type == 'vehicle':
            # Vehicle-based: capacity = total vehicle seats - total participants
            return max(0, self.total_vehicle_capacity - self.signup_count)
        else:
            # Fixed capacity
            return max(0, self.max_participants - self.signup_count)

    @property
    def is_full(self):
        """Check if outing is at capacity based on capacity type"""
        if self.capacity_type == 'vehicle':
            return self.signup_count >= self.total_vehicle_capacity
        else:
            return self.signup_count >= self.max_participants

    @property
    def needs_more_drivers(self):
        """Check if outing needs more drivers (only relevant for vehicle capacity)"""
        if self.capacity_type == 'vehicle':
            return self.total_vehicle_capacity < self.signup_count
        return False

    @property
    def adult_count(self):
        """Calculate total number of adults signed up"""
        total = 0
        for signup in self.signups:
            for participant in signup.participants:
                if participant.is_adult:
                    total += 1
        return total

    @property
    def female_adult_count(self):
        """Calculate total number of female adults signed up"""
        total = 0
        for signup in self.signups:
            for participant in signup.participants:
                if participant.is_adult and participant.gender == 'female':
                    total += 1
        return total

    @property
    def female_youth_count(self):
        """Calculate total number of female youth signed up"""
        total = 0
        for signup in self.signups:
            for participant in signup.participants:
                if not participant.is_adult and participant.gender == 'female':
                    total += 1
        return total

    @property
    def needs_two_deep_leadership(self):
        """Check if outing needs more adults for Scouting America two-deep leadership (minimum 2 adults)"""
        return self.adult_count < 2

    @property
    def needs_female_leader(self):
        """Check if outing needs a female adult leader (required when female youth present)"""
        return self.female_youth_count > 0 and self.female_adult_count < 1