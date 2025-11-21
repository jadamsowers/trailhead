"""add_is_initial_admin_to_users

Revision ID: g9h1i2j3k4l5
Revises: f8a9b3c5d6e7
Create Date: 2025-11-21 06:27:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'g9h1i2j3k4l5'
down_revision = 'f8a9b3c5d6e7'
branch_labels = None
depends_on = None


def upgrade():
    # Add is_initial_admin column to users table
    op.add_column('users', sa.Column('is_initial_admin', sa.Boolean(), nullable=False, server_default='false'))


def downgrade():
    # Remove is_initial_admin column from users table
    op.drop_column('users', 'is_initial_admin')