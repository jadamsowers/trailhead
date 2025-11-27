from datetime import datetime
from typing import Optional, Iterable
from uuid import UUID
import hashlib
import json

from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.change_log import ChangeLog

VALID_OP_TYPES = {"create", "update", "delete"}

def compute_payload_hash(entity: object, fields: Iterable[str]) -> str:
    """Compute a stable SHA-256 hash for selected fields of an entity.
    Skips missing attributes gracefully; serializes as sorted JSON.
    """
    data = {}
    for f in fields:
        data[f] = getattr(entity, f, None)
    blob = json.dumps(data, sort_keys=True, default=str).encode()
    return hashlib.sha256(blob).hexdigest()

async def record_change(
    db: AsyncSession,
    entity_type: str,
    entity_id: Optional[UUID],
    op_type: str,
    payload_hash: Optional[str] = None,
) -> ChangeLog:
    """Insert a change log entry and auto-increment version for (entity_type, entity_id).

    Should be called inside CRUD write functions after flush so entity_id is available.
    """
    if op_type not in VALID_OP_TYPES:
        raise ValueError(f"Invalid op_type '{op_type}' – expected one of {VALID_OP_TYPES}")

    version_query = select(func.coalesce(func.max(ChangeLog.version), 0)).where(
        ChangeLog.entity_type == entity_type,
        ChangeLog.entity_id == entity_id,
    )
    result = await db.execute(version_query)
    last_version = result.scalar_one()
    next_version = last_version + 1

    entry = ChangeLog(
        entity_type=entity_type,
        entity_id=entity_id,
        op_type=op_type,
        version=next_version,
        payload_hash=payload_hash,
    )
    db.add(entry)
    await db.flush()
    return entry

async def get_deltas(
    db: AsyncSession,
    since: Optional[datetime] = None,
    cursor_id: Optional[UUID] = None,
    limit: int = 200,
    entity_types: Optional[Iterable[str]] = None,
) -> list[ChangeLog]:
    """Return change log entries using keyset pagination.
    If cursor_id provided, start strictly after that cursor (created_at, id).
    Else use 'since' timestamp if provided.
    """
    base = select(ChangeLog)
    if cursor_id:
        # Look up cursor row
        cursor_row_result = await db.execute(select(ChangeLog).where(ChangeLog.id == cursor_id))
        cursor_row = cursor_row_result.scalar_one_or_none()
        if not cursor_row:
            return []  # caller may choose to treat as reset
        # Keyset comparison: (created_at, id) > (cursor.created_at, cursor.id)
        base = base.where(
            or_(
                ChangeLog.created_at > cursor_row.created_at,
                and_(ChangeLog.created_at == cursor_row.created_at, ChangeLog.id > cursor_row.id),
            )
        )
    elif since:
        base = base.where(ChangeLog.created_at > since)

    if entity_types:
        base = base.where(ChangeLog.entity_type.in_(list(entity_types)))
    stmt = base.order_by(ChangeLog.created_at, ChangeLog.id).limit(limit + 1)
    result = await db.execute(stmt)
    return result.scalars().all()
