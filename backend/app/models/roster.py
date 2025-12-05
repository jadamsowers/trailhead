from sqlalchemy import Column, String, Date, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

from app.db.base import Base


class RosterMember(Base):
    """
    RosterMember model for storing raw data imported from my.scouting.org roster CSV.
    This table serves as a staging area/source of truth for BSA data.
    """
    __tablename__ = "roster_members"

    # We use the BSA Member ID as the primary key since it's unique and stable
    bsa_member_id = Column(String(50), primary_key=True, index=True)
    
    # Name fields
    full_name = Column(String(255), nullable=False)
    first_name = Column(String(100))
    middle_name = Column(String(100))
    last_name = Column(String(100))
    suffix = Column(String(50))
    
    # Contact info
    email = Column(String(255))
    mobile_phone = Column(String(50))
    city = Column(String(100))
    state = Column(String(50))
    zip_code = Column(String(20))
    
    # Scouting info
    position = Column(String(100))
    
    # Dates
    ypt_date = Column(Date, nullable=True)
    ypt_expiration = Column(Date, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<RosterMember(bsa_id={self.bsa_member_id}, name={self.full_name})>"
