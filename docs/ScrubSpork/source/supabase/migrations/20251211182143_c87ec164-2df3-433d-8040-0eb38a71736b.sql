-- Fix all prompt_templates: replace escaped \n with actual newlines and add footer
UPDATE prompt_templates 
SET content = REPLACE(content, '\n', E'\n') || E'\n\n{Edit to put your Data, Task, or Instructions here.}'
WHERE is_active = true 
  AND content NOT LIKE '%{Edit to put your Data, Task, or Instructions here.}%';

-- Fix line breaks in user prompts
UPDATE prompts 
SET content = REPLACE(content, '\n', E'\n')
WHERE content LIKE '%\n%';

-- Fix line breaks in workspace prompts
UPDATE space_prompts 
SET content = REPLACE(content, '\n', E'\n')
WHERE content LIKE '%\n%';