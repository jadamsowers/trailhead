#!/usr/bin/env python3
"""
Import packing list templates from JSON files into the database.

Usage:
    python scripts/import_packing_lists.py
"""

import asyncio
import json
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.packing_list import PackingListTemplate, PackingListTemplateItem
from app.db.base import Base


async def import_template(db: AsyncSession, template_name: str, json_file: Path):
    """Import a single packing list template from a JSON file"""
    print(f"📦 Importing template: {template_name} from {json_file.name}")
    
    # Read JSON file
    with open(json_file, 'r') as f:
        items = json.load(f)
    
    # Create template
    template = PackingListTemplate(
        name=template_name,
        description=f"Suggested packing list for {template_name.lower()} trips"
    )
    db.add(template)
    await db.flush()
    
    # Create items
    for idx, item_data in enumerate(items):
        item = PackingListTemplateItem(
            template_id=template.id,
            name=item_data['name'],
            quantity=item_data['quantity'],
            sort_order=idx
        )
        db.add(item)
    
    await db.commit()
    print(f"✅ Imported {len(items)} items for {template_name}")
    return template


async def main():
    """Main import function"""
    print("🚀 Starting packing list import...")
    
    # Create async engine
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    # Define templates to import
    data_dir = Path(__file__).parent.parent / "data" / "packing-lists"
    templates = [
        ("Backpacking", data_dir / "backpacking.json"),
        ("Camping", data_dir / "camping.json"),
        ("Cold-Weather Camping", data_dir / "cold-weather-camping.json"),
    ]
    
    async with async_session() as db:
        # Check if templates already exist
        from sqlalchemy import select
        result = await db.execute(select(PackingListTemplate))
        existing = result.scalars().all()
        
        if existing:
            print(f"⚠️  Found {len(existing)} existing templates. Skipping import.")
            print("   Delete existing templates first if you want to re-import.")
            return
        
        # Import each template
        for template_name, json_file in templates:
            if not json_file.exists():
                print(f"❌ File not found: {json_file}")
                continue
            
            await import_template(db, template_name, json_file)
    
    print("✨ Import complete!")


if __name__ == "__main__":
    asyncio.run(main())
