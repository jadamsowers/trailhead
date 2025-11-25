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
async def test_eagle_required_count_at_least_five():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(func.count()).select_from(MeritBadge).where(MeritBadge.eagle_required == True)  # noqa: E712
        )
        count_true = result.scalar()
        # Expect a reasonable minimum (current dataset shows 7)
        assert count_true >= 5
