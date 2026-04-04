-- v53-fixes.sql
-- Run this script in the Supabase SQL Editor BEFORE using AdminUsers
-- if the admin panel only shows the current user due to RLS restrictions.

-- RPC function to bypass RLS and return all profiles (admin use only)
CREATE OR REPLACE FUNCTION get_all_profiles()
RETURNS SETOF profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM profiles ORDER BY created_at DESC;
$$;
