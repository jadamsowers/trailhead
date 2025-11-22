"""add_youth_protection_expiration

Revision ID: h1i2j3k4l5m6
Revises: g9h1i2j3k4l5
Create Date: 2025-11-21 10:26:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'h1i2j3k4l5m6'
down_revision = 'g9h1i2j3k4l5'
branch_labels = None
depends_on = None


def upgrade():
    # Add youth_protection_expiration column to family_members table
    op.add_column('family_members', sa.Column('youth_protection_expiration', sa.Date(), nullable=True))


def downgrade():
    # Remove youth_protection_expiration column from family_members table
    op.drop_column('family_members', 'youth_protection_expiration')