from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.db.base import Base


class Place(Base):
    """Place model for storing reusable addresses with Google Maps URLs"""
    __tablename__ = "places"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), nullable=False, index=True)  # e.g., "Camp Whispering Pines", "Church Parking Lot"
    address = Column(Text, nullable=False)  # Full address
    google_maps_url = Column(Text, nullable=True)  # Auto-generated Google Maps URL
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships - outings that use this place
    outings_at_location = relationship(
        "Outing",
        foreign_keys="Outing.outing_place_id",
        back_populates="outing_place"
    )
    outings_pickup = relationship(
        "Outing",
        foreign_keys="Outing.pickup_place_id",
        back_populates="pickup_place"
    )
    outings_dropoff = relationship(
        "Outing",
        foreign_keys="Outing.dropoff_place_id",
        back_populates="dropoff_place"
    )

    def __repr__(self):
        return f"<Place(id={self.id}, name={self.name})>"

    @staticmethod
    def generate_google_maps_url(address: str) -> str:
        """Generate a Google Maps URL from an address"""
        import urllib.parse
        encoded_address = urllib.parse.quote(address)
        return f"https://www.google.com/maps/search/?api=1&query={encoded_address}"
