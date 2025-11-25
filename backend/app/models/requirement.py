from sqlalchemy import Column, String, Text, DateTime, ForeignKey, ARRAY, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.db.base import Base


class RankRequirement(Base):
    """Model for Scout rank requirements (Scout, Tenderfoot, Second Class, First Class)"""
    __tablename__ = "rank_requirements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rank = Column(String(50), nullable=False, index=True)  # 'Scout', 'Tenderfoot', 'Second Class', 'First Class'
    requirement_number = Column(String(20), nullable=False)  # e.g., '1a', '2b', '3'
    requirement_text = Column(Text, nullable=False)  # Full description of the requirement
    keywords = Column(ARRAY(Text), nullable=True)  # Array of keywords for matching
    category = Column(String(100), nullable=True, index=True)  # 'Camping', 'Hiking', 'First Aid', etc.
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    outing_requirements = relationship("OutingRequirement", back_populates="requirement", cascade="all, delete-orphan")

    def __repr__(self):
        # Use __dict__.get to avoid triggering SQLAlchemy loader on expired/detached instances
        id_val = self.__dict__.get('id')
        rank_val = self.__dict__.get('rank')
        num_val = self.__dict__.get('requirement_number')
        return f"<RankRequirement(id={id_val}, rank={rank_val}, number={num_val})>"


class MeritBadge(Base):
    """Model for merit badges"""
    __tablename__ = "merit_badges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True, index=True)  # Merit badge name
    description = Column(Text, nullable=True)  # Brief description
    keywords = Column(ARRAY(Text), nullable=True)  # Array of keywords for matching
    eagle_required = Column(Boolean, nullable=False, default=False)  # True if Eagle-required
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    outing_merit_badges = relationship("OutingMeritBadge", back_populates="merit_badge", cascade="all, delete-orphan")

    def __repr__(self):
        id_val = self.__dict__.get('id')
        name_val = self.__dict__.get('name')
        return f"<MeritBadge(id={id_val}, name={name_val})>"


class OutingRequirement(Base):
    """Junction table linking outings to rank requirements"""
    __tablename__ = "outing_requirements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    outing_id = Column(UUID(as_uuid=True), ForeignKey("outings.id", ondelete="CASCADE"), nullable=False, index=True)
    rank_requirement_id = Column(UUID(as_uuid=True), ForeignKey("rank_requirements.id", ondelete="CASCADE"), nullable=False, index=True)
    notes = Column(Text, nullable=True)  # Optional notes about fulfilling the requirement
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    outing = relationship("Outing", back_populates="outing_requirements")
    requirement = relationship("RankRequirement", back_populates="outing_requirements")

    def __repr__(self):
        id_val = self.__dict__.get('id')
        outing_id_val = self.__dict__.get('outing_id')
        req_id_val = self.__dict__.get('rank_requirement_id')
        return f"<OutingRequirement(id={id_val}, outing_id={outing_id_val}, requirement_id={req_id_val})>"


class OutingMeritBadge(Base):
    """Junction table linking outings to merit badges"""
    __tablename__ = "outing_merit_badges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    outing_id = Column(UUID(as_uuid=True), ForeignKey("outings.id", ondelete="CASCADE"), nullable=False, index=True)
    merit_badge_id = Column(UUID(as_uuid=True), ForeignKey("merit_badges.id", ondelete="CASCADE"), nullable=False, index=True)
    notes = Column(Text, nullable=True)  # Optional notes about which requirements can be worked on
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    outing = relationship("Outing", back_populates="outing_merit_badges")
    merit_badge = relationship("MeritBadge", back_populates="outing_merit_badges")

    def __repr__(self):
        id_val = self.__dict__.get('id')
        outing_id_val = self.__dict__.get('outing_id')
        mb_id_val = self.__dict__.get('merit_badge_id')
        return f"<OutingMeritBadge(id={id_val}, outing_id={outing_id_val}, merit_badge_id={mb_id_val})>"
