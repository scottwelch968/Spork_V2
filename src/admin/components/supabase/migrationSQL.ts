/**
 * Migration SQL Files
 * Embedded SQL content for automated migrations
 */

export const migrationSQL = {
  'create-exec-sql-function.sql': `-- =============================================================================
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
COMMENT ON FUNCTION exec_sql(text) IS 'Helper function for executing dynamic SQL statements. Used by automated migration scripts.';`,

  // Note: The other SQL files are too large to embed here
  // They should be loaded from the server or embedded separately
  // For now, we'll provide a way to load them from the docs/migrate directory
  // or use the file system if running in Node.js
};

// Helper to get SQL content
export const getMigrationSQL = async (filename: string): Promise<string> => {
  // First try embedded SQL
  if (migrationSQL[filename as keyof typeof migrationSQL]) {
    return migrationSQL[filename as keyof typeof migrationSQL];
  }

  // Try to fetch from server (if files are served)
  try {
    const response = await fetch(`/docs/migrate/${filename}`);
    if (response.ok) {
      return await response.text();
    }
  } catch (err) {
    console.warn(`Could not fetch ${filename} from server`);
  }

  // Fallback: return empty string and let the user know
  throw new Error(
    `SQL file ${filename} not found. Please ensure the file exists in docs/migrate/ or use the "Download SQL" option to get it manually.`
  );
};



