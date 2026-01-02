import { 
  Kanban, Search, Headphones, Building, FileText, Mail,
  Palette, BarChart, Settings, DollarSign, Users, Megaphone,
  TrendingUp, Code, Scale, Package, Truck, FlaskConical, Target,
  Sparkles, LucideIcon 
} from "lucide-react";

// Map category slugs/names to their icons
const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  // New business categories (by slug)
  'project-management': Kanban,
  'business-research': Search,
  'customer-support': Headphones,
  'business-administration': Building,
  'business-docs': FileText,
  'business-emails': Mail,
  'content-creation': Palette,
  'business-reports': BarChart,
  'operations-management': Settings,
  'accounting-finance': DollarSign,
  'human-resources': Users,
  'marketing': Megaphone,
  'sales': TrendingUp,
  'information-technology': Code,
  'legal-compliance': Scale,
  'product-development': Package,
  'supply-chain-logistics': Truck,
  'research-development': FlaskConical,
  'executive-strategic-planning': Target,
  
  // Name-based lookups (lowercase)
  'project management': Kanban,
  'business research': Search,
  'customer support': Headphones,
  'business administration': Building,
  'business docs': FileText,
  'business emails': Mail,
  'content creation': Palette,
  'business reports': BarChart,
  'operations management': Settings,
  'accounting & finance': DollarSign,
  'human resources': Users,
  'information technology (it)': Code,
  'legal & compliance': Scale,
  'product development': Package,
  'supply chain & logistics': Truck,
  'research & development (r&d)': FlaskConical,
  'executive/strategic planning': Target,
};

export const getCategoryIcon = (categoryName: string | null | undefined): LucideIcon => {
  if (!categoryName) return Sparkles;
  
  const name = categoryName.toLowerCase().trim();
  
  // Direct lookup
  if (CATEGORY_ICON_MAP[name]) {
    return CATEGORY_ICON_MAP[name];
  }
  
  // Fallback to default
  return Sparkles;
};
