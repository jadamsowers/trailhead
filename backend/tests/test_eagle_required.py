import pytest
from sqlalchemy import select, func

from app.db.session import AsyncSessionLocal
from app.models.requirement import MeritBadge


def test_merit_badge_model_has_eagle_required_column():
    # Column existence check
    assert hasattr(MeritBadge, 'eagle_required')
    col = getattr(MeritBadge, 'eagle_required')
    # SQLAlchemy Boolean column has .type attribute
    assert str(col.type).lower() == 'boolean'


@pytest.mark.asyncio
async def test_eagle_required_count_at_least_five(db_session):
    # Insert deterministic test data: at least 5 Eagle-required badges
    badges = [
        MeritBadge(name="Camping", description="Camping badge", keywords=["camping"], eagle_required=True),
        MeritBadge(name="Cooking", description="Cooking badge", keywords=["cooking"], eagle_required=True),
        MeritBadge(name="First Aid", description="First Aid badge", keywords=["first","aid"], eagle_required=True),
        MeritBadge(name="Swimming", description="Swimming badge", keywords=["swimming"], eagle_required=True),
        MeritBadge(name="Citizenship in Society", description="Citizenship badge", keywords=["citizenship"], eagle_required=True),
    ]
    for b in badges:
        db_session.add(b)
    await db_session.commit()

    result = await db_session.execute(
        select(func.count()).select_from(MeritBadge).where(MeritBadge.eagle_required == True)  # noqa: E712
    )
    count_true = result.scalar()
    assert count_true >= 5
