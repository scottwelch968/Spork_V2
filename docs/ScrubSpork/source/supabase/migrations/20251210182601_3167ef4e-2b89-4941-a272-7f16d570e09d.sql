-- Fix space_templates: Convert hex colors to Tailwind classes
UPDATE space_templates SET color_code = 'bg-red-500' WHERE color_code = '#ef4444';
UPDATE space_templates SET color_code = 'bg-pink-500' WHERE color_code = '#ec4899';
UPDATE space_templates SET color_code = 'bg-teal-500' WHERE color_code = '#14b8a6';
UPDATE space_templates SET color_code = 'bg-green-500' WHERE color_code = '#10b981';
UPDATE space_templates SET color_code = 'bg-orange-500' WHERE color_code = '#f97316';
UPDATE space_templates SET color_code = 'bg-indigo-500' WHERE color_code = '#6366f1';
UPDATE space_templates SET color_code = 'bg-blue-500' WHERE color_code = '#3b82f6';
UPDATE space_templates SET color_code = 'bg-purple-500' WHERE color_code = '#8b5cf6';
UPDATE space_templates SET color_code = 'bg-yellow-500' WHERE color_code = '#eab308';
UPDATE space_templates SET color_code = 'bg-cyan-500' WHERE color_code = '#06b6d4';
UPDATE space_templates SET color_code = 'bg-emerald-500' WHERE color_code = '#10b981';
UPDATE space_templates SET color_code = 'bg-rose-500' WHERE color_code = '#f43f5e';
UPDATE space_templates SET color_code = 'bg-amber-500' WHERE color_code = '#f59e0b';
UPDATE space_templates SET color_code = 'bg-lime-500' WHERE color_code = '#84cc16';
UPDATE space_templates SET color_code = 'bg-sky-500' WHERE color_code = '#0ea5e9';
UPDATE space_templates SET color_code = 'bg-violet-500' WHERE color_code = '#8b5cf6';
UPDATE space_templates SET color_code = 'bg-fuchsia-500' WHERE color_code = '#d946ef';

-- Populate prompt_templates colors based on category
UPDATE prompt_templates pt 
SET color_code = CASE 
  WHEN pc.slug = 'general' THEN 'bg-orange-500'
  WHEN pc.slug = 'coding' THEN 'bg-teal-500'
  WHEN pc.slug = 'writing' THEN 'bg-purple-500'
  WHEN pc.slug = 'research' THEN 'bg-blue-500'
  WHEN pc.slug = 'creative' THEN 'bg-pink-500'
  WHEN pc.slug = 'business' THEN 'bg-indigo-500'
  WHEN pc.slug = 'marketing' THEN 'bg-rose-500'
  WHEN pc.slug = 'productivity' THEN 'bg-emerald-500'
  WHEN pc.slug = 'education' THEN 'bg-cyan-500'
  WHEN pc.slug = 'support' THEN 'bg-amber-500'
  ELSE 'bg-slate-500'
END
FROM prompt_categories pc
WHERE pt.category_id = pc.id AND pt.color_code IS NULL;