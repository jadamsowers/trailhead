from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete

from app.models.change_log import ChangeLog

async def prune_change_log(db: AsyncSession, older_than_days: int = 30) -> int:
    """Delete change log rows older than the given age.
    Returns number of rows scheduled for deletion (best-effort; rowcount may be dialect-dependent).
    """
    cutoff = datetime.utcnow() - timedelta(days=older_than_days)
    stmt = delete(ChangeLog).where(ChangeLog.created_at < cutoff)
    result = await db.execute(stmt)
    await db.commit()
    return result.rowcount if hasattr(result, 'rowcount') else -1
