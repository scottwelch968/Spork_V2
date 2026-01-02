import { icons, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DynamicIconProps {
  name: string;
  className?: string;
  fallback?: string;
}

export function DynamicIcon({ name, className, fallback = 'Boxes' }: DynamicIconProps) {
  const IconComponent = icons[name as keyof typeof icons] || icons[fallback as keyof typeof icons] || icons.Boxes;
  
  return <IconComponent className={cn(className)} />;
}

// Keyword-to-icon mapping for smart suggestions
const ICON_KEYWORDS: Record<string, string> = {
  // Marketing & Advertising
  'marketing': 'Megaphone', 'advertising': 'Megaphone', 'campaign': 'Megaphone',
  'promo': 'Megaphone', 'brand': 'Megaphone', 'social': 'Share2', 'seo': 'Search',
  'content': 'FileText', 'copywriting': 'PenTool', 'newsletter': 'Mail',
  
  // Tech & Development
  'code': 'Code', 'coding': 'Code', 'developer': 'Code', 'programming': 'Terminal',
  'api': 'Code', 'software': 'Laptop', 'engineering': 'Wrench', 'debug': 'Bug',
  'git': 'GitBranch', 'deploy': 'Rocket', 'devops': 'Server', 'database': 'Database',
  'frontend': 'Monitor', 'backend': 'Server', 'fullstack': 'Layers',
  
  // Finance & Business
  'finance': 'DollarSign', 'financial': 'DollarSign', 'budget': 'Wallet',
  'payment': 'CreditCard', 'accounting': 'Calculator', 'invoice': 'Receipt',
  'tax': 'FileText', 'revenue': 'TrendingUp', 'expense': 'TrendingDown',
  'banking': 'Landmark', 'investment': 'LineChart', 'crypto': 'Coins',
  
  // Sales & CRM
  'sales': 'TrendingUp', 'lead': 'UserPlus', 'pipeline': 'GitBranch',
  'crm': 'Users', 'deal': 'Handshake', 'prospect': 'Target', 'customer': 'UserCheck',
  
  // Healthcare
  'health': 'HeartPulse', 'medical': 'Stethoscope', 'doctor': 'Stethoscope',
  'patient': 'Activity', 'wellness': 'Heart', 'fitness': 'Activity',
  'hospital': 'Building2', 'pharmacy': 'Pill', 'therapy': 'Brain',
  
  // Education
  'education': 'GraduationCap', 'learning': 'BookOpen', 'course': 'School',
  'training': 'GraduationCap', 'tutorial': 'BookOpen', 'study': 'Library',
  'teacher': 'Apple', 'student': 'GraduationCap', 'exam': 'Clipboard',
  
  // Creative & Design
  'design': 'Palette', 'creative': 'Lightbulb', 'art': 'Paintbrush',
  'photo': 'Camera', 'video': 'Film', 'music': 'Music', 'audio': 'Headphones',
  'illustration': 'PenTool', 'ux': 'Layers', 'ui': 'Smartphone',
  
  // Writing & Content
  'writing': 'PenTool', 'writer': 'PenTool', 'blog': 'FileText',
  'article': 'Newspaper', 'story': 'BookOpen', 'script': 'FileText',
  'email': 'Mail', 'document': 'FileText', 'report': 'BarChart3',
  
  // Support & Service
  'support': 'Headphones', 'help': 'HelpCircle', 'service': 'Headphones',
  'ticket': 'Tag', 'chat': 'MessageCircle', 'faq': 'HelpCircle',
  
  // Legal & Compliance
  'legal': 'Scale', 'compliance': 'ShieldCheck', 'contract': 'FileText',
  'policy': 'FileText', 'law': 'Scale', 'terms': 'FileText',
  
  // HR & People
  'hr': 'Users', 'human': 'Users', 'resources': 'Users', 'hiring': 'UserPlus',
  'onboarding': 'UserCheck', 'employee': 'BadgeCheck', 'recruit': 'Search',
  'team': 'Users', 'interview': 'MessageSquare', 'performance': 'Award',
  
  // Data & Analytics
  'data': 'BarChart3', 'analytics': 'PieChart', 'metrics': 'Activity',
  'dashboard': 'LayoutDashboard', 'insights': 'Lightbulb', 'statistics': 'TrendingUp',
  'visualization': 'BarChart3', 'bi': 'BarChart3',
  
  // Security
  'security': 'ShieldCheck', 'privacy': 'Lock', 'protection': 'Shield',
  'secure': 'Lock', 'auth': 'Key', 'password': 'KeyRound', 'encrypt': 'LockKeyhole',
  
  // Project Management
  'project': 'Target', 'task': 'Clipboard', 'planning': 'Calendar',
  'roadmap': 'Map', 'timeline': 'Clock', 'milestone': 'Target', 'sprint': 'Zap',
  'agile': 'Zap', 'kanban': 'Layers', 'workflow': 'GitBranch',
  
  // Communication
  'communication': 'MessageSquare', 'meeting': 'Video', 'call': 'Phone',
  'conference': 'Users', 'presentation': 'Presentation', 'webinar': 'Video',
  
  // AI & Automation
  'ai': 'Bot', 'bot': 'Bot', 'assistant': 'Sparkles', 'automation': 'Zap',
  'machine': 'Cpu', 'chatbot': 'MessageSquare', 'intelligent': 'Brain',
  
  // Research
  'research': 'Search', 'analysis': 'BarChart3', 'investigate': 'Search',
  'explore': 'Compass', 'discovery': 'Lightbulb', 'survey': 'Clipboard',
  
  // Travel & Logistics
  'travel': 'Plane', 'trip': 'Map', 'booking': 'Calendar', 'flight': 'Plane',
  'hotel': 'Building2', 'vacation': 'Sun', 'shipping': 'Truck', 'logistics': 'Package',
  
  // Food & Restaurant
  'food': 'UtensilsCrossed', 'restaurant': 'UtensilsCrossed', 'recipe': 'ChefHat',
  'cooking': 'ChefHat', 'menu': 'FileText', 'chef': 'ChefHat', 'dining': 'UtensilsCrossed',
  
  // Ecommerce & Shopping
  'shop': 'ShoppingCart', 'store': 'Store', 'product': 'Package',
  'cart': 'ShoppingCart', 'order': 'ShoppingBag', 'ecommerce': 'ShoppingCart',
  'inventory': 'Package', 'catalog': 'BookOpen',
  
  // General
  'general': 'Sparkles', 'utility': 'Wrench', 'tool': 'Wrench', 'custom': 'Settings',
};

/**
 * Suggests an icon based on the template/tool name by analyzing keywords
 * @param name - The template or tool name to analyze
 * @returns Suggested icon name or null if no match found
 */
export function suggestIconFromName(name: string): string | null {
  if (!name || name.trim().length === 0) return null;
  
  const words = name.toLowerCase().split(/[\s\-_]+/);
  
  // First pass: exact keyword match
  for (const word of words) {
    if (ICON_KEYWORDS[word]) {
      return ICON_KEYWORDS[word];
    }
  }
  
  // Second pass: partial match (keyword contains word or word contains keyword)
  for (const word of words) {
    if (word.length < 3) continue; // Skip short words
    for (const [keyword, icon] of Object.entries(ICON_KEYWORDS)) {
      if (word.includes(keyword) || keyword.includes(word)) {
        return icon;
      }
    }
  }
  
  return null;
}

// Export a list of common icons for the icon selector
export const COMMON_ICONS = [
  // General
  { name: 'Sparkles', label: 'Sparkles', category: 'General' },
  { name: 'Star', label: 'Star', category: 'General' },
  { name: 'Boxes', label: 'Boxes', category: 'General' },
  { name: 'Layers', label: 'Layers', category: 'General' },
  { name: 'Zap', label: 'Zap', category: 'General' },
  { name: 'Target', label: 'Target', category: 'General' },
  { name: 'Compass', label: 'Compass', category: 'General' },
  { name: 'Gem', label: 'Gem', category: 'General' },
  { name: 'Home', label: 'Home', category: 'General' },
  { name: 'Crown', label: 'Crown', category: 'General' },
  { name: 'Flame', label: 'Flame', category: 'General' },
  { name: 'Award', label: 'Award', category: 'General' },
  { name: 'Infinity', label: 'Infinity', category: 'General' },
  { name: 'Puzzle', label: 'Puzzle', category: 'General' },
  { name: 'CircleDot', label: 'Circle Dot', category: 'General' },
  { name: 'Aperture', label: 'Aperture', category: 'General' },
  
  // Business
  { name: 'Briefcase', label: 'Briefcase', category: 'Business' },
  { name: 'Building2', label: 'Building', category: 'Business' },
  { name: 'TrendingUp', label: 'Trending Up', category: 'Business' },
  { name: 'DollarSign', label: 'Dollar', category: 'Business' },
  { name: 'PieChart', label: 'Pie Chart', category: 'Business' },
  { name: 'BarChart3', label: 'Bar Chart', category: 'Business' },
  { name: 'Calculator', label: 'Calculator', category: 'Business' },
  { name: 'Users', label: 'Users', category: 'Business' },
  { name: 'LineChart', label: 'Line Chart', category: 'Business' },
  { name: 'Presentation', label: 'Presentation', category: 'Business' },
  { name: 'Timer', label: 'Timer', category: 'Business' },
  { name: 'Clock', label: 'Clock', category: 'Business' },
  { name: 'Calendar', label: 'Calendar', category: 'Business' },
  { name: 'BadgeCheck', label: 'Badge Check', category: 'Business' },
  { name: 'Handshake', label: 'Handshake', category: 'Business' },
  
  // Creative
  { name: 'Palette', label: 'Palette', category: 'Creative' },
  { name: 'Paintbrush', label: 'Paintbrush', category: 'Creative' },
  { name: 'Lightbulb', label: 'Lightbulb', category: 'Creative' },
  { name: 'Image', label: 'Image', category: 'Creative' },
  { name: 'Camera', label: 'Camera', category: 'Creative' },
  { name: 'Film', label: 'Film', category: 'Creative' },
  { name: 'Music', label: 'Music', category: 'Creative' },
  { name: 'Mic', label: 'Mic', category: 'Creative' },
  { name: 'Scissors', label: 'Scissors', category: 'Creative' },
  { name: 'Brush', label: 'Brush', category: 'Creative' },
  { name: 'Wand2', label: 'Wand', category: 'Creative' },
  { name: 'Shapes', label: 'Shapes', category: 'Creative' },
  { name: 'Layers3', label: 'Layers 3D', category: 'Creative' },
  { name: 'ImagePlus', label: 'Image Plus', category: 'Creative' },
  { name: 'Pencil', label: 'Pencil', category: 'Creative' },
  
  // Tech
  { name: 'Code', label: 'Code', category: 'Tech' },
  { name: 'Terminal', label: 'Terminal', category: 'Tech' },
  { name: 'Database', label: 'Database', category: 'Tech' },
  { name: 'Server', label: 'Server', category: 'Tech' },
  { name: 'Cloud', label: 'Cloud', category: 'Tech' },
  { name: 'Cpu', label: 'CPU', category: 'Tech' },
  { name: 'Bot', label: 'Bot', category: 'Tech' },
  { name: 'Wrench', label: 'Wrench', category: 'Tech' },
  { name: 'Wifi', label: 'Wifi', category: 'Tech' },
  { name: 'Bluetooth', label: 'Bluetooth', category: 'Tech' },
  { name: 'Monitor', label: 'Monitor', category: 'Tech' },
  { name: 'Smartphone', label: 'Smartphone', category: 'Tech' },
  { name: 'Laptop', label: 'Laptop', category: 'Tech' },
  { name: 'HardDrive', label: 'Hard Drive', category: 'Tech' },
  { name: 'GitBranch', label: 'Git Branch', category: 'Tech' },
  { name: 'Blocks', label: 'Blocks', category: 'Tech' },
  
  // Communication
  { name: 'MessageSquare', label: 'Message', category: 'Communication' },
  { name: 'Mail', label: 'Mail', category: 'Communication' },
  { name: 'Phone', label: 'Phone', category: 'Communication' },
  { name: 'Video', label: 'Video', category: 'Communication' },
  { name: 'Megaphone', label: 'Megaphone', category: 'Communication' },
  { name: 'Send', label: 'Send', category: 'Communication' },
  { name: 'AtSign', label: 'At Sign', category: 'Communication' },
  { name: 'Bell', label: 'Bell', category: 'Communication' },
  
  // Documents
  { name: 'FileText', label: 'Document', category: 'Documents' },
  { name: 'File', label: 'File', category: 'Documents' },
  { name: 'Folder', label: 'Folder', category: 'Documents' },
  { name: 'Clipboard', label: 'Clipboard', category: 'Documents' },
  { name: 'BookOpen', label: 'Book', category: 'Documents' },
  { name: 'Newspaper', label: 'Newspaper', category: 'Documents' },
  { name: 'PenTool', label: 'Pen', category: 'Documents' },
  { name: 'Edit3', label: 'Edit', category: 'Documents' },
  
  // Research
  { name: 'Search', label: 'Search', category: 'Research' },
  { name: 'Microscope', label: 'Microscope', category: 'Research' },
  { name: 'FlaskConical', label: 'Flask', category: 'Research' },
  { name: 'GraduationCap', label: 'Education', category: 'Research' },
  { name: 'BookMarked', label: 'Bookmark', category: 'Research' },
  { name: 'Glasses', label: 'Glasses', category: 'Research' },
  
  // Education
  { name: 'School', label: 'School', category: 'Education' },
  { name: 'BookOpenCheck', label: 'Book Check', category: 'Education' },
  { name: 'Library', label: 'Library', category: 'Education' },
  { name: 'Apple', label: 'Apple', category: 'Education' },
  { name: 'PencilRuler', label: 'Pencil Ruler', category: 'Education' },
  { name: 'NotebookPen', label: 'Notebook', category: 'Education' },
  { name: 'Trophy', label: 'Trophy', category: 'Education' },
  { name: 'Medal', label: 'Medal', category: 'Education' },
  
  // Finance
  { name: 'Wallet', label: 'Wallet', category: 'Finance' },
  { name: 'CreditCard', label: 'Credit Card', category: 'Finance' },
  { name: 'Banknote', label: 'Banknote', category: 'Finance' },
  { name: 'Receipt', label: 'Receipt', category: 'Finance' },
  { name: 'Coins', label: 'Coins', category: 'Finance' },
  { name: 'PiggyBank', label: 'Piggy Bank', category: 'Finance' },
  { name: 'Landmark', label: 'Bank', category: 'Finance' },
  { name: 'CircleDollarSign', label: 'Dollar Circle', category: 'Finance' },
  { name: 'BadgeDollarSign', label: 'Dollar Badge', category: 'Finance' },
  { name: 'HandCoins', label: 'Hand Coins', category: 'Finance' },
  
  // Healthcare
  { name: 'Stethoscope', label: 'Stethoscope', category: 'Healthcare' },
  { name: 'Activity', label: 'Activity', category: 'Healthcare' },
  { name: 'HeartPulse', label: 'Heart Pulse', category: 'Healthcare' },
  { name: 'Pill', label: 'Pill', category: 'Healthcare' },
  { name: 'Syringe', label: 'Syringe', category: 'Healthcare' },
  { name: 'Thermometer', label: 'Thermometer', category: 'Healthcare' },
  { name: 'Ambulance', label: 'Ambulance', category: 'Healthcare' },
  { name: 'Cross', label: 'Cross', category: 'Healthcare' },
  { name: 'Hospital', label: 'Hospital', category: 'Healthcare' },
  { name: 'Brain', label: 'Brain', category: 'Healthcare' },
  
  // Entertainment
  { name: 'Gamepad2', label: 'Gamepad', category: 'Entertainment' },
  { name: 'Dice5', label: 'Dice', category: 'Entertainment' },
  { name: 'Popcorn', label: 'Popcorn', category: 'Entertainment' },
  { name: 'Tv', label: 'TV', category: 'Entertainment' },
  { name: 'Radio', label: 'Radio', category: 'Entertainment' },
  { name: 'PartyPopper', label: 'Party', category: 'Entertainment' },
  { name: 'Drama', label: 'Drama', category: 'Entertainment' },
  { name: 'Clapperboard', label: 'Clapperboard', category: 'Entertainment' },
  { name: 'Headphones', label: 'Headphones', category: 'Entertainment' },
  { name: 'Disc3', label: 'Disc', category: 'Entertainment' },
  
  // Travel
  { name: 'Plane', label: 'Plane', category: 'Travel' },
  { name: 'Car', label: 'Car', category: 'Travel' },
  { name: 'Train', label: 'Train', category: 'Travel' },
  { name: 'Ship', label: 'Ship', category: 'Travel' },
  { name: 'Map', label: 'Map', category: 'Travel' },
  { name: 'MapPin', label: 'Map Pin', category: 'Travel' },
  { name: 'Luggage', label: 'Luggage', category: 'Travel' },
  { name: 'Tent', label: 'Tent', category: 'Travel' },
  { name: 'Mountain', label: 'Mountain', category: 'Travel' },
  { name: 'Bike', label: 'Bike', category: 'Travel' },
  
  // Food & Drink
  { name: 'UtensilsCrossed', label: 'Utensils', category: 'Food & Drink' },
  { name: 'Coffee', label: 'Coffee', category: 'Food & Drink' },
  { name: 'Pizza', label: 'Pizza', category: 'Food & Drink' },
  { name: 'Wine', label: 'Wine', category: 'Food & Drink' },
  { name: 'CookingPot', label: 'Cooking Pot', category: 'Food & Drink' },
  { name: 'Salad', label: 'Salad', category: 'Food & Drink' },
  { name: 'IceCream', label: 'Ice Cream', category: 'Food & Drink' },
  { name: 'Beef', label: 'Beef', category: 'Food & Drink' },
  { name: 'Cookie', label: 'Cookie', category: 'Food & Drink' },
  { name: 'ChefHat', label: 'Chef Hat', category: 'Food & Drink' },
  
  // Nature
  { name: 'Leaf', label: 'Leaf', category: 'Nature' },
  { name: 'TreeDeciduous', label: 'Tree', category: 'Nature' },
  { name: 'Flower2', label: 'Flower', category: 'Nature' },
  { name: 'Sun', label: 'Sun', category: 'Nature' },
  { name: 'Moon', label: 'Moon', category: 'Nature' },
  { name: 'CloudRain', label: 'Rain', category: 'Nature' },
  { name: 'Snowflake', label: 'Snowflake', category: 'Nature' },
  { name: 'Wind', label: 'Wind', category: 'Nature' },
  { name: 'Waves', label: 'Waves', category: 'Nature' },
  { name: 'Bird', label: 'Bird', category: 'Nature' },
  
  // Shopping
  { name: 'ShoppingCart', label: 'Shopping Cart', category: 'Shopping' },
  { name: 'ShoppingBag', label: 'Shopping Bag', category: 'Shopping' },
  { name: 'Store', label: 'Store', category: 'Shopping' },
  { name: 'Tag', label: 'Tag', category: 'Shopping' },
  { name: 'Percent', label: 'Percent', category: 'Shopping' },
  { name: 'Gift', label: 'Gift', category: 'Shopping' },
  { name: 'Package', label: 'Package', category: 'Shopping' },
  { name: 'Truck', label: 'Truck', category: 'Shopping' },
  { name: 'BadgePercent', label: 'Discount Badge', category: 'Shopping' },
  { name: 'Barcode', label: 'Barcode', category: 'Shopping' },
  
  // Social
  { name: 'ThumbsUp', label: 'Thumbs Up', category: 'Social' },
  { name: 'Share2', label: 'Share', category: 'Social' },
  { name: 'MessageCircle', label: 'Message Circle', category: 'Social' },
  { name: 'UserPlus', label: 'User Plus', category: 'Social' },
  { name: 'UserCheck', label: 'User Check', category: 'Social' },
  { name: 'Smile', label: 'Smile', category: 'Social' },
  { name: 'Laugh', label: 'Laugh', category: 'Social' },
  { name: 'Heart', label: 'Heart', category: 'Social' },
  { name: 'Eye', label: 'Eye', category: 'Social' },
  { name: 'Bookmark', label: 'Bookmark', category: 'Social' },
  
  // Security
  { name: 'Lock', label: 'Lock', category: 'Security' },
  { name: 'Key', label: 'Key', category: 'Security' },
  { name: 'ShieldCheck', label: 'Shield Check', category: 'Security' },
  { name: 'Fingerprint', label: 'Fingerprint', category: 'Security' },
  { name: 'Scan', label: 'Scan', category: 'Security' },
  { name: 'AlertTriangle', label: 'Alert', category: 'Security' },
  { name: 'ShieldAlert', label: 'Shield Alert', category: 'Security' },
  { name: 'UserCog', label: 'User Settings', category: 'Security' },
  { name: 'KeyRound', label: 'Key Round', category: 'Security' },
  { name: 'LockKeyhole', label: 'Lock Keyhole', category: 'Security' },
  
  // Other
  { name: 'HeadphonesIcon', label: 'Support', category: 'Other' },
  { name: 'Scale', label: 'Legal', category: 'Other' },
  { name: 'Settings', label: 'Settings', category: 'Other' },
  { name: 'Link2', label: 'Link', category: 'Other' },
  { name: 'Shield', label: 'Shield', category: 'Other' },
  { name: 'Globe', label: 'Globe', category: 'Other' },
  { name: 'Rocket', label: 'Rocket', category: 'Other' },
  { name: 'Hammer', label: 'Hammer', category: 'Other' },
  { name: 'Wrench', label: 'Wrench', category: 'Other' },
  { name: 'Cog', label: 'Cog', category: 'Other' },
] as const;

export type IconName = typeof COMMON_ICONS[number]['name'];