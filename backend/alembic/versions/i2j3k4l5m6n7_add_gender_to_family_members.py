"""add_gender_to_family_members

Revision ID: i2j3k4l5m6n7
Revises: h1i2j3k4l5m6
Create Date: 2025-11-22 03:55:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'i2j3k4l5m6n7'
down_revision = 'h1i2j3k4l5m6'
branch_labels = None
depends_on = None


def upgrade():
    # Add gender column to family_members table
    op.add_column('family_members', sa.Column('gender', sa.String(20), nullable=True))
    # Create index for gender field
    op.create_index('ix_family_members_gender', 'family_members', ['gender'])


def downgrade():
    # Remove index
    op.drop_index('ix_family_members_gender', 'family_members')
    # Remove gender column from family_members table
    op.drop_column('family_members', 'gender')