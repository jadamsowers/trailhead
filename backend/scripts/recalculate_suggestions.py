"""Recalculate keywords for rank requirements and merit badges.

This script rebuilds the keyword arrays used by the suggestion engine based
on the latest CSV data (merit badges) and requirement text (rank requirements).

Usage:
    python scripts/recalculate_suggestions.py

Notes:
    - Merit badge CSV expected at ../../data/merit_badges.csv
    - Rank requirements are recalculated by extracting keywords from
      their requirement_text plus rank & category.
    - Existing keywords are replaced (not appended) to ensure a clean refresh.
"""

import asyncio
import csv
from pathlib import Path
from typing import List, Set

from app.db.session import AsyncSessionLocal
from app.utils.suggestions import extract_keywords_from_text
from app.crud import requirement as crud_requirement
from app.schemas.requirement import RankRequirementUpdate, MeritBadgeUpdate


ADDITIONAL_KEYWORDS_RANK = {"scout"}

# Domain stopwords duplicated from suggestions utils for pruning merged CSV keywords
DOMAIN_STOPWORDS = {
    'badge', 'merit', 'learn', 'learning', 'including', 'activities', 'activity'
    # Keep 'outdoor', 'outdoors', 'skill', 'skills' for improved matching
}


def _unique(seq: List[str]) -> List[str]:
    seen: Set[str] = set()
    out: List[str] = []
    for item in seq:
        if item not in seen:
            seen.add(item)
            out.append(item)
    return out


async def recalc_rank_requirements(db):
    print("Recalculating rank requirement keywords...")
    reqs = await crud_requirement.get_rank_requirements(db, limit=10_000)
    updated = 0
    for req in reqs:
        base_text = f"{req.rank} {req.category or ''} {req.requirement_text}".strip()
        kw = extract_keywords_from_text(base_text)
        # Add curated extras (keeping only those not in pruning set)
        kw.extend([w for w in ADDITIONAL_KEYWORDS_RANK if w not in DOMAIN_STOPWORDS])
        # Final prune of domain stopwords that may slip through (updated set)
        kw = [w for w in kw if w not in DOMAIN_STOPWORDS]
        kw = _unique(sorted(kw))
        update = RankRequirementUpdate(keywords=kw)
        await crud_requirement.update_rank_requirement(db, req.id, update)
        updated += 1
    print(f"Updated {updated} rank requirements.")


async def recalc_merit_badges(db):
    print("Recalculating merit badge keywords & eagle_required from CSV...")
    # Locate CSV (two levels up -> project root / data / merit_badges.csv)
    csv_path = Path(__file__).resolve().parents[2] / "data" / "merit_badges.csv"
    if not csv_path.exists():
        print(f"CSV not found at {csv_path}; skipping merit badge recalculation.")
        return
    # Build mapping name -> provided keyword list
    provided: dict[str, List[str]] = {}
    eagle_required_map: dict[str, bool] = {}
    with csv_path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row.get("merit badge name") or row.get("name")
            if not name:
                continue
            raw = row.get("keywords", "")
            split = [k.strip() for k in raw.replace(";", ",").split(",") if k.strip()]
            provided[name.strip()] = split
            eagle_raw = (row.get("eagle required?", "false") or "false").strip().lower()
            eagle_required_map[name.strip()] = eagle_raw == "true"
    badges = await crud_requirement.get_merit_badges(db, limit=10_000)
    updated = 0
    for badge in badges:
        base_text = f"{badge.name} {badge.description or ''}".strip()
        auto_kw = extract_keywords_from_text(base_text)
        csv_kw = provided.get(badge.name, [])
        # Remove domain stopwords from csv-provided list (updated set)
        csv_kw = [w for w in csv_kw if w not in DOMAIN_STOPWORDS]
        merged = _unique(sorted([w for w in (auto_kw + csv_kw) if w not in DOMAIN_STOPWORDS]))
        update = MeritBadgeUpdate(keywords=merged, eagle_required=eagle_required_map.get(badge.name, False))
        await crud_requirement.update_merit_badge(db, badge.id, update)
        updated += 1
    print(f"Updated {updated} merit badges.")


async def main():
    async with AsyncSessionLocal() as db:
        await recalc_rank_requirements(db)
        await recalc_merit_badges(db)
        await db.commit()
    print("Keyword recalculation complete.")


if __name__ == "__main__":
    asyncio.run(main())