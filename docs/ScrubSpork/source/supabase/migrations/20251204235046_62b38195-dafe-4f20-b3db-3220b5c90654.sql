-- Create function to get schema columns
CREATE OR REPLACE FUNCTION public.get_schema_columns()
RETURNS TABLE (
  table_name text,
  column_name text,
  data_type text,
  is_nullable text,
  column_default text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.table_name::text,
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text,
    c.column_default::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
  ORDER BY c.table_name, c.ordinal_position;
$$;

-- Create function to get RLS policies
CREATE OR REPLACE FUNCTION public.get_rls_policies()
RETURNS TABLE (
  tablename text,
  policyname text,
  permissive text,
  roles text[],
  cmd text,
  qual text,
  with_check text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    tablename::text,
    policyname::text,
    permissive::text,
    roles,
    cmd::text,
    qual::text,
    with_check::text
  FROM pg_policies
  WHERE schemaname = 'public';
$$;

-- Create function to get enum types
CREATE OR REPLACE FUNCTION public.get_enum_types()
RETURNS TABLE (
  type_name text,
  enum_label text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.typname::text as type_name,
    e.enumlabel::text as enum_label
  FROM pg_type t 
  JOIN pg_enum e ON t.oid = e.enumtypid
  JOIN pg_namespace n ON t.typnamespace = n.oid
  WHERE n.nspname = 'public'
  ORDER BY t.typname, e.enumsortorder;
$$;

-- Create function to get database functions
CREATE OR REPLACE FUNCTION public.get_db_functions()
RETURNS TABLE (
  routine_name text,
  data_type text,
  routine_arguments text,
  routine_language text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    r.routine_name::text,
    r.data_type::text,
    ''::text as routine_arguments,
    r.external_language::text as routine_language
  FROM information_schema.routines r
  WHERE r.routine_schema = 'public'
  ORDER BY r.routine_name;
$$;

-- Create function to get foreign keys
CREATE OR REPLACE FUNCTION public.get_foreign_keys()
RETURNS TABLE (
  table_name text,
  column_name text,
  foreign_table_name text,
  foreign_column_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    tc.table_name::text,
    kcu.column_name::text,
    ccu.table_name::text as foreign_table_name,
    ccu.column_name::text as foreign_column_name
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu 
    ON tc.constraint_name = kcu.constraint_name 
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu 
    ON ccu.constraint_name = tc.constraint_name 
    AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public';
$$;

-- Create function to get RLS status per table
CREATE OR REPLACE FUNCTION public.get_rls_status()
RETURNS TABLE (
  table_name text,
  rls_enabled boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    relname::text as table_name,
    relrowsecurity as rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' 
    AND c.relkind = 'r'
  ORDER BY relname;
$$;