"""merge_heads

Revision ID: 9c10d32310d8
Revises: 4675027fd206, add_user_contact_info
Create Date: 2025-11-22 21:12:00.414830

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9c10d32310d8'
down_revision = ('4675027fd206', 'add_user_contact_info')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass