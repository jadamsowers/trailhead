import asyncio
from sqlalchemy import select, func

from app.db.session import AsyncSessionLocal
from app.models.requirement import RankRequirement, MeritBadge


async def main():
    async with AsyncSessionLocal() as s:
        rr = await s.execute(
            select(func.count()).select_from(RankRequirement).where(RankRequirement.keywords != None)
        )
        mb = await s.execute(
            select(func.count()).select_from(MeritBadge).where(MeritBadge.keywords != None)
        )
        eagle = await s.execute(
            select(func.count()).select_from(MeritBadge).where(MeritBadge.eagle_required == True)
        )
        sample_rr = await s.execute(
            select(RankRequirement.rank, RankRequirement.requirement_number, RankRequirement.keywords)
            .where(RankRequirement.keywords != None)
            .limit(3)
        )
        sample_mb = await s.execute(
            select(MeritBadge.name, MeritBadge.eagle_required, MeritBadge.keywords)
            .where(MeritBadge.keywords != None)
            .limit(3)
        )

        print("Rank requirements with keywords:", rr.scalar())
        print("Merit badges with keywords:", mb.scalar())
        print("Eagle-required merit badges:", eagle.scalar())
        print("Sample rank requirement keywords:")
        for row in sample_rr.fetchall():
            print("  ", row)
        print("Sample merit badge keywords:")
        for row in sample_mb.fetchall():
            print("  ", row)


if __name__ == "__main__":
    asyncio.run(main())
