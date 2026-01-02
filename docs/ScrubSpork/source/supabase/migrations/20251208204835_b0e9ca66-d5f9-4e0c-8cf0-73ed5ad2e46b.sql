-- Update get_db_functions to return actual function definitions
DROP FUNCTION IF EXISTS public.get_db_functions();

CREATE OR REPLACE FUNCTION public.get_db_functions()
RETURNS TABLE(
  routine_name text, 
  data_type text, 
  routine_definition text,
  routine_language text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.proname::text as routine_name,
    pg_get_function_result(p.oid)::text as data_type,
    pg_get_functiondef(p.oid)::text as routine_definition,
    l.lanname::text as routine_language
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  JOIN pg_language l ON p.prolang = l.oid
  WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  ORDER BY p.proname;
$$;

-- Update get_rls_policies to include full policy definitions
DROP FUNCTION IF EXISTS public.get_rls_policies();

CREATE OR REPLACE FUNCTION public.get_rls_policies()
RETURNS TABLE(
  tablename text, 
  policyname text, 
  permissive text, 
  roles text[], 
  cmd text, 
  qual text, 
  with_check text,
  policy_definition text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.tablename::text,
    p.policyname::text,
    p.permissive::text,
    p.roles,
    p.cmd::text,
    p.qual::text,
    p.with_check::text,
    -- Build full CREATE POLICY statement
    format(
      'CREATE POLICY %I ON public.%I AS %s FOR %s TO %s%s%s;',
      p.policyname,
      p.tablename,
      p.permissive,
      p.cmd,
      array_to_string(p.roles, ', '),
      CASE WHEN p.qual IS NOT NULL THEN ' USING (' || p.qual || ')' ELSE '' END,
      CASE WHEN p.with_check IS NOT NULL THEN ' WITH CHECK (' || p.with_check || ')' ELSE '' END
    )::text as policy_definition
  FROM pg_policies p
  WHERE p.schemaname = 'public';
$$;