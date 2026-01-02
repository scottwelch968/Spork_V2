-- Add line break before numbered list starts (before "1." when preceded by colon or period)
UPDATE prompt_templates 
SET content = REGEXP_REPLACE(content, '([.:]) (1\.)', E'\\1\n\n\\2', 'g')
WHERE content ~ '[.:] 1\\.';

-- Add line breaks before subsequent numbered items (2-9)
UPDATE prompt_templates 
SET content = REGEXP_REPLACE(content, ' ([2-9]\.) ', E'\n\\1 ', 'g')
WHERE content ~ ' [2-9]\\. ';