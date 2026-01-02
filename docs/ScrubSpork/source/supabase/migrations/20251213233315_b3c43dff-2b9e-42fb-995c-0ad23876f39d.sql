-- Add missing intents that are referenced in cosmo_action_mappings
INSERT INTO public.cosmo_intents (intent_key, display_name, description, category, keywords, priority, is_active)
VALUES 
  ('writing', 'Writing & Content', 'Creative writing, content generation, copywriting tasks', 'creative', ARRAY['write', 'draft', 'compose', 'essay', 'blog', 'article', 'story', 'poem', 'script', 'copy', 'content'], 50, true),
  ('math', 'Math & Calculations', 'Mathematical calculations, equations, statistics, data analysis', 'analytical', ARRAY['calculate', 'math', 'equation', 'formula', 'statistics', 'compute', 'solve', 'algebra', 'geometry', 'arithmetic'], 50, true),
  ('image_generation', 'Image Generation', 'AI image creation, art generation, visual content', 'creative', ARRAY['generate image', 'create image', 'draw', 'illustrate', 'art', 'picture', 'visual', 'design', 'render'], 60, true),
  ('general', 'General Assistance', 'General questions, conversation, and assistance', 'general', ARRAY['help', 'question', 'explain', 'what', 'how', 'why', 'tell me', 'describe'], 10, true)
ON CONFLICT (intent_key) DO NOTHING;