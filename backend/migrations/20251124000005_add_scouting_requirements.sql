-- Add scouting requirements and merit badges tables
-- This migration creates tables for tracking Scout rank requirements and merit badges that can be associated with outings

-- Table for storing Scout rank requirements (Scout, Tenderfoot, Second Class, First Class)
CREATE TABLE rank_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rank VARCHAR(50) NOT NULL, -- 'Scout', 'Tenderfoot', 'Second Class', 'First Class'
    requirement_number VARCHAR(20) NOT NULL, -- e.g., '1a', '2b', '3'
    requirement_text TEXT NOT NULL, -- Full description of the requirement
    keywords TEXT[], -- Array of keywords for matching with outing types
    category VARCHAR(100), -- Category like 'Camping', 'Hiking', 'First Aid', 'Cooking', etc.
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups by rank
CREATE INDEX idx_rank_requirements_rank ON rank_requirements(rank);

-- Index for keyword searches
CREATE INDEX idx_rank_requirements_keywords ON rank_requirements USING GIN(keywords);

-- Index for category filtering
CREATE INDEX idx_rank_requirements_category ON rank_requirements(category);

-- Table for storing merit badges
CREATE TABLE merit_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE, -- Merit badge name (e.g., 'First Aid', 'Camping', 'Hiking')
    description TEXT, -- Brief description of the merit badge
    keywords TEXT[], -- Array of keywords for matching with outing types
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups by name
CREATE INDEX idx_merit_badges_name ON merit_badges(name);

-- Index for keyword searches
CREATE INDEX idx_merit_badges_keywords ON merit_badges USING GIN(keywords);

-- Junction table linking outings to rank requirements
CREATE TABLE outing_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outing_id UUID NOT NULL,
    rank_requirement_id UUID NOT NULL,
    notes TEXT, -- Optional notes about how this requirement can be fulfilled on the outing
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (outing_id) REFERENCES outings(id) ON DELETE CASCADE,
    FOREIGN KEY (rank_requirement_id) REFERENCES rank_requirements(id) ON DELETE CASCADE,
    UNIQUE(outing_id, rank_requirement_id) -- Prevent duplicate associations
);

-- Indexes for efficient joins and lookups
CREATE INDEX idx_outing_requirements_outing ON outing_requirements(outing_id);
CREATE INDEX idx_outing_requirements_requirement ON outing_requirements(rank_requirement_id);

-- Junction table linking outings to merit badges
CREATE TABLE outing_merit_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outing_id UUID NOT NULL,
    merit_badge_id UUID NOT NULL,
    notes TEXT, -- Optional notes about which requirements can be worked on
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (outing_id) REFERENCES outings(id) ON DELETE CASCADE,
    FOREIGN KEY (merit_badge_id) REFERENCES merit_badges(id) ON DELETE CASCADE,
    UNIQUE(outing_id, merit_badge_id) -- Prevent duplicate associations
);

-- Indexes for efficient joins and lookups
CREATE INDEX idx_outing_merit_badges_outing ON outing_merit_badges(outing_id);
CREATE INDEX idx_outing_merit_badges_badge ON outing_merit_badges(merit_badge_id);

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_rank_requirements_updated_at BEFORE UPDATE ON rank_requirements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merit_badges_updated_at BEFORE UPDATE ON merit_badges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
