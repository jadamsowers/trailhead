-- Add logistics and cost fields to outings table
ALTER TABLE outings
ADD COLUMN drop_off_time TIME,
ADD COLUMN drop_off_location VARCHAR(255),
ADD COLUMN pickup_time TIME,
ADD COLUMN pickup_location VARCHAR(255),
ADD COLUMN cost NUMERIC(10, 2),
ADD COLUMN gear_list TEXT;

COMMENT ON COLUMN outings.drop_off_time IS 'Drop-off time for the outing';
COMMENT ON COLUMN outings.drop_off_location IS 'Drop-off location for the outing';
COMMENT ON COLUMN outings.pickup_time IS 'Pickup time for the outing';
COMMENT ON COLUMN outings.pickup_location IS 'Pickup location for the outing';
COMMENT ON COLUMN outings.cost IS 'Cost of the outing in dollars';
COMMENT ON COLUMN outings.gear_list IS 'Suggested gear list for participants (stored as text)';
