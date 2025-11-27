"""Tests for change_log service functions (non-database tests)"""
import pytest
from datetime import datetime
import json

from app.services.change_log import (
    compute_payload_hash,
    VALID_OP_TYPES,
)


class MockEntity:
    """Mock entity for testing compute_payload_hash"""
    
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)


class TestComputePayloadHash:
    """Tests for compute_payload_hash function"""

    def test_basic_hash(self):
        """Test basic hash computation"""
        entity = MockEntity(name="Test", value=42)
        
        hash1 = compute_payload_hash(entity, ["name", "value"])
        
        assert isinstance(hash1, str)
        assert len(hash1) == 64  # SHA-256 produces 64 hex characters

    def test_same_data_same_hash(self):
        """Test that same data produces same hash"""
        entity1 = MockEntity(name="Test", value=42)
        entity2 = MockEntity(name="Test", value=42)
        
        hash1 = compute_payload_hash(entity1, ["name", "value"])
        hash2 = compute_payload_hash(entity2, ["name", "value"])
        
        assert hash1 == hash2

    def test_different_data_different_hash(self):
        """Test that different data produces different hash"""
        entity1 = MockEntity(name="Test1", value=42)
        entity2 = MockEntity(name="Test2", value=42)
        
        hash1 = compute_payload_hash(entity1, ["name", "value"])
        hash2 = compute_payload_hash(entity2, ["name", "value"])
        
        assert hash1 != hash2

    def test_field_order_invariant(self):
        """Test that field order in list doesn't affect hash (sorted JSON)"""
        entity = MockEntity(name="Test", value=42, other="data")
        
        hash1 = compute_payload_hash(entity, ["name", "value", "other"])
        hash2 = compute_payload_hash(entity, ["other", "value", "name"])
        
        assert hash1 == hash2

    def test_missing_field_handled(self):
        """Test that missing fields are handled gracefully (None)"""
        entity = MockEntity(name="Test")
        
        # Should not raise error for missing 'value' attribute
        hash1 = compute_payload_hash(entity, ["name", "value"])
        
        assert isinstance(hash1, str)
        assert len(hash1) == 64

    def test_empty_fields_list(self):
        """Test with empty fields list"""
        entity = MockEntity(name="Test")
        
        hash1 = compute_payload_hash(entity, [])
        
        # Empty dict should produce consistent hash
        assert isinstance(hash1, str)
        assert len(hash1) == 64

    def test_datetime_serialization(self):
        """Test that datetime values are serialized properly"""
        dt = datetime(2024, 6, 15, 12, 30, 45)
        entity = MockEntity(created_at=dt)
        
        # Should not raise - datetime should be serialized via default=str
        hash1 = compute_payload_hash(entity, ["created_at"])
        
        assert isinstance(hash1, str)
        assert len(hash1) == 64

    def test_none_value_serialization(self):
        """Test that None values are serialized"""
        entity = MockEntity(name=None)
        
        hash1 = compute_payload_hash(entity, ["name"])
        
        assert isinstance(hash1, str)
        assert len(hash1) == 64

    def test_list_value_serialization(self):
        """Test that list values are serialized"""
        entity = MockEntity(tags=["camping", "hiking", "outdoor"])
        
        hash1 = compute_payload_hash(entity, ["tags"])
        
        assert isinstance(hash1, str)
        assert len(hash1) == 64

    def test_dict_value_serialization(self):
        """Test that dict values are serialized"""
        entity = MockEntity(metadata={"key": "value", "count": 42})
        
        hash1 = compute_payload_hash(entity, ["metadata"])
        
        assert isinstance(hash1, str)
        assert len(hash1) == 64

    def test_complex_entity(self):
        """Test with complex entity having various types"""
        entity = MockEntity(
            name="Test Outing",
            count=42,
            price=19.99,
            is_active=True,
            tags=["a", "b", "c"],
            created_at=datetime(2024, 6, 15),
            metadata={"nested": {"value": 1}},
        )
        
        hash1 = compute_payload_hash(entity, [
            "name", "count", "price", "is_active", "tags", "created_at", "metadata"
        ])
        
        assert isinstance(hash1, str)
        assert len(hash1) == 64


class TestValidOpTypes:
    """Tests for VALID_OP_TYPES constant"""

    def test_create_is_valid(self):
        """Test that 'create' is a valid operation type"""
        assert "create" in VALID_OP_TYPES

    def test_update_is_valid(self):
        """Test that 'update' is a valid operation type"""
        assert "update" in VALID_OP_TYPES

    def test_delete_is_valid(self):
        """Test that 'delete' is a valid operation type"""
        assert "delete" in VALID_OP_TYPES

    def test_exactly_three_types(self):
        """Test that there are exactly three operation types"""
        assert len(VALID_OP_TYPES) == 3

    def test_no_invalid_types(self):
        """Test that invalid types are not in set"""
        assert "read" not in VALID_OP_TYPES
        assert "upsert" not in VALID_OP_TYPES
        assert "patch" not in VALID_OP_TYPES
