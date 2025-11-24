-- Add places table and address columns to outings
-- Migration: 20251124_add_places_and_addresses

-- Create places table
CREATE TABLE places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    google_maps_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for places
CREATE INDEX idx_places_name ON places(name);

-- Add address columns to outings table
ALTER TABLE outings
    ADD COLUMN outing_address TEXT,
    ADD COLUMN outing_place_id UUID REFERENCES places(id) ON DELETE SET NULL,
    ADD COLUMN pickup_address TEXT,
    ADD COLUMN pickup_place_id UUID REFERENCES places(id) ON DELETE SET NULL,
    ADD COLUMN dropoff_address TEXT,
    ADD COLUMN dropoff_place_id UUID REFERENCES places(id) ON DELETE SET NULL;

-- Create indexes for foreign keys
CREATE INDEX idx_outings_outing_place_id ON outings(outing_place_id);
CREATE INDEX idx_outings_pickup_place_id ON outings(pickup_place_id);
CREATE INDEX idx_outings_dropoff_place_id ON outings(dropoff_place_id);

-- Create trigger for places updated_at
CREATE OR REPLACE FUNCTION update_places_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_places_updated_at
    BEFORE UPDATE ON places
    FOR EACH ROW
    EXECUTE FUNCTION update_places_updated_at();

-- Add comments for documentation
COMMENT ON TABLE places IS 'Reusable addresses for outings with Google Maps URLs';
COMMENT ON COLUMN places.name IS 'Display name for the place (e.g., "Camp Whispering Pines", "Church Parking Lot")';
COMMENT ON COLUMN places.address IS 'Full address of the place';
COMMENT ON COLUMN places.google_maps_url IS 'Auto-generated Google Maps URL for the address';

COMMENT ON COLUMN outings.outing_address IS 'Full address of the outing location';
COMMENT ON COLUMN outings.outing_place_id IS 'Reference to saved place for outing location';
COMMENT ON COLUMN outings.pickup_address IS 'Full address for pickup location';
COMMENT ON COLUMN outings.pickup_place_id IS 'Reference to saved place for pickup';
COMMENT ON COLUMN outings.dropoff_address IS 'Full address for drop-off location';
COMMENT ON COLUMN outings.dropoff_place_id IS 'Reference to saved place for drop-off';
