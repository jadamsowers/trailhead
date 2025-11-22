"""add family member reference to participants

Revision ID: k4l5m6n7o8p9
Revises: j3k4l5m6n7o8
Create Date: 2025-11-22 04:28:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'k4l5m6n7o8p9'
down_revision = 'j3k4l5m6n7o8'
branch_labels = None
depends_on = None


def upgrade():
    # Add family_member_id column to participants table (required)
    op.add_column('participants', sa.Column('family_member_id', postgresql.UUID(as_uuid=True), nullable=False))
    op.create_foreign_key('fk_participants_family_member_id', 'participants', 'family_members', ['family_member_id'], ['id'], ondelete='CASCADE')
    op.create_index(op.f('ix_participants_family_member_id'), 'participants', ['family_member_id'], unique=False)
    
    # Remove redundant fields that can be looked up from family_members table
    op.drop_column('participants', 'name')
    op.drop_column('participants', 'age')
    op.drop_column('participants', 'gender')
    op.drop_column('participants', 'troop_number')
    op.drop_column('participants', 'patrol_name')
    op.drop_column('participants', 'has_youth_protection')
    op.drop_column('participants', 'vehicle_capacity')
    op.drop_column('participants', 'medical_notes')
    op.drop_column('participants', 'is_adult')


def downgrade():
    # Restore removed columns
    op.add_column('participants', sa.Column('is_adult', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('participants', sa.Column('medical_notes', sa.Text(), nullable=True))
    op.add_column('participants', sa.Column('vehicle_capacity', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('participants', sa.Column('has_youth_protection', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('participants', sa.Column('patrol_name', sa.String(length=100), nullable=True))
    op.add_column('participants', sa.Column('troop_number', sa.String(length=50), nullable=True))
    op.add_column('participants', sa.Column('gender', sa.String(length=20), nullable=False))
    op.add_column('participants', sa.Column('age', sa.Integer(), nullable=False))
    op.add_column('participants', sa.Column('name', sa.String(length=255), nullable=False))
    
    # Remove family_member_id column
    op.drop_index(op.f('ix_participants_family_member_id'), table_name='participants')
    op.drop_constraint('fk_participants_family_member_id', 'participants', type_='foreignkey')
    op.drop_column('participants', 'family_member_id')