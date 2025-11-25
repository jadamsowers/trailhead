"""Tests for app/services/pdf_generator.py"""
import pytest
from unittest.mock import Mock, patch
from datetime import datetime, timedelta
from app.services.pdf_generator import PDFGenerator

@pytest.fixture
def mock_outing():
    outing = Mock()
    outing.name = "Test Outing"
    outing.description = "Test Description"
    outing.outing_date = datetime.now()
    outing.end_date = datetime.now() + timedelta(days=1)
    outing.drop_off_time = datetime.now()
    outing.pickup_time = datetime.now()
    outing.location = "Test Location"
    outing.outing_lead_name = "Leader Name"
    outing.outing_lead_phone = "555-1234"
    
    # Relationships
    outing.outing_requirements = []
    outing.outing_merit_badges = []
    outing.outing_place = None
    outing.outing_address = "123 Test St"
    outing.drop_off_location = "Test Location"
    outing.dropoff_address = "123 Test St"
    outing.pickup_location = "Test Location"
    outing.pickup_address = "123 Test St"
    
    return outing

class TestPDFGenerator:
    """Test PDFGenerator class"""

    def test_init(self):
        """Test initialization"""
        generator = PDFGenerator()
        assert generator.bsa_olive is not None
        assert generator.styles is not None

    def test_generate_qr_code(self):
        """Test QR code generation"""
        generator = PDFGenerator()
        buffer = generator._generate_qr_code("https://example.com")
        assert buffer is not None
        buffer.seek(0)
        assert len(buffer.read()) > 0

    def test_generate_outing_handout_basic(self, mock_outing):
        """Test generating handout with basic info"""
        generator = PDFGenerator()
        pdf_bytes = generator.generate_outing_handout(mock_outing, [])
        
        assert pdf_bytes is not None
        assert len(pdf_bytes) > 0
        assert pdf_bytes.startswith(b"%PDF")

    def test_generate_outing_handout_full(self, mock_outing):
        """Test generating handout with all fields"""
        # Add requirements
        req = Mock()
        req.requirement.rank = "First Class"
        req.requirement.requirement_number = "1a"
        mock_outing.outing_requirements = [req]
        
        mb = Mock()
        mb.merit_badge.name = "Camping"
        mock_outing.outing_merit_badges = [mb]
        
        # Add place
        place = Mock()
        place.name = "Camp Site"
        place.address = "456 Camp Rd"
        place.google_maps_url = "http://maps.google.com"
        mock_outing.outing_place = place
        
        # Add packing list
        pl = Mock()
        item = Mock()
        item.name = "Tent"
        item.quantity = 1
        pl.items = [item]
        packing_lists = [pl]
        
        generator = PDFGenerator()
        pdf_bytes = generator.generate_outing_handout(mock_outing, packing_lists)
        
        assert pdf_bytes is not None
        assert len(pdf_bytes) > 0
        assert pdf_bytes.startswith(b"%PDF")

    def test_generate_outing_handout_no_dates(self, mock_outing):
        """Test generating handout with missing dates"""
        mock_outing.end_date = None
        mock_outing.drop_off_time = None
        mock_outing.pickup_time = None
        
        generator = PDFGenerator()
        pdf_bytes = generator.generate_outing_handout(mock_outing, [])
        
        assert pdf_bytes is not None
        assert len(pdf_bytes) > 0

    def test_generate_outing_handout_different_locations(self, mock_outing):
        """Test generating handout with different dropoff/pickup locations"""
        mock_outing.drop_off_location = "Drop Point"
        mock_outing.dropoff_address = "Drop St"
        mock_outing.pickup_location = "Pick Point"
        mock_outing.pickup_address = "Pick St"
        
        generator = PDFGenerator()
        pdf_bytes = generator.generate_outing_handout(mock_outing, [])
        
        assert pdf_bytes is not None
        assert len(pdf_bytes) > 0
