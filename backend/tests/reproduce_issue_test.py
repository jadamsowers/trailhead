
import pytest
from datetime import datetime, timedelta
from app.schemas.outing import OutingCreate
from app.crud.outing import create_outing

@pytest.mark.asyncio
async def test_reproduce_outing_creation_failure(db_session):
    # Create a troop first
    from app.schemas.troop import TroopCreate
    from app.crud.troop import create_troop
    
    troop_in = TroopCreate(
        number="123",
        charter_org="Test Org",
        meeting_location="Test Loc",
        meeting_day="Monday",
        organization_id=None # Assuming optional or handled
    )
    # We need to handle organization_id if it's required. 
    # Checking TroopCreate schema... it seems organization_id is required in CRUD but let's check schema.
    # Actually, let's just use a dummy UUID if needed or create an org.
    # For simplicity, let's look at TroopCreate schema or just try to create it.
    # If organization_id is required, we need an org.
    
    # Let's check if we can create a troop without org for this test, 
    # or if we need to mock it.
    # app/schemas/troop.py: organization_id: UUID
    
    # Let's create an organization first.
    from app.schemas.organization import OrganizationCreate
    from app.crud.organization import create_organization
    
    org_in = OrganizationCreate(name="Test Org")
    org = await create_organization(db_session, org_in)
    
    troop_in = TroopCreate(
        number="999",
        charter_org="Test Charter",
        meeting_location="Test Hall",
        meeting_day="Tuesday",
        organization_id=org.id
    )
    troop = await create_troop(db_session, troop_in)

    # Create a valid OutingCreate object with allowed_troop_ids and empty string for datetime
    # We need to bypass Pydantic validation in the constructor to simulate what FastAPI receives from JSON
    # But Pydantic validates in constructor too.
    # So if we pass "" to datetime field, it should fail.
    
    # NOW: It should succeed because we added the validator!
    outing_in = OutingCreate(
        name="Test Outing Failure Repro",
        outing_date=(datetime.utcnow() + timedelta(days=1)).date(),
        end_date=(datetime.utcnow() + timedelta(days=2)).date(),
        location="Test Location",
        description="Test Description",
        max_participants=10,
        cost=10.0,
        is_overnight=True,
        allowed_troop_ids=[troop.id],
        signups_close_at="" # This should now work and be converted to None
    )

    print("Attempting to create outing...")
    outing = await create_outing(db_session, outing_in)
    print(f"Outing created successfully: {outing.id}")
    
    # Verify signups_close_at is None
    assert outing.signups_close_at is None
    print(f"Outing created successfully: {outing.id}")
    
    # Simulate the API response construction
    from app.schemas.outing import OutingResponse
    
    outing_dict = {k: getattr(outing, k) for k in OutingResponse.model_fields.keys() if hasattr(outing, k)}
    outing_dict['allowed_troop_ids'] = [troop.id for troop in outing.allowed_troops]
    
    print("Validating response schema...")
    response = OutingResponse.model_validate(outing_dict)
    print("Response validation successful")
    
    assert response.id == outing.id
    assert response.name == "Test Outing Failure Repro"
    assert response.allowed_troop_ids == [troop.id]
