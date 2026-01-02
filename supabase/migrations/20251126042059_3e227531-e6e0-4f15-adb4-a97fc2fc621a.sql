-- Create prompt categories table
CREATE TABLE prompt_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create prompt templates table
CREATE TABLE prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES prompt_categories(id) ON DELETE SET NULL,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  use_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE prompt_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prompt_categories
CREATE POLICY "Anyone can view active categories"
  ON prompt_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage categories"
  ON prompt_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for prompt_templates
CREATE POLICY "Anyone can view active templates"
  ON prompt_templates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage templates"
  ON prompt_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_prompt_templates_category ON prompt_templates(category_id);
CREATE INDEX idx_prompt_templates_featured ON prompt_templates(is_featured) WHERE is_featured = true;
CREATE INDEX idx_prompt_templates_active ON prompt_templates(is_active) WHERE is_active = true;

-- Seed prompt categories
INSERT INTO prompt_categories (name, slug, description, icon, display_order) VALUES
  ('Writing', 'writing', 'Content creation, copywriting, and creative writing', 'Pen', 1),
  ('Coding', 'coding', 'Programming, debugging, and code review', 'Code', 2),
  ('Marketing', 'marketing', 'Marketing copy, ads, and promotional content', 'Megaphone', 3),
  ('Business', 'business', 'Business documents, reports, and proposals', 'Briefcase', 4),
  ('Research', 'research', 'Analysis, summaries, and research assistance', 'Search', 5),
  ('Creative', 'creative', 'Brainstorming, ideation, and creative projects', 'Lightbulb', 6),
  ('Education', 'education', 'Learning, teaching, and educational content', 'GraduationCap', 7),
  ('Productivity', 'productivity', 'Task management, planning, and organization', 'CheckSquare', 8);

-- Seed featured prompt templates
INSERT INTO prompt_templates (title, content, description, category_id, is_featured, is_active) VALUES
  (
    'Blog Post Outline',
    'Create a comprehensive blog post outline for the topic: [TOPIC]\n\nInclude:\n- Attention-grabbing headline\n- Introduction hook\n- 5-7 main sections with subpoints\n- Key takeaways\n- Call-to-action\n\nTarget audience: [AUDIENCE]\nTone: [TONE]',
    'Generate structured outlines for blog posts with all key sections',
    (SELECT id FROM prompt_categories WHERE slug = 'writing'),
    true,
    true
  ),
  (
    'Code Review Assistant',
    'Review the following code and provide feedback on:\n\n1. Code quality and readability\n2. Potential bugs or security issues\n3. Performance optimizations\n4. Best practices and conventions\n5. Suggestions for improvement\n\n```\n[PASTE CODE HERE]\n```\n\nLanguage: [PROGRAMMING LANGUAGE]\nContext: [PROJECT CONTEXT]',
    'Get detailed code reviews with actionable feedback',
    (SELECT id FROM prompt_categories WHERE slug = 'coding'),
    true,
    true
  ),
  (
    'Marketing Email Campaign',
    'Create a marketing email campaign for:\n\nProduct/Service: [PRODUCT]\nTarget Audience: [AUDIENCE]\nGoal: [CONVERSION GOAL]\n\nInclude:\n- Subject line (3 variations)\n- Preview text\n- Email body with compelling copy\n- Clear CTA\n- PS line\n\nTone: [PROFESSIONAL/CASUAL/URGENT]',
    'Design high-converting email marketing campaigns',
    (SELECT id FROM prompt_categories WHERE slug = 'marketing'),
    true,
    true
  ),
  (
    'Meeting Summary Generator',
    'Summarize the following meeting notes:\n\n[PASTE MEETING NOTES]\n\nProvide:\n- Key discussion points\n- Decisions made\n- Action items with owners\n- Next steps and deadlines\n- Open questions\n\nFormat: Professional summary for team distribution',
    'Transform meeting notes into clear, actionable summaries',
    (SELECT id FROM prompt_categories WHERE slug = 'business'),
    true,
    true
  ),
  (
    'Research Paper Analyzer',
    'Analyze this research paper/article:\n\n[PASTE CONTENT OR URL]\n\nProvide:\n- Executive summary (2-3 paragraphs)\n- Key findings and methodologies\n- Strengths and limitations\n- Practical implications\n- Related topics for further research\n\nFocus: [SPECIFIC ASPECT]',
    'Get comprehensive analysis of research papers and articles',
    (SELECT id FROM prompt_categories WHERE slug = 'research'),
    true,
    true
  ),
  (
    'Social Media Content Calendar',
    'Create a 30-day social media content calendar for:\n\nBrand: [BRAND NAME]\nPlatforms: [PLATFORMS]\nGoals: [OBJECTIVES]\nTarget Audience: [AUDIENCE]\n\nFor each post include:\n- Post copy\n- Hashtags\n- Best posting time\n- Content type (image/video/carousel)\n- Engagement hooks\n\nTone: [BRAND VOICE]',
    'Plan a month of engaging social media content',
    (SELECT id FROM prompt_categories WHERE slug = 'marketing'),
    false,
    true
  ),
  (
    'Debug Helper',
    'I''m encountering this error:\n\n```\n[ERROR MESSAGE]\n```\n\nIn this code:\n\n```\n[CODE SNIPPET]\n```\n\nEnvironment: [ENVIRONMENT DETAILS]\nWhat I''ve tried: [ATTEMPTED SOLUTIONS]\n\nPlease help me:\n1. Identify the root cause\n2. Explain why this error occurs\n3. Provide step-by-step solution\n4. Suggest preventive measures',
    'Get expert help debugging code errors',
    (SELECT id FROM prompt_categories WHERE slug = 'coding'),
    false,
    true
  ),
  (
    'Creative Story Starter',
    'Generate a creative story premise with:\n\nGenre: [GENRE]\nSetting: [TIME/PLACE]\nTone: [TONE]\n\nInclude:\n- Protagonist description with unique trait\n- Inciting incident\n- Main conflict/challenge\n- Potential plot twists\n- Thematic elements\n\nLength: [SHORT STORY/NOVEL]\nTarget audience: [AGE GROUP]',
    'Get inspired with unique story concepts and characters',
    (SELECT id FROM prompt_categories WHERE slug = 'creative'),
    false,
    true
  ),
  (
    'Study Guide Creator',
    'Create a comprehensive study guide for:\n\nTopic: [SUBJECT/CHAPTER]\nLevel: [GRADE/DIFFICULTY]\nLearning style: [VISUAL/AUDITORY/KINESTHETIC]\n\nInclude:\n- Key concepts and definitions\n- Summary of main points\n- Practice questions (multiple choice and short answer)\n- Memory aids and mnemonics\n- Real-world applications\n- Additional resources',
    'Generate effective study materials for any subject',
    (SELECT id FROM prompt_categories WHERE slug = 'education'),
    false,
    true
  ),
  (
    'Project Proposal Template',
    'Create a project proposal for:\n\nProject Name: [NAME]\nObjective: [GOAL]\nStakeholders: [AUDIENCE]\n\nInclude:\n- Executive summary\n- Problem statement\n- Proposed solution\n- Timeline and milestones\n- Resource requirements\n- Budget estimate\n- Success metrics\n- Risk assessment\n\nFormat: [FORMAL/INFORMAL]',
    'Craft professional project proposals',
    (SELECT id FROM prompt_categories WHERE slug = 'business'),
    false,
    true
  );