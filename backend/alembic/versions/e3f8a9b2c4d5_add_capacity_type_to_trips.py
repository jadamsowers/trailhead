"""add capacity_type to trips

Revision ID: e3f8a9b2c4d5
Revises: d5e8f9a1b2c3
Create Date: 2025-11-20 01:15:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e3f8a9b2c4d5'
down_revision = 'd5e8f9a1b2c3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add capacity_type column with default value 'fixed'
    op.add_column('trips', sa.Column('capacity_type', sa.String(length=20), nullable=False, server_default='fixed'))


def downgrade() -> None:
    # Remove capacity_type column
    op.drop_column('trips', 'capacity_type')