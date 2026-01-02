-- Add tags column to chat_functions table
ALTER TABLE chat_functions 
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Update existing functions with relevant tags
UPDATE chat_functions SET tags = ARRAY['core', 'request', 'input', 'message', 'chat']
WHERE function_key = 'submitRequest';

UPDATE chat_functions SET tags = ARRAY['core', 'model', 'ai', 'selection', 'routing']
WHERE function_key = 'selectModel';

UPDATE chat_functions SET tags = ARRAY['core', 'response', 'streaming', 'ai', 'output']
WHERE function_key = 'processResponse';

UPDATE chat_functions SET tags = ARRAY['core', 'actions', 'toolbar', 'ui', 'buttons']
WHERE function_key = 'determineActions';

UPDATE chat_functions SET tags = ARRAY['core', 'storage', 'database', 'history', 'persistence']
WHERE function_key = 'persistMessage';

UPDATE chat_functions SET tags = ARRAY['maps', 'location', 'navigation', 'places', 'geocoding', 'directions', 'geography']
WHERE function_key = 'googleMaps';

-- Add comment for documentation
COMMENT ON COLUMN chat_functions.tags IS 'Semantic tags for Cosmo AI function matching and recommendations';