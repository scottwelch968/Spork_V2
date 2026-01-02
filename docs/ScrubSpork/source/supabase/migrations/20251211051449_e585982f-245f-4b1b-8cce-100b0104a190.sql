-- Create spork_tool_categories table
CREATE TABLE IF NOT EXISTS public.spork_tool_categories (
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

-- Enable RLS
ALTER TABLE public.spork_tool_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies (use IF NOT EXISTS pattern via DO block)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'spork_tool_categories' AND policyname = 'Admins can manage spork tool categories') THEN
    CREATE POLICY "Admins can manage spork tool categories"
    ON public.spork_tool_categories FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'spork_tool_categories' AND policyname = 'Anyone can view active spork tool categories') THEN
    CREATE POLICY "Anyone can view active spork tool categories"
    ON public.spork_tool_categories FOR SELECT
    USING (is_active = true);
  END IF;
END $$;

-- Clear category references from templates
UPDATE public.persona_templates SET category_id = NULL;
UPDATE public.prompt_templates SET category_id = NULL;
UPDATE public.space_templates SET category_id = NULL;

-- Clear existing categories
DELETE FROM public.prompt_categories;
DELETE FROM public.persona_categories;
DELETE FROM public.space_categories;
DELETE FROM public.spork_tool_categories;

-- Insert new categories into all 4 tables
INSERT INTO public.prompt_categories (name, slug, icon, display_order, is_active) VALUES
('Project Management', 'project-management', 'Kanban', 1, true),
('Business Research', 'business-research', 'Search', 2, true),
('Customer Support', 'customer-support', 'Headphones', 3, true),
('Business Administration', 'business-administration', 'Building', 4, true),
('Business Docs', 'business-docs', 'FileText', 5, true),
('Business Emails', 'business-emails', 'Mail', 6, true),
('Content Creation', 'content-creation', 'Palette', 7, true),
('Business Reports', 'business-reports', 'BarChart', 8, true),
('Operations Management', 'operations-management', 'Settings', 9, true),
('Accounting & Finance', 'accounting-finance', 'DollarSign', 10, true),
('Human Resources', 'human-resources', 'Users', 11, true),
('Marketing', 'marketing', 'Megaphone', 12, true),
('Sales', 'sales', 'TrendingUp', 13, true),
('Information Technology (IT)', 'information-technology', 'Code', 14, true),
('Legal & Compliance', 'legal-compliance', 'Scale', 15, true),
('Product Development', 'product-development', 'Package', 16, true),
('Supply Chain & Logistics', 'supply-chain-logistics', 'Truck', 17, true),
('Research & Development (R&D)', 'research-development', 'FlaskConical', 18, true),
('Executive/Strategic Planning', 'executive-strategic-planning', 'Target', 19, true);

INSERT INTO public.persona_categories (name, slug, icon, display_order, is_active) VALUES
('Project Management', 'project-management', 'Kanban', 1, true),
('Business Research', 'business-research', 'Search', 2, true),
('Customer Support', 'customer-support', 'Headphones', 3, true),
('Business Administration', 'business-administration', 'Building', 4, true),
('Business Docs', 'business-docs', 'FileText', 5, true),
('Business Emails', 'business-emails', 'Mail', 6, true),
('Content Creation', 'content-creation', 'Palette', 7, true),
('Business Reports', 'business-reports', 'BarChart', 8, true),
('Operations Management', 'operations-management', 'Settings', 9, true),
('Accounting & Finance', 'accounting-finance', 'DollarSign', 10, true),
('Human Resources', 'human-resources', 'Users', 11, true),
('Marketing', 'marketing', 'Megaphone', 12, true),
('Sales', 'sales', 'TrendingUp', 13, true),
('Information Technology (IT)', 'information-technology', 'Code', 14, true),
('Legal & Compliance', 'legal-compliance', 'Scale', 15, true),
('Product Development', 'product-development', 'Package', 16, true),
('Supply Chain & Logistics', 'supply-chain-logistics', 'Truck', 17, true),
('Research & Development (R&D)', 'research-development', 'FlaskConical', 18, true),
('Executive/Strategic Planning', 'executive-strategic-planning', 'Target', 19, true);

INSERT INTO public.space_categories (name, slug, icon, display_order, is_active) VALUES
('Project Management', 'project-management', 'Kanban', 1, true),
('Business Research', 'business-research', 'Search', 2, true),
('Customer Support', 'customer-support', 'Headphones', 3, true),
('Business Administration', 'business-administration', 'Building', 4, true),
('Business Docs', 'business-docs', 'FileText', 5, true),
('Business Emails', 'business-emails', 'Mail', 6, true),
('Content Creation', 'content-creation', 'Palette', 7, true),
('Business Reports', 'business-reports', 'BarChart', 8, true),
('Operations Management', 'operations-management', 'Settings', 9, true),
('Accounting & Finance', 'accounting-finance', 'DollarSign', 10, true),
('Human Resources', 'human-resources', 'Users', 11, true),
('Marketing', 'marketing', 'Megaphone', 12, true),
('Sales', 'sales', 'TrendingUp', 13, true),
('Information Technology (IT)', 'information-technology', 'Code', 14, true),
('Legal & Compliance', 'legal-compliance', 'Scale', 15, true),
('Product Development', 'product-development', 'Package', 16, true),
('Supply Chain & Logistics', 'supply-chain-logistics', 'Truck', 17, true),
('Research & Development (R&D)', 'research-development', 'FlaskConical', 18, true),
('Executive/Strategic Planning', 'executive-strategic-planning', 'Target', 19, true);

INSERT INTO public.spork_tool_categories (name, slug, icon, display_order, is_active) VALUES
('Project Management', 'project-management', 'Kanban', 1, true),
('Business Research', 'business-research', 'Search', 2, true),
('Customer Support', 'customer-support', 'Headphones', 3, true),
('Business Administration', 'business-administration', 'Building', 4, true),
('Business Docs', 'business-docs', 'FileText', 5, true),
('Business Emails', 'business-emails', 'Mail', 6, true),
('Content Creation', 'content-creation', 'Palette', 7, true),
('Business Reports', 'business-reports', 'BarChart', 8, true),
('Operations Management', 'operations-management', 'Settings', 9, true),
('Accounting & Finance', 'accounting-finance', 'DollarSign', 10, true),
('Human Resources', 'human-resources', 'Users', 11, true),
('Marketing', 'marketing', 'Megaphone', 12, true),
('Sales', 'sales', 'TrendingUp', 13, true),
('Information Technology (IT)', 'information-technology', 'Code', 14, true),
('Legal & Compliance', 'legal-compliance', 'Scale', 15, true),
('Product Development', 'product-development', 'Package', 16, true),
('Supply Chain & Logistics', 'supply-chain-logistics', 'Truck', 17, true),
('Research & Development (R&D)', 'research-development', 'FlaskConical', 18, true),
('Executive/Strategic Planning', 'executive-strategic-planning', 'Target', 19, true);