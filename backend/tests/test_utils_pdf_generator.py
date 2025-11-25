"""Tests for PDF roster generation utility"""
import pytest
from datetime import datetime, timedelta
from app.utils.pdf_generator import generate_outing_roster_pdf

pytestmark = pytest.mark.asyncio


def _base_outing():
    today = datetime.utcnow()
    return {
        "name": "Fall Campout",
        "outing_date": (today + timedelta(days=7)).isoformat() + "Z",
        "end_date": (today + timedelta(days=9)).isoformat() + "Z",
        "location": "Forest Preserve",
        "outing_lead_name": "Leader One",
        "outing_lead_phone": "555-1111",
        "outing_lead_email": "leader@example.com",
    }


def _signup(name, participant_type="scout", **extras):
    base_participant = {
        "name": name,
        "age": 13,
        "participant_type": participant_type,
        "gender": "male",
        "troop_number": "123",
        "patrol_name": "Fox",
        "dietary_preferences": ["Vegetarian"] if participant_type == "scout" else [],
        "allergies": ["Peanuts"],
        "vehicle_capacity": extras.get("vehicle_capacity", 0),
        "has_youth_protection": extras.get("has_youth_protection", True),
    }
    base_participant.update(extras)
    return {
        "family_contact_name": f"{name} Parent",
        "family_contact_phone": "555-2222",
        "participants": [base_participant],
    }


class TestPDFGenerator:
    def test_generate_pdf_basic(self):
        outing = _base_outing()
        signups = [
            _signup("Alice"),
            _signup("Bob", participant_type="adult", vehicle_capacity=4, has_youth_protection=True),
        ]
        buf = generate_outing_roster_pdf(outing, signups)
        data = buf.getvalue()
        assert data.startswith(b"%PDF")
        # Size should be non-trivial with tables rendered
        assert len(data) > 1500

    def test_generate_pdf_no_participants(self):
        outing = _base_outing()
        buf = generate_outing_roster_pdf(outing, [])
        data = buf.getvalue()
        assert data.startswith(b"%PDF")
        # With no participants PDF should not explode in size
        assert len(data) < 4000

    def test_generate_pdf_multiple_scouts_vs_single(self):
        outing = _base_outing()
        single_buf = generate_outing_roster_pdf(outing, [_signup("Solo")])
        multi_buf = generate_outing_roster_pdf(outing, [
            _signup("Charlie", patrol_name="Alpha"),
            _signup("Delta", patrol_name="Beta"),
            _signup("Echo", patrol_name="Alpha"),
        ])
        assert single_buf.getvalue().startswith(b"%PDF")
        assert multi_buf.getvalue().startswith(b"%PDF")
        # More scouts should generally increase byte size
        assert len(multi_buf.getvalue()) > len(single_buf.getvalue())

    def test_generate_pdf_adults_vehicle_capacity_affects_size(self):
        outing = _base_outing()
        no_vehicle = generate_outing_roster_pdf(outing, [
            _signup("LeaderA", participant_type="adult", vehicle_capacity=0),
        ])
        with_vehicle = generate_outing_roster_pdf(outing, [
            _signup("LeaderA", participant_type="adult", vehicle_capacity=3),
            _signup("LeaderB", participant_type="adult", vehicle_capacity=2),
        ])
        assert no_vehicle.getvalue().startswith(b"%PDF")
        assert with_vehicle.getvalue().startswith(b"%PDF")
        assert len(with_vehicle.getvalue()) > len(no_vehicle.getvalue())

    def test_generate_pdf_allergy_dietary_size(self):
        outing = _base_outing()
        minimal = generate_outing_roster_pdf(outing, [_signup("ScoutX", dietary_preferences=[], allergies=[])])
        detailed = generate_outing_roster_pdf(outing, [_signup("ScoutX", dietary_preferences=["Gluten-Free"], allergies=["Shellfish", "Peanuts"] )])
        assert len(detailed.getvalue()) >= len(minimal.getvalue())
