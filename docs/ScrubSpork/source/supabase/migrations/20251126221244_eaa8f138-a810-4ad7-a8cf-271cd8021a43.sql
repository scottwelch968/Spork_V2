-- Create space_categories table
CREATE TABLE space_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add category_id to space_templates
ALTER TABLE space_templates 
ADD COLUMN category_id uuid REFERENCES space_categories(id);

-- Enable RLS
ALTER TABLE space_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for space_categories
CREATE POLICY "Admins can manage space categories"
ON space_categories
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view active space categories"
ON space_categories
FOR SELECT
TO authenticated
USING (is_active = true);

-- Seed default categories
INSERT INTO space_categories (name, slug, description, icon, display_order) VALUES
('Marketing', 'marketing', 'Marketing and brand management spaces', 'Megaphone', 1),
('Engineering', 'engineering', 'Development and technical spaces', 'Code', 2),
('Sales', 'sales', 'Sales and customer relationship spaces', 'TrendingUp', 3),
('Support', 'support', 'Customer support and service spaces', 'Headphones', 4),
('Legal', 'legal', 'Legal and compliance spaces', 'Scale', 5),
('Operations', 'operations', 'Operations and logistics spaces', 'Settings', 6);