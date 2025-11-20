"""Add end_date to trips

Revision ID: d5e8f9a1b2c3
Revises: cfdeaa702f8b
Create Date: 2025-11-20 00:16:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd5e8f9a1b2c3'
down_revision = 'cfdeaa702f8b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add end_date column to trips table
    op.add_column('trips', sa.Column('end_date', sa.Date(), nullable=True))
    # Add index on end_date for better query performance
    op.create_index(op.f('ix_trips_end_date'), 'trips', ['end_date'], unique=False)


def downgrade() -> None:
    # Remove index and column
    op.drop_index(op.f('ix_trips_end_date'), table_name='trips')
    op.drop_column('trips', 'end_date')