-- ============================================================================
-- GRANT PERMISSIONS TO ANON ROLE
-- ============================================================================
-- This grants necessary permissions to the anon role for public access

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon;

-- Grant SELECT, INSERT, UPDATE, DELETE on all tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;

-- Grant usage on all sequences (for auto-increment IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Alter default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon;
