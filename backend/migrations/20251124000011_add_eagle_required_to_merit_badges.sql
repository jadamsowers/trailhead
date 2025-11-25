-- Migration: Add eagle_required flag to merit_badges
-- Adds a new column to store whether a merit badge is Eagle required.

ALTER TABLE merit_badges ADD COLUMN eagle_required BOOLEAN NOT NULL DEFAULT false;

-- Backfill: Update existing merit badges with correct eagle_required values
-- Eagle-required merit badges as of 2024 BSA requirements

UPDATE merit_badges SET eagle_required = TRUE WHERE name IN (
    'Camping',
    'Citizenship in Society',
    'Citizenship in the Community',
    'Citizenship in the Nation',
    'Citizenship in the World',
    'Communication',
    'Cooking',
    'Cycling',
    'Emergency Preparedness',
    'Environmental Science',
    'Family Life',
    'First Aid',
    'Hiking',
    'Personal Fitness',
    'Personal Management',
    'Sustainability'
);

COMMENT ON COLUMN merit_badges.eagle_required IS 'Boolean flag indicating if the badge is Eagle-required.';
