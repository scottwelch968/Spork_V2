-- Add Cosmo Routing Configuration system setting
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES (
  'cosmo_routing_config',
  '{
    "enabled": true,
    "model_id": "deepseek/deepseek-chat-v3.1",
    "provider": "OpenRouter",
    "cost_performance_weight": 50,
    "system_prompt": "You are Cosmo, an intelligent AI routing assistant. Analyze the user prompt and determine the best category for handling it.\n\nCategories:\n- conversation: General chat, Q&A, casual discussion\n- coding: Programming, debugging, code review, algorithms\n- research: Analysis, investigation, deep study, comparisons\n- writing: Essays, articles, blogs, creative writing, emails\n- image_generation: Creating images, pictures, visual content\n- video_generation: Creating videos, animations\n- deep_think: Complex reasoning, math, logic puzzles\n\nRespond with ONLY the category name, nothing else.",
    "available_categories": ["conversation", "coding", "research", "writing", "image_generation", "video_generation", "deep_think"],
    "fallback_category": "conversation"
  }',
  'Configuration for Cosmo AI intelligent model routing with cost-performance weighting'
)
ON CONFLICT (setting_key) DO NOTHING;