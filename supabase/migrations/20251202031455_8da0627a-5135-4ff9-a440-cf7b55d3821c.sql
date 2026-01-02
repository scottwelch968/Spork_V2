-- Reassign models from old categories to new ones
-- Move 'writing' models to 'conversation'
UPDATE ai_models SET best_for = 'conversation' WHERE best_for = 'writing';

-- Move 'general' models to 'conversation'
UPDATE ai_models SET best_for = 'conversation' WHERE best_for = 'general';

-- Move 'image_understanding' to 'analysis' (vision/analysis models)
UPDATE ai_models SET best_for = 'analysis' WHERE best_for = 'image_understanding';

-- Move 'video_understanding' to 'analysis'
UPDATE ai_models SET best_for = 'analysis' WHERE best_for = 'video_understanding';

-- Assign specific models to 'deep_think' category based on model characteristics
UPDATE ai_models SET best_for = 'deep_think' 
WHERE (model_id ILIKE '%deepseek-r1%' 
   OR model_id ILIKE '%o1%'
   OR model_id ILIKE '%reasoning%'
   OR name ILIKE '%reasoning%'
   OR name ILIKE '%think%')
   AND best_for != 'deep_think';

-- Assign perplexity models to 'research' category
UPDATE ai_models SET best_for = 'research' 
WHERE model_id ILIKE '%perplexity%'
  AND best_for != 'research';

-- Do the same for fallback_models table
UPDATE fallback_models SET best_for = 'conversation' WHERE best_for = 'writing';
UPDATE fallback_models SET best_for = 'conversation' WHERE best_for = 'general';
UPDATE fallback_models SET best_for = 'analysis' WHERE best_for = 'image_understanding';
UPDATE fallback_models SET best_for = 'analysis' WHERE best_for = 'video_understanding';