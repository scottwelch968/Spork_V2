-- Update get_schema_columns to return actual enum type names instead of USER-DEFINED
CREATE OR REPLACE FUNCTION public.get_schema_columns()
 RETURNS TABLE(table_name text, column_name text, data_type text, is_nullable text, column_default text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    c.table_name::text,
    c.column_name::text,
    CASE 
      WHEN c.data_type = 'USER-DEFINED' THEN c.udt_name::text
      ELSE c.data_type::text
    END as data_type,
    c.is_nullable::text,
    c.column_default::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
  ORDER BY c.table_name, c.ordinal_position;
$function$;