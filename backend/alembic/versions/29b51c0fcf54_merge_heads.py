"""merge heads

Revision ID: 29b51c0fcf54
Revises: 1b7d1d59fec2, e3f8a9b2c4d5
Create Date: 2025-11-20 01:52:00.039502

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '29b51c0fcf54'
down_revision = ('1b7d1d59fec2', 'e3f8a9b2c4d5')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass