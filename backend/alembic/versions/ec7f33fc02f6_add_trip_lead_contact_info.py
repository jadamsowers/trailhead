"""add_trip_lead_contact_info

Revision ID: ec7f33fc02f6
Revises: 3112048f95f5
Create Date: 2025-11-20 02:33:07.573729

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ec7f33fc02f6'
down_revision = '3112048f95f5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add trip lead contact information columns
    op.add_column('trips', sa.Column('trip_lead_name', sa.String(length=255), nullable=True))
    op.add_column('trips', sa.Column('trip_lead_email', sa.String(length=255), nullable=True))
    op.add_column('trips', sa.Column('trip_lead_phone', sa.String(length=50), nullable=True))


def downgrade() -> None:
    # Remove trip lead contact information columns
    op.drop_column('trips', 'trip_lead_phone')
    op.drop_column('trips', 'trip_lead_email')
    op.drop_column('trips', 'trip_lead_name')