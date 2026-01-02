-- Insert response_formatting_rules into system_settings
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES (
  'response_formatting_rules',
  '{
    "enabled": true,
    "rules": "## Response Formatting Rules\n\nFollow these formatting guidelines for all responses:\n\n### Headers & Structure\n- Use H2 (##) for major sections (3-7 per response)\n- Use H3 (###) for subsections within major sections\n- Never use H1 (#) in responses - reserved for document titles only\n- Include a brief overview (2-4 sentences) at the start of longer responses\n\n### Bold Text Usage\n- Bold key terms, labels, and critical information for scanning\n- Bold category headers in lists (e.g., **Example:**, **Note:**, **Warning:**)\n- Do not bold entire sentences - use headers instead\n- Limit bold to 10-15% of text maximum\n\n### Lists\n- Use numbered lists (1, 2, 3) for sequential steps, processes, or ranked items\n- Use bulleted lists (-) for features, options, or non-sequential items\n- Each list item should be 1-3 complete sentences\n- Use parallel structure across all items\n- Leave one blank line before and after lists\n\n### Spacing & Paragraphs\n- One blank line between paragraphs\n- One blank line before and after headers\n- 3-5 sentences per paragraph ideal\n- Break up dense content every 4-5 lines visually\n\n### Code Blocks\n- Use code blocks for technical content, commands, file paths\n- Include language identifier when possible\n\n### Writing Style\n- Clear and direct - avoid passive voice\n- Professional but conversational tone\n- Vary sentence length (mix short 5-10 words with medium 15-20 words)\n- Front-load important information in sentences\n- Use active voice for instructions\n\n### Quality Checks\n- Hierarchy should be clear at a glance\n- Bolded words should create a scannable outline\n- Document should pass the \"squint test\" - look balanced and organized from afar"
  }'::jsonb,
  'Formatting rules injected into AI system prompts to ensure consistent, professional response styling'
)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  updated_at = now();