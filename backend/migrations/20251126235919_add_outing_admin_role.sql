-- Add outing-admin role support
-- This migration documents the addition of a new 'outing-admin' role
-- which has permissions to manage outings but not user or troop management

-- Add a comment to document the new role
COMMENT ON COLUMN users.role IS 'User role: admin, outing-admin, adult, or user';

-- Note: The role column already supports this via varchar(50) - no schema changes needed
-- This migration serves as documentation and versioning for the role addition
