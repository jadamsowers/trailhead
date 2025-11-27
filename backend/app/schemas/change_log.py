from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional, List

class ChangeLogEntry(BaseModel):
    id: UUID
    entity_type: str = Field(..., description="Type of entity: outing|signup|participant|place|requirement")
    entity_id: Optional[UUID] = Field(None, description="UUID of entity affected")
    op_type: str = Field(..., description="Operation type: create|update|delete")
    version: int = Field(..., description="Incrementing version per entity")
    payload_hash: Optional[str] = Field(None, description="Optional 64-char hash of serialized entity payload")
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ChangeLogDeltaResponse(BaseModel):
    items: List[ChangeLogEntry]
    has_more: bool
    next_cursor: Optional[UUID] = Field(None, description="Cursor for next page (last item's id)")
    latest_timestamp: datetime = Field(..., description="Timestamp of last item returned or server now if empty")
