import json
from sqlalchemy import TypeDecorator, String
from sqlalchemy.dialects.postgresql import ARRAY

class SQLiteCompatibleArray(TypeDecorator):
    """
    TypeDecorator that works as an ARRAY on PostgreSQL and JSON string on SQLite.
    """
    impl = String
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(ARRAY(String))
        else:
            return dialect.type_descriptor(String)

    def process_bind_param(self, value, dialect):
        if dialect.name == 'postgresql':
            return value
        if value is None:
            return None
        return json.dumps(value)

    def process_result_value(self, value, dialect):
        if dialect.name == 'postgresql':
            return value
        if value is None:
            return None
        try:
            return json.loads(value)
        except (ValueError, TypeError):
            return []
