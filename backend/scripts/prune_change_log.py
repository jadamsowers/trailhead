#!/usr/bin/env python3
"""Manual pruning script for change_log retention.
Usage:
  python backend/scripts/prune_change_log.py [days]
Default days = 30.
Ensure DATABASE_URL env var points to target database.
"""
import asyncio
import os
import sys
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from datetime import datetime

from app.services.change_log_prune import prune_change_log
from app.core.config import settings

async def main(days: int):
    engine = create_async_engine(settings.DATABASE_URL, future=True)
    SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with SessionLocal() as session:
        deleted = await prune_change_log(session, older_than_days=days)
        print(f"Pruned {deleted} change_log rows older than {days} days at {datetime.utcnow().isoformat()} UTC")
    await engine.dispose()

if __name__ == "__main__":
    d = int(sys.argv[1]) if len(sys.argv) > 1 else 30
    asyncio.run(main(d))
