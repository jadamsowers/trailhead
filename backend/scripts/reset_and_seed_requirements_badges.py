"""Reset and seed rank requirements and merit badges from CSV files.

This script performs a destructive reset of the following tables:
  - outing_requirements
  - outing_merit_badges
  - rank_requirements
  - merit_badges

Then it re-imports data from:
  data/rank_requirements.csv
  data/merit_badges.csv

Keyword generation strategy:
  - Combine provided CSV keywords (column 'keywords' for rank requirements;
    for merit badges use 'keywords' if present) with automatically extracted
    tokens using app.utils.suggestions.extract_keywords_from_text over the
    description and contextual fields (rank/category for rank requirements;
    name/description for merit badges).
  - Deduplicate and sort.
  - Preserve outdoor-related tokens and skills per updated extraction logic.

Eagle-required:
  - Merit badges CSV should contain 'eagle required?' column (case-insensitive)
    with values 'true' or 'false'. Default False if missing.

Usage:
  PYTHONPATH=. DATABASE_URL=... python scripts/reset_and_seed_requirements_badges.py [--force]

Flags:
  --force           Proceed without interactive confirmation.
  --dry-run         Parse CSVs and show summary without modifying DB.
  --limit N         Limit number of rows inserted for quick testing.

Exit codes:
  0 on success; non-zero on failure/abort.
"""

import asyncio
import os
import sys
import csv
from pathlib import Path
from typing import List, Set, Tuple, Optional

from sqlalchemy import text

from app.db.session import AsyncSessionLocal
from app.utils.suggestions import extract_keywords_from_text
from app.crud import requirement as crud_requirement
from app.schemas.requirement import (
    RankRequirementCreate,
    MeritBadgeCreate,
)


RANK_CSV = Path(__file__).resolve().parents[2] / "data" / "rank_requirements.csv"
BADGE_CSV = Path(__file__).resolve().parents[2] / "data" / "merit_badges.csv"


def _unique(seq: List[str]) -> List[str]:
    seen: Set[str] = set()
    out: List[str] = []
    for item in seq:
        if item not in seen:
            seen.add(item)
            out.append(item)
    return out


def load_rank_requirements_csv() -> List[Tuple[str, str, str, str, List[str]]]:
    """Return list of (rank, number, category, description, keywords[])."""
    if not RANK_CSV.exists():
        raise FileNotFoundError(f"Rank requirements CSV not found: {RANK_CSV}")
    lines = RANK_CSV.read_text(encoding="utf-8").splitlines()
    # Skip the first line if it's a single header token (file has a banner line)
    if lines and ("," not in lines[0] or lines[0].count(",") < 2):
        lines = lines[1:]
    reader = csv.DictReader(lines)
    rows: List[Tuple[str, str, str, str, List[str]]] = []
    for r in reader:
        rank = (r.get("rank") or "").strip()
        num = (r.get("requirement_number") or "").strip()
        cat = (r.get("category") or "").strip()
        desc = (r.get("description") or "").strip()
        if not rank or not num:
            continue
        raw_kw_cells = [c for k, c in r.items() if k and k.lower().startswith("keywords")]
        provided_kw: List[str] = []
        for cell in raw_kw_cells:
            if cell:
                for part in cell.replace(";", ",").split(","):
                    p = part.strip()
                    if p:
                        provided_kw.append(p.lower())
        rows.append((rank, num, cat, desc, _unique(provided_kw)))
    return rows


def load_merit_badges_csv() -> List[Tuple[str, str, bool, List[str]]]:
    """Return list of (name, description, eagle_required, keywords[])."""
    if not BADGE_CSV.exists():
        raise FileNotFoundError(f"Merit badges CSV not found: {BADGE_CSV}")
    with BADGE_CSV.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows: List[Tuple[str, str, bool, List[str]]] = []
        for r in reader:
            name = (r.get("merit badge name") or r.get("name") or "").strip()
            if not name:
                continue
            desc = (r.get("description") or "").strip()
            eagle_raw = (r.get("eagle required?") or r.get("eagle_required") or "").strip().lower()
            eagle = eagle_raw == "true"
            raw_kw = (r.get("keywords") or "")
            provided_kw: List[str] = [
                p.strip().lower()
                for part in raw_kw.replace(";", ",").split(",")
                if (p := part.strip())
            ]
            rows.append((name, desc, eagle, _unique(provided_kw)))
    return rows


async def destructive_reset(db):
    """Delete all outing associations then core tables."""
    # Order matters due to FK constraints
    for table in ["outing_requirements", "outing_merit_badges", "rank_requirements", "merit_badges"]:
        await db.execute(text(f"DELETE FROM {table}"))
    await db.commit()


async def seed_rank_requirements(db, rows: List[Tuple[str, str, str, str, List[str]]], limit: Optional[int] = None):
    inserted = 0
    for rank, num, cat, desc, provided_kw in rows[: limit or len(rows)]:
        context_text = f"{rank} {cat} {desc}".strip()
        auto_kw = extract_keywords_from_text(context_text)
        merged = _unique(sorted({*(kw.lower() for kw in auto_kw), *provided_kw}))
        payload = RankRequirementCreate(
            rank=rank,
            requirement_number=num,
            requirement_text=desc,
            category=cat or None,
            keywords=merged,
        )
        await crud_requirement.create_rank_requirement(db, payload)
        inserted += 1
    return inserted


async def seed_merit_badges(db, rows: List[Tuple[str, str, bool, List[str]]], limit: Optional[int] = None):
    inserted = 0
    for name, desc, eagle, provided_kw in rows[: limit or len(rows)]:
        context_text = f"{name} {desc}".strip()
        auto_kw = extract_keywords_from_text(context_text)
        merged = _unique(sorted({*(kw.lower() for kw in auto_kw), *provided_kw}))
        payload = MeritBadgeCreate(
            name=name,
            description=desc or None,
            keywords=merged,
            eagle_required=eagle,
        )
        await crud_requirement.create_merit_badge(db, payload)
        inserted += 1
    return inserted


async def main(force: bool, dry_run: bool, limit: Optional[int]):
    rank_rows = load_rank_requirements_csv()
    badge_rows = load_merit_badges_csv()
    print(f"Loaded {len(rank_rows)} rank requirement rows from CSV.")
    print(f"Loaded {len(badge_rows)} merit badge rows from CSV.")

    if dry_run:
        print("Dry run: no changes applied.")
        return

    if not force:
        confirm = input("This will DELETE existing requirements & badges. Type 'yes' to proceed: ").strip().lower()
        if confirm != "yes":
            print("Aborted.")
            return

    async with AsyncSessionLocal() as db:
        print("Performing destructive reset...")
        await destructive_reset(db)
        print("Seeding rank requirements...")
        rank_inserted = await seed_rank_requirements(db, rank_rows, limit)
        print(f"Inserted {rank_inserted} rank requirements.")
        print("Seeding merit badges...")
        badge_inserted = await seed_merit_badges(db, badge_rows, limit)
        print(f"Inserted {badge_inserted} merit badges.")
        await db.commit()
    print("Seeding complete.")


if __name__ == "__main__":
    force = "--force" in sys.argv
    dry_run = "--dry-run" in sys.argv
    limit: Optional[int] = None
    if "--limit" in sys.argv:
        try:
            idx = sys.argv.index("--limit")
            limit = int(sys.argv[idx + 1])
        except Exception:
            print("Invalid or missing value for --limit; ignoring.")
    try:
        asyncio.run(main(force, dry_run, limit))
    except KeyboardInterrupt:
        print("Interrupted.")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
