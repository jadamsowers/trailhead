import csv
import io
from datetime import datetime
from typing import Optional, List, Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert

from app.models.roster import RosterMember

class RosterService:
    @staticmethod
    def parse_date(date_str: str) -> Optional[datetime.date]:
        if not date_str:
            return None
        try:
            # Format seems to be MM/DD/YYYY based on "12/02/2025" in the report date
            return datetime.strptime(date_str, "%m/%d/%Y").date()
        except ValueError:
            return None

    @staticmethod
    async def import_roster(db: AsyncSession, file_content: bytes) -> Dict[str, int]:
        """
        Parses the roster CSV and updates the database.
        Returns a summary of changes.
        """
        content_str = file_content.decode("utf-8", errors="ignore")
        csv_file = io.StringIO(content_str)
        
        # Skip lines until we find the header
        header = None
        reader = csv.reader(csv_file)
        for row in reader:
            if row and row[0] == "memberid":
                header = row
                break
        
        if not header:
            raise ValueError("Could not find header row in CSV file")
        
        # Map header columns to indices
        col_map = {name: index for index, name in enumerate(header)}
        
        stats = {"processed": 0, "added": 0, "updated": 0}
        
        # Process data rows
        for row in reader:
            if not row:
                continue
                
            stats["processed"] += 1
            
            member_data = {
                "bsa_member_id": row[col_map.get("memberid")],
                "first_name": row[col_map.get("firstname")],
                "middle_name": row[col_map.get("middlename")],
                "last_name": row[col_map.get("lastname")],
                "suffix": row[col_map.get("suffix")],
                "full_name": f"{row[col_map.get('firstname')]} {row[col_map.get('lastname')]}", # Simple construction
                "email": row[col_map.get("primaryemail")],
                "mobile_phone": row[col_map.get("primaryphone")],
                "city": row[col_map.get("city")],
                "state": row[col_map.get("statecode")],
                "zip_code": row[col_map.get("zip9")],
                "position": row[col_map.get("positionname")],
                "ypt_expiration": RosterService.parse_date(row[col_map.get("stryptexpirationdate")]),
                "ypt_date": RosterService.parse_date(row[col_map.get("stryptcompletiondate")]),
            }
            
            # Construct full name more carefully if middle name exists
            if member_data["middle_name"]:
                member_data["full_name"] = f"{member_data['first_name']} {member_data['middle_name']} {member_data['last_name']}"
            
            if member_data["suffix"]:
                member_data["full_name"] += f" {member_data['suffix']}"

            # Upsert logic
            stmt = insert(RosterMember).values(member_data)
            stmt = stmt.on_conflict_do_update(
                index_elements=[RosterMember.bsa_member_id],
                set_=member_data
            )
            await db.execute(stmt)
            
        await db.commit()
        return stats
