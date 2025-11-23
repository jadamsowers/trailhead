import sys
import os
from sqlalchemy import create_mock_engine

# Add the backend directory to the python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.base import Base
# Import all models to ensure they are registered with Base
from app.models import user, family, outing, signup, participant

def dump(sql, *multiparams, **params):
    compiled = sql.compile(dialect=engine.dialect)
    statement = str(compiled).strip()
    # Add semicolon if not present
    if statement and not statement.endswith(';'):
        statement += ';'
    print(statement)

engine = create_mock_engine("postgresql://", dump)

Base.metadata.create_all(engine, checkfirst=False)
