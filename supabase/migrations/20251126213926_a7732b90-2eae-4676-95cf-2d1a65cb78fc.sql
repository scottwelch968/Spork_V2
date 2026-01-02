-- Create persona_categories table
CREATE TABLE persona_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE persona_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage persona categories" 
  ON persona_categories FOR ALL 
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active categories" 
  ON persona_categories FOR SELECT 
  USING (is_active = true);

-- Add updated_at trigger
CREATE TRIGGER handle_persona_categories_updated_at 
  BEFORE UPDATE ON persona_categories 
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Add category_id foreign key to persona_templates
ALTER TABLE persona_templates ADD COLUMN category_id UUID REFERENCES persona_categories(id);

-- Seed default categories
INSERT INTO persona_categories (name, slug, description, icon, display_order) VALUES
  ('General', 'general', 'General purpose AI assistants for everyday tasks', 'Sparkles', 0),
  ('Coding', 'coding', 'Programming and software development assistants', 'Code', 1),
  ('Writing', 'writing', 'Content creation and writing assistants', 'PenTool', 2),
  ('Research', 'research', 'Research and analysis assistants', 'Search', 3),
  ('Creative', 'creative', 'Creative brainstorming and ideation assistants', 'Lightbulb', 4),
  ('Business', 'business', 'Business strategy and analysis assistants', 'Briefcase', 5);

-- Migrate existing data: map category strings to category_id
UPDATE persona_templates pt
SET category_id = (
  SELECT id FROM persona_categories pc 
  WHERE pc.slug = LOWER(COALESCE(pt.category, 'general'))
)
WHERE category_id IS NULL;

-- Drop the old category column
ALTER TABLE persona_templates DROP COLUMN IF EXISTS category;