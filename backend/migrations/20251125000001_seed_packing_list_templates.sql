-- Seed packing list templates and items
-- Migration: 20251125000001_seed_packing_list_templates.sql

-- This migration inserts the default packing list templates (Backpacking, Camping,
-- Cold-Weather Camping) and their items. Each template is only inserted if a
-- template with the same name does not already exist, so this migration is
-- idempotent for repeated runs.

DO $$
DECLARE
  tpl_id uuid;
BEGIN

  -- Backpacking
  IF NOT EXISTS (SELECT 1 FROM packing_list_templates WHERE name = 'Backpacking') THEN
    INSERT INTO packing_list_templates (id, name, description, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Backpacking', 'Suggested packing list for backpacking trips', now(), now())
    RETURNING id INTO tpl_id;

    INSERT INTO packing_list_template_items (id, template_id, name, quantity, sort_order, created_at, updated_at)
    SELECT gen_random_uuid(), tpl_id, elem->> 'name', (elem->> 'quantity')::int, ord - 1, now(), now()
    FROM jsonb_array_elements($json$
  [
    {"name": "Backpack with raincover", "quantity": 1},
    {"name": "Backpacking tent (with stakes, guylines)", "quantity": 1},
    {"name": "Sleeping bag (with stuff sack)", "quantity": 1},
    {"name": "Sleeping pad", "quantity": 1},
    {"name": "Headlamp or flashlight (with extra batteries)", "quantity": 1},
    {"name": "Backpacking stove", "quantity": 1},
    {"name": "Fuel", "quantity": 1},
    {"name": "Cookset (with pot grabber)", "quantity": 1},
    {"name": "Dishes/bowls", "quantity": 1},
    {"name": "Eating Utensils", "quantity": 1},
    {"name": "Mug/cup", "quantity": 1},
    {"name": "Biodegradable soap", "quantity": 1},
    {"name": "Small quick-dry towel", "quantity": 1},
    {"name": "Collapsible water container", "quantity": 1},
    {"name": "Bear canister/food sack + 50' nylon cord", "quantity": 1},
    {"name": "Water bottles and/or reservoir", "quantity": 1},
    {"name": "Water filter/purifier or chemical treatment", "quantity": 1},
    {"name": "Meals", "quantity": 4},
    {"name": "Energy food and drinks (bars, gels, chews, trail mix, drink mix)", "quantity": 2},
    {"name": "Extra day's supply of food", "quantity": 1},
    {"name": "Moisture-wicking underwear", "quantity": 1},
    {"name": "Moisture-wicking T-shirt", "quantity": 1},
    {"name": "Quick-drying pants/shorts", "quantity": 1},
    {"name": "Long-sleeve shirt (for sun, bugs)", "quantity": 1},
    {"name": "Lightweight fleece or jacket", "quantity": 1},
    {"name": "Boots or shoes suited to terrain", "quantity": 1},
    {"name": "Socks (synthetic or wool)", "quantity": 1},
    {"name": "Extra clothes (beyond the minimum expectation)", "quantity": 1},
    {"name": "Rainwear (jacket and pants)", "quantity": 1},
    {"name": "Long underwear", "quantity": 1},
    {"name": "Warm, insulated jacket or vest", "quantity": 1},
    {"name": "Fleece pants", "quantity": 1},
    {"name": "Gloves or mittens", "quantity": 1},
    {"name": "Warm hat", "quantity": 1},
    {"name": "Map (preferably inside a waterproof sleeve)", "quantity": 1},
    {"name": "Compass", "quantity": 1},
    {"name": "First-aid kit", "quantity": 1},
    {"name": "Whistle", "quantity": 1},
    {"name": "Lighter/matches (in waterproof container)", "quantity": 1},
    {"name": "Fire starter (for emergency survival fire)", "quantity": 1},
    {"name": "Emergency shelter", "quantity": 1},
    {"name": "Hand sanitizer", "quantity": 1},
    {"name": "Toothbrush and toothpaste", "quantity": 1},
    {"name": "Sanitation trowel", "quantity": 1},
    {"name": "Toilet paper/wipes and sealable bag (to pack it out)", "quantity": 1},
    {"name": "Menstrual products", "quantity": 1},
    {"name": "Prescription glasses", "quantity": 1},
    {"name": "Sunglasses (+ sunglass straps)", "quantity": 1},
    {"name": "Sunscreen", "quantity": 1},
    {"name": "SPF-rated lip balm", "quantity": 1},
    {"name": "Sun hat", "quantity": 1},
    {"name": "Insect repellent", "quantity": 1},
    {"name": "Knife or Multi-tool", "quantity": 1},
    {"name": "Repair kit (include mattress/stove supplies)", "quantity": 1},
    {"name": "Duct tape strips", "quantity": 1}
]
$json$::jsonb) WITH ORDINALITY arr(elem, ord);
  END IF;

  -- Camping
  IF NOT EXISTS (SELECT 1 FROM packing_list_templates WHERE name = 'Camping') THEN
    INSERT INTO packing_list_templates (id, name, description, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Camping', 'Suggested packing list for car or basecamp camping trips', now(), now())
    RETURNING id INTO tpl_id;

    INSERT INTO packing_list_template_items (id, template_id, name, quantity, sort_order, created_at, updated_at)
    SELECT gen_random_uuid(), tpl_id, elem->> 'name', (elem->> 'quantity')::int, ord - 1, now(), now()
    FROM jsonb_array_elements($json$
  [
    {"name": "Tent (and footprint, stakes)", "quantity": 1},
    {"name": "Sleeping bag", "quantity": 1},
    {"name": "Sleeping pad", "quantity": 1},
    {"name": "Camping pillow", "quantity": 1},
    {"name": "Headlamp or flashlight (and extra batteries)", "quantity": 1},
    {"name": "Camp chair", "quantity": 1},
    {"name": "Camp table (if no picnic table)", "quantity": 1},
    {"name": "Lantern (and mantles and fuel/batteries if needed)", "quantity": 1},
    {"name": "Multi-tool", "quantity": 1},
    {"name": "Duct tape", "quantity": 1},
    {"name": "Extra cord", "quantity": 1},
    {"name": "Tent-pole repair sleeve", "quantity": 1},
    {"name": "Pad/Mattress repair kit", "quantity": 1},
    {"name": "Mallet or hammer (for hammering tent stakes)", "quantity": 1},
    {"name": "Saw or axe (for cutting firewood)", "quantity": 1},
    {"name": "Small broom and dustpan", "quantity": 1},
    {"name": "Eating utensils", "quantity": 1},
    {"name": "Bottle opener, can opener, corkscrew", "quantity": 1},
    {"name": "Sharp knife", "quantity": 1},
    {"name": "Plate/Bowl", "quantity": 1},
    {"name": "Mug", "quantity": 1},
    {"name": "Water bottle", "quantity": 1},
    {"name": "Trash bag", "quantity": 1},
    {"name": "Solar/portable power", "quantity": 1},
    {"name": "Binoculars", "quantity": 1},
    {"name": "Navigation tools", "quantity": 1},
    {"name": "Scout Handbook", "quantity": 1},
    {"name": "Notebook and pen/pencil", "quantity": 1},
    {"name": "Dry bags, stuff sacks or clear plastic bins to store items", "quantity": 2},
    {"name": "Moisture-wicking underwear", "quantity": 3},
    {"name": "Moisture-wicking T-shirts", "quantity": 3},
    {"name": "Quick-drying pants/shorts", "quantity": 2},
    {"name": "Long-sleeve shirts (for sun, bugs)", "quantity": 1},
    {"name": "Lightweight fleece or jacket", "quantity": 1},
    {"name": "Boots or shoes suited to terrain", "quantity": 1},
    {"name": "Socks (synthetic or wool)", "quantity": 3},
    {"name": "Sleepwear", "quantity": 1},
    {"name": "Rainwear (jacket and pants)", "quantity": 1},
    {"name": "Long underwear", "quantity": 1},
    {"name": "Warm insulated jacket or vest", "quantity": 1},
    {"name": "Fleece pants", "quantity": 1},
    {"name": "Gloves or mittens", "quantity": 1},
    {"name": "Warm hat", "quantity": 1},
    {"name": "Hand sanitizer", "quantity": 1},
    {"name": "Toothbrush and toothpaste", "quantity": 1},
    {"name": "Toiletry kit", "quantity": 1},
    {"name": "Quick-dry towel", "quantity": 1},
    {"name": "Menstrual products", "quantity": 1},
    {"name": "First-aid kit", "quantity": 1},
    {"name": "Sunscreen", "quantity": 1},
    {"name": "Sunglasses", "quantity": 1},
    {"name": "Sun hat", "quantity": 1},
    {"name": "Lip balm", "quantity": 1},
    {"name": "Insect repellent", "quantity": 1}
]
$json$::jsonb) WITH ORDINALITY arr(elem, ord);
  END IF;

  -- Cold-Weather Camping
  IF NOT EXISTS (SELECT 1 FROM packing_list_templates WHERE name = 'Cold-Weather Camping') THEN
    INSERT INTO packing_list_templates (id, name, description, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Cold-Weather Camping', 'Suggested packing list for cold-weather camping trips', now(), now())
    RETURNING id INTO tpl_id;

    INSERT INTO packing_list_template_items (id, template_id, name, quantity, sort_order, created_at, updated_at)
    SELECT gen_random_uuid(), tpl_id, elem->> 'name', (elem->> 'quantity')::int, ord - 1, now(), now()
    FROM jsonb_array_elements($json$
  [
    {"name": "Tent (and footprint, stakes)", "quantity": 1},
    {"name": "Sleeping bag", "quantity": 1},
    {"name": "Sleeping pad", "quantity": 1},
    {"name": "Camping pillow", "quantity": 1},
    {"name": "Headlamp or flashlight (and extra batteries)", "quantity": 1},
    {"name": "Camp chair", "quantity": 1},
    {"name": "Camp table (if no picnic table)", "quantity": 1},
    {"name": "Lantern (and mantles and fuel/batteries if needed)", "quantity": 1},
    {"name": "Multi-tool", "quantity": 1},
    {"name": "Duct tape", "quantity": 1},
    {"name": "Extra cord", "quantity": 1},
    {"name": "Tent-pole repair sleeve", "quantity": 1},
    {"name": "Pad/Mattress repair kit", "quantity": 1},
    {"name": "Mallet or hammer (for hammering tent stakes)", "quantity": 1},
    {"name": "Saw or axe (for cutting firewood)", "quantity": 1},
    {"name": "Small broom and dustpan", "quantity": 1},
    {"name": "Eating utensils", "quantity": 1},
    {"name": "Bottle opener, can opener, corkscrew", "quantity": 1},
    {"name": "Sharp knife", "quantity": 1},
    {"name": "Plate/Bowl", "quantity": 1},
    {"name": "Mug", "quantity": 1},
    {"name": "Water bottle", "quantity": 1},
    {"name": "Trash bag", "quantity": 1},
    {"name": "Solar/portable power", "quantity": 1},
    {"name": "Binoculars", "quantity": 1},
    {"name": "Navigation tools", "quantity": 1},
    {"name": "Scout Handbook", "quantity": 1},
    {"name": "Notebook and pen/pencil", "quantity": 1},
    {"name": "Dry bags, stuff sacks or clear plastic bins to store items", "quantity": 2},
    {"name": "Moisture-wicking underwear", "quantity": 3},
    {"name": "Moisture-wicking T-shirts", "quantity": 3},
    {"name": "Quick-drying pants/shorts", "quantity": 2},
    {"name": "Long-sleeve shirts (for sun, bugs)", "quantity": 1},
    {"name": "Lightweight fleece or jacket", "quantity": 1},
    {"name": "Boots or shoes suited to terrain", "quantity": 1},
    {"name": "Socks (synthetic or wool)", "quantity": 3},
    {"name": "Sleepwear", "quantity": 1},
    {"name": "Rainwear (jacket and pants)", "quantity": 1},
    {"name": "Long underwear", "quantity": 1},
    {"name": "Warm insulated jacket or vest", "quantity": 1},
    {"name": "Fleece pants", "quantity": 1},
    {"name": "Gloves or mittens", "quantity": 1},
    {"name": "Warm hat", "quantity": 1},
    {"name": "Hand sanitizer", "quantity": 1},
    {"name": "Toothbrush and toothpaste", "quantity": 1},
    {"name": "Toiletry kit", "quantity": 1},
    {"name": "Quick-dry towel", "quantity": 1},
    {"name": "Menstrual products", "quantity": 1},
    {"name": "First-aid kit", "quantity": 1},
    {"name": "Sunscreen", "quantity": 1},
    {"name": "Sunglasses", "quantity": 1},
    {"name": "Sun hat", "quantity": 1},
    {"name": "Lip balm", "quantity": 1},
    {"name": "Insect repellent", "quantity": 1}
]
$json$::jsonb) WITH ORDINALITY arr(elem, ord);
  END IF;

END$$;
