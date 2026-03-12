-- Add display_name column to user_roles table
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Update the RLS policy to allow users to update their own display_name
-- (assuming existing policy allows UPDATE on user_roles for own rows)
