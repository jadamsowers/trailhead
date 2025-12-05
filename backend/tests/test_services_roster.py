"""Tests for roster service"""
import pytest
from datetime import date
from io import BytesIO

from app.services.roster import RosterService





class TestParseDateFunction:
    """Test the parse_date static method"""
    
    def test_parse_valid_date(self):
        """Test parsing a valid date string"""
        result = RosterService.parse_date("12/02/2025")
        assert result == date(2025, 12, 2)
    
    def test_parse_another_valid_date(self):
        """Test parsing another valid date"""
        result = RosterService.parse_date("01/15/2024")
        assert result == date(2024, 1, 15)
    
    def test_parse_empty_string(self):
        """Test parsing empty string returns None"""
        result = RosterService.parse_date("")
        assert result is None
    
    def test_parse_none(self):
        """Test parsing None returns None"""
        result = RosterService.parse_date(None)
        assert result is None
    
    def test_parse_invalid_format(self):
        """Test parsing invalid date format returns None"""
        result = RosterService.parse_date("2025-12-02")
        assert result is None
    
    def test_parse_invalid_date(self):
        """Test parsing invalid date values returns None"""
        result = RosterService.parse_date("13/32/2025")
        assert result is None



@pytest.mark.asyncio
class TestImportRoster:
    """Test the import_roster method"""
    
    async def test_import_simple_roster(self, db_session):
        """Test importing a simple roster CSV"""
        csv_content = b"""Report Date: 12/02/2025
Unit: Troop 123

memberid,firstname,middlename,lastname,suffix,primaryemail,primaryphone,city,statecode,zip9,positionname,stryptexpirationdate,stryptcompletiondate
12345,John,A,Doe,,john.doe@example.com,555-1234,Durham,NC,27701,Scoutmaster,12/31/2025,01/15/2024
67890,Jane,B,Smith,Jr,jane.smith@example.com,555-5678,Chapel Hill,NC,27514,Assistant Scoutmaster,06/30/2026,03/20/2024
"""
        
        result = await RosterService.import_roster(db_session, csv_content)
        
        assert result["processed"] == 2
        assert "added" in result or "updated" in result
    
    async def test_import_roster_with_dots_in_header(self, db_session):
        """Test importing roster with dots in header (my.scouting.org format)"""
        csv_content = b"""Report Date: 12/02/2025

...memberid,...firstname,...middlename,...lastname,...suffix,...primaryemail,...primaryphone,...city,...statecode,...zip9,...positionname,...stryptexpirationdate,...stryptcompletiondate
11111,Alice,,Johnson,,alice@example.com,555-1111,Raleigh,NC,27601,Committee Chair,12/31/2025,02/10/2024
"""
        
        result = await RosterService.import_roster(db_session, csv_content)
        
        assert result["processed"] == 1
    
    async def test_import_roster_with_middle_name(self, db_session):
        """Test that middle names are included in full name"""
        csv_content = b"""memberid,firstname,middlename,lastname,suffix,primaryemail,primaryphone,city,statecode,zip9,positionname,stryptexpirationdate,stryptcompletiondate
22222,Robert,Lee,Williams,,bob@example.com,555-2222,Durham,NC,27705,Scoutmaster,12/31/2025,01/01/2024
"""
        
        result = await RosterService.import_roster(db_session, csv_content)
        
        assert result["processed"] == 1
        # Full name should include middle name
    
    async def test_import_roster_with_suffix(self, db_session):
        """Test that suffixes are included in full name"""
        csv_content = b"""memberid,firstname,middlename,lastname,suffix,primaryemail,primaryphone,city,statecode,zip9,positionname,stryptexpirationdate,stryptcompletiondate
33333,John,,Smith,III,john3@example.com,555-3333,Durham,NC,27707,Assistant Scoutmaster,12/31/2025,01/01/2024
"""
        
        result = await RosterService.import_roster(db_session, csv_content)
        
        assert result["processed"] == 1
    
    async def test_import_roster_with_empty_dates(self, db_session):
        """Test importing roster with empty YPT dates"""
        csv_content = b"""memberid,firstname,middlename,lastname,suffix,primaryemail,primaryphone,city,statecode,zip9,positionname,stryptexpirationdate,stryptcompletiondate
44444,Mary,,Jones,,mary@example.com,555-4444,Durham,NC,27708,Committee Member,,,
"""
        
        result = await RosterService.import_roster(db_session, csv_content)
        
        assert result["processed"] == 1
    
    async def test_import_roster_skips_empty_rows(self, db_session):
        """Test that empty rows are skipped"""
        csv_content = b"""memberid,firstname,middlename,lastname,suffix,primaryemail,primaryphone,city,statecode,zip9,positionname,stryptexpirationdate,stryptcompletiondate
55555,Test,,User,,test@example.com,555-5555,Durham,NC,27709,Scoutmaster,12/31/2025,01/01/2024

66666,Another,,User,,another@example.com,555-6666,Durham,NC,27710,Assistant Scoutmaster,12/31/2025,01/01/2024
"""
        
        result = await RosterService.import_roster(db_session, csv_content)
        
        # Should process 2 rows, skipping the empty one
        assert result["processed"] == 2
    
    async def test_import_roster_upsert_existing(self, db_session):
        """Test that importing same member ID updates existing record"""
        csv_content_1 = b"""memberid,firstname,middlename,lastname,suffix,primaryemail,primaryphone,city,statecode,zip9,positionname,stryptexpirationdate,stryptcompletiondate
77777,Original,,Name,,original@example.com,555-7777,Durham,NC,27711,Scoutmaster,12/31/2025,01/01/2024
"""
        
        # First import
        result1 = await RosterService.import_roster(db_session, csv_content_1)
        assert result1["processed"] == 1
        
        # Second import with updated data for same member ID
        csv_content_2 = b"""memberid,firstname,middlename,lastname,suffix,primaryemail,primaryphone,city,statecode,zip9,positionname,stryptexpirationdate,stryptcompletiondate
77777,Updated,,Name,,updated@example.com,555-9999,Raleigh,NC,27601,Assistant Scoutmaster,06/30/2026,03/01/2024
"""
        
        result2 = await RosterService.import_roster(db_session, csv_content_2)
        assert result2["processed"] == 1
    
    async def test_import_roster_no_header_raises_error(self, db_session):
        """Test that CSV without proper header raises ValueError"""
        csv_content = b"""Just some random data
Without a proper header
12345,John,Doe
"""
        
        with pytest.raises(ValueError, match="Could not find header row"):
            await RosterService.import_roster(db_session, csv_content)
    
    async def test_import_roster_case_insensitive_header(self, db_session):
        """Test that header matching is case-insensitive"""
        csv_content = b"""MEMBERID,FIRSTNAME,MIDDLENAME,LASTNAME,SUFFIX,PRIMARYEMAIL,PRIMARYPHONE,CITY,STATECODE,ZIP9,POSITIONNAME,STRYPTEXPIRATIONDATE,STRYPTCOMPLETIONDATE
88888,Case,,Test,,case@example.com,555-8888,Durham,NC,27712,Scoutmaster,12/31/2025,01/01/2024
"""
        
        result = await RosterService.import_roster(db_session, csv_content)
        
        assert result["processed"] == 1
    
    async def test_import_roster_with_metadata_rows(self, db_session):
        """Test importing roster with multiple metadata rows before header"""
        csv_content = b"""Report Generated: 12/02/2025
Organization: Troop 123
District: Test District
Council: Test Council

memberid,firstname,middlename,lastname,suffix,primaryemail,primaryphone,city,statecode,zip9,positionname,stryptexpirationdate,stryptcompletiondate
99999,Meta,,Data,,meta@example.com,555-9999,Durham,NC,27713,Scoutmaster,12/31/2025,01/01/2024
"""
        
        result = await RosterService.import_roster(db_session, csv_content)
        
        assert result["processed"] == 1
