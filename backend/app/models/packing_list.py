from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.db.base import Base


class PackingListTemplate(Base):
    """Packing list template model (e.g., Backpacking, Camping, Cold-Weather Camping)"""
    __tablename__ = "packing_list_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    items = relationship("PackingListTemplateItem", back_populates="template", cascade="all, delete-orphan")
    outing_packing_lists = relationship("OutingPackingList", back_populates="template")

    def __repr__(self):
        return f"<PackingListTemplate(id={self.id}, name={self.name})>"


class PackingListTemplateItem(Base):
    """Items within a packing list template"""
    __tablename__ = "packing_list_template_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    template_id = Column(UUID(as_uuid=True), ForeignKey("packing_list_templates.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    template = relationship("PackingListTemplate", back_populates="items")

    def __repr__(self):
        return f"<PackingListTemplateItem(id={self.id}, name={self.name}, quantity={self.quantity})>"


class OutingPackingList(Base):
    """Association between outings and packing list templates"""
    __tablename__ = "outing_packing_lists"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    outing_id = Column(UUID(as_uuid=True), ForeignKey("outings.id", ondelete="CASCADE"), nullable=False, index=True)
    template_id = Column(UUID(as_uuid=True), ForeignKey("packing_list_templates.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    outing = relationship("Outing", back_populates="packing_lists")
    template = relationship("PackingListTemplate", back_populates="outing_packing_lists")
    items = relationship("OutingPackingListItem", back_populates="packing_list", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<OutingPackingList(id={self.id}, outing_id={self.outing_id})>"


class OutingPackingListItem(Base):
    """Custom/modified items for specific outings"""
    __tablename__ = "outing_packing_list_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    outing_packing_list_id = Column(UUID(as_uuid=True), ForeignKey("outing_packing_lists.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    checked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    packing_list = relationship("OutingPackingList", back_populates="items")

    def __repr__(self):
        return f"<OutingPackingListItem(id={self.id}, name={self.name}, quantity={self.quantity}, checked={self.checked})>"
