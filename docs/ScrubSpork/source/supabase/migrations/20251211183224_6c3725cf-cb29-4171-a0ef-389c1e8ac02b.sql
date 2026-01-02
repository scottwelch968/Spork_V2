-- Comprehensive fix: Add line breaks before "1." when preceded by any punctuation
UPDATE prompt_templates 
SET content = REGEXP_REPLACE(
  content, 
  '([.:)\?]) (1\. )', 
  E'\\1\n\n\\2', 
  'g'
)
WHERE is_active = true 
  AND content NOT LIKE E'%\n\n1.%'
  AND content LIKE '% 1. %';

-- Add line breaks before numbered items 2-9
UPDATE prompt_templates 
SET content = REGEXP_REPLACE(
  content, 
  '([.:)\?]) ([2-9]\. )', 
  E'\\1\n\\2', 
  'g'
)
WHERE is_active = true
  AND content LIKE '% 2. %';