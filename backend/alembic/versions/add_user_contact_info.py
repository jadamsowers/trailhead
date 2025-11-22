"""add_user_contact_info

Revision ID: add_user_contact_info
Revises: b4d04516ae79
Create Date: 2025-11-22 12:52:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_user_contact_info'
down_revision = 'b4d04516ae79'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add contact information columns to users table
    op.add_column('users', sa.Column('phone', sa.String(length=50), nullable=True))
    op.add_column('users', sa.Column('emergency_contact_name', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('emergency_contact_phone', sa.String(length=50), nullable=True))


def downgrade() -> None:
    # Remove contact information columns from users table
    op.drop_column('users', 'emergency_contact_phone')
    op.drop_column('users', 'emergency_contact_name')
    op.drop_column('users', 'phone')