"""remove_participant_type_field

Revision ID: j3k4l5m6n7o8
Revises: i2j3k4l5m6n7
Create Date: 2025-11-22 03:56:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'j3k4l5m6n7o8'
down_revision = 'i2j3k4l5m6n7'
branch_labels = None
depends_on = None


def upgrade():
    # Drop index on participant_type
    op.drop_index('ix_participants_participant_type', 'participants')
    # Remove participant_type column from participants table
    # The is_adult field already provides this information
    op.drop_column('participants', 'participant_type')


def downgrade():
    # Re-add participant_type column
    op.add_column('participants', sa.Column('participant_type', sa.String(50), nullable=True))
    
    # Populate participant_type based on is_adult
    op.execute("""
        UPDATE participants 
        SET participant_type = CASE 
            WHEN is_adult = true THEN 'adult'
            ELSE 'scout'
        END
    """)
    
    # Make column non-nullable after populating
    op.alter_column('participants', 'participant_type', nullable=False)
    
    # Recreate index
    op.create_index('ix_participants_participant_type', 'participants', ['participant_type'])