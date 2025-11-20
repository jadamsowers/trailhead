"""merge heads

Revision ID: 9047407fe76b
Revises: 427c61104ead, f8a9b3c5d6e7
Create Date: 2025-11-20 23:08:23.659446

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9047407fe76b'
down_revision = ('427c61104ead', 'f8a9b3c5d6e7')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass