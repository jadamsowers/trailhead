"""add_family_management_tables

Revision ID: f8a9b3c5d6e7
Revises: ec7f33fc02f6
Create Date: 2025-11-20 22:27:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'f8a9b3c5d6e7'
down_revision = 'ec7f33fc02f6'
branch_labels = None
depends_on = None


def upgrade():
    # Create family_members table
    op.create_table('family_members',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('member_type', sa.String(length=50), nullable=False),
        sa.Column('date_of_birth', sa.Date(), nullable=True),
        sa.Column('troop_number', sa.String(length=50), nullable=True),
        sa.Column('patrol_name', sa.String(length=100), nullable=True),
        sa.Column('has_youth_protection', sa.Boolean(), nullable=False),
        sa.Column('vehicle_capacity', sa.Integer(), nullable=False),
        sa.Column('medical_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_family_members_id'), 'family_members', ['id'], unique=False)
    op.create_index(op.f('ix_family_members_member_type'), 'family_members', ['member_type'], unique=False)
    op.create_index(op.f('ix_family_members_troop_number'), 'family_members', ['troop_number'], unique=False)
    op.create_index(op.f('ix_family_members_user_id'), 'family_members', ['user_id'], unique=False)

    # Create family_member_dietary_preferences table
    op.create_table('family_member_dietary_preferences',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('family_member_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('preference', sa.String(length=100), nullable=False),
        sa.ForeignKeyConstraint(['family_member_id'], ['family_members.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_family_member_dietary_preferences_family_member_id'), 'family_member_dietary_preferences', ['family_member_id'], unique=False)
    op.create_index(op.f('ix_family_member_dietary_preferences_id'), 'family_member_dietary_preferences', ['id'], unique=False)

    # Create family_member_allergies table
    op.create_table('family_member_allergies',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('family_member_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('allergy', sa.String(length=100), nullable=False),
        sa.Column('severity', sa.String(length=50), nullable=True),
        sa.ForeignKeyConstraint(['family_member_id'], ['family_members.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_family_member_allergies_family_member_id'), 'family_member_allergies', ['family_member_id'], unique=False)
    op.create_index(op.f('ix_family_member_allergies_id'), 'family_member_allergies', ['id'], unique=False)


def downgrade():
    # Drop tables in reverse order
    op.drop_index(op.f('ix_family_member_allergies_id'), table_name='family_member_allergies')
    op.drop_index(op.f('ix_family_member_allergies_family_member_id'), table_name='family_member_allergies')
    op.drop_table('family_member_allergies')
    
    op.drop_index(op.f('ix_family_member_dietary_preferences_id'), table_name='family_member_dietary_preferences')
    op.drop_index(op.f('ix_family_member_dietary_preferences_family_member_id'), table_name='family_member_dietary_preferences')
    op.drop_table('family_member_dietary_preferences')
    
    op.drop_index(op.f('ix_family_members_user_id'), table_name='family_members')
    op.drop_index(op.f('ix_family_members_troop_number'), table_name='family_members')
    op.drop_index(op.f('ix_family_members_member_type'), table_name='family_members')
    op.drop_index(op.f('ix_family_members_id'), table_name='family_members')
    op.drop_table('family_members')