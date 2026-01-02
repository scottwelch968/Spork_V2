-- =============================================================================
-- Create exec_sql Helper Function for Automated Migrations
-- =============================================================================
-- This function allows executing dynamic SQL statements via RPC calls
-- Required for the automated migration script to work
--
-- IMPORTANT: This function requires superuser privileges or must be created
-- by a database administrator. Run this FIRST before running the migration script.
-- =============================================================================

-- Create exec_sql function
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE sql_query;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error executing SQL: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users (or service role)
-- Adjust permissions as needed for your security requirements
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;

-- Add comment
COMMENT ON FUNCTION exec_sql(text) IS 'Helper function for executing dynamic SQL statements. Used by automated migration scripts.';



