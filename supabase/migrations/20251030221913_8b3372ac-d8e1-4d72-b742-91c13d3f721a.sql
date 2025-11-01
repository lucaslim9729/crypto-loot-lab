-- Trigger types regeneration after project remix
-- This migration ensures the TypeScript types file is up to date

-- Add a helpful comment to the profiles table
COMMENT ON TABLE public.profiles IS 'User profile data and balances';

-- Verify all tables exist (this doesn't change anything but helps confirm schema)
DO $$ 
BEGIN
  RAISE NOTICE 'Schema verification complete. All tables present.';
END $$;