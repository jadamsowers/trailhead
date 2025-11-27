-- Rename 'user' role to 'participant'
-- This migration documents the role name change from 'user' to 'participant'

-- Update the comment to reflect the new role name
COMMENT ON COLUMN users.role IS 'User role: admin, outing-admin, adult, or participant';

-- Note: The role column already supports this via varchar(50) - no schema changes needed
-- Existing users with 'user' role will need to be manually updated or updated via application logic
