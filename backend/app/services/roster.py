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
    async def import_roster(db: AsyncSession, file_content: bytes | List[bytes]) -> Dict[str, int]:
        """
        Parses one or more roster CSV files and updates the database.
        Accepts a single `bytes` object (one CSV) or a list of `bytes` for multiple CSVs
        (useful for Scoutbook's separate youth/adult exports).

        Returns summary counts: processed, added, updated.
        """
        # Normalize to a list of file bytes
        files: List[bytes]
        if isinstance(file_content, (bytes, bytearray)):
            files = [bytes(file_content)]
        else:
            files = list(file_content)

        stats = {"processed": 0, "added": 0, "updated": 0}

        async def _process_single(content: bytes):
            content_str = content.decode("utf-8", errors="ignore")
            csv_file = io.StringIO(content_str)

            # Read with csv.reader so quoted headers (Scoutbook) are parsed correctly
            reader = csv.reader(csv_file)

            # Find header row -- support my.scouting (memberid) and Scoutbook (contains 'bsa member id')
            header = None
            header_row = None
            for row in reader:
                if not row:
                    continue
                # normalize candidate header cells
                normalized = [c.strip().lower().lstrip('.') for c in row]
                # my.scouting sometimes has header that starts with 'memberid' possibly prefixed by dots
                if normalized[0].endswith("memberid") or normalized[0] == "memberid":
                    header = [c.strip().lstrip('.') for c in row]
                    header_row = normalized
                    break
                # Scoutbook uses 'bsa member id' column name
                if any("bsa member id" == c for c in normalized):
                    header = [c.strip() for c in row]
                    header_row = normalized
                    break

            if not header:
                # Could not find header in this file; skip it with an informative error
                raise ValueError("Could not find header row in CSV file. Expected 'memberid' or 'BSA Member ID' header.")

            # Build a map of normalized header name -> index
            col_map = {name.lower(): idx for idx, name in enumerate(header)}

            # Helper to safely get a cell by possible header names
            def get_cell(row: List[str], *possible_names: str) -> str:
                for name in possible_names:
                    if name and name.lower() in col_map:
                        idx = col_map[name.lower()]
                        if idx < len(row):
                            return row[idx].strip()
                return ""

            # iterate remaining rows
            for row in reader:
                if not row:
                    continue
                stats["processed"] += 1

                # Determine values from either Scoutbook or my.scouting headers
                bsa_id = get_cell(row, "memberid", "bsa member id")
                if not bsa_id:
                    # skip rows without a BSA id
                    continue

                first_name = get_cell(row, "firstname", "first name")
                middle_name = get_cell(row, "middlename",)
                last_name = get_cell(row, "lastname", "last name")
                suffix = get_cell(row, "suffix")

                # Email fields - Scoutbook scouts often provide parent emails; adults file has 'Email'
                email = get_cell(row, "primaryemail", "email", "parent 1 email")
                # phone fields
                mobile_phone = get_cell(row, "primaryphone", "mobile phone", "home phone")

                city = get_cell(row, "city")
                state = get_cell(row, "statecode", "state")
                zip_code = get_cell(row, "zip9", "zip")

                position = get_cell(row, "positionname", "position", "leader position 1")

                # ypt fields may be different or absent in Scoutbook exports
                ypt_exp = get_cell(row, "stryptexpirationdate")
                ypt_date = get_cell(row, "stryptcompletiondate")

                member_data = {
                    "bsa_member_id": bsa_id,
                    "first_name": first_name,
                    "middle_name": middle_name,
                    "last_name": last_name,
                    "suffix": suffix,
                    "full_name": f"{first_name} {last_name}",
                    "email": email,
                    "mobile_phone": mobile_phone,
                    "city": city,
                    "state": state,
                    "zip_code": zip_code,
                    "position": position,
                    "ypt_expiration": RosterService.parse_date(ypt_exp),
                    "ypt_date": RosterService.parse_date(ypt_date),
                }

                if middle_name:
                    member_data["full_name"] = f"{first_name} {middle_name} {last_name}".strip()
                if suffix:
                    member_data["full_name"] = f"{member_data['full_name']} {suffix}".strip()

                # Determine whether record exists so we can increment added/updated counts
                from sqlalchemy import select
                result = await db.execute(select(RosterMember).where(RosterMember.bsa_member_id == bsa_id))
                existing = result.scalar_one_or_none()

                if existing:
                    stats["updated"] += 1
                else:
                    stats["added"] += 1

                # Upsert (insert or update)
                stmt = insert(RosterMember).values(member_data)
                stmt = stmt.on_conflict_do_update(
                    index_elements=[RosterMember.bsa_member_id],
                    set_=member_data
                )
                await db.execute(stmt)

        # Process each file sequentially and commit once
        for f in files:
            await _process_single(f)

        await db.commit()
        return stats
