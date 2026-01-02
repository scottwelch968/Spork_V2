import { Button } from '@/components/ui/button';
import { Eye, Star, Briefcase, Code, Megaphone, HeadphonesIcon, Scale, Settings, Boxes, Search, type LucideIcon } from 'lucide-react';
import { DynamicIcon } from '@/components/ui/DynamicIcon';

interface SpaceTemplate {
  id: string;
  name: string;
  description: string | null;
  ai_model: string | null;
  color_code: string | null;
  image_url: string | null;
  file_quota_mb: number | null;
  is_featured: boolean | null;
  use_count: number | null;
  display_mode?: string | null;
  icon?: string | null;
  category_id?: string | null;
  category?: {
    name: string;
    slug: string;
    icon: string | null;
  };
}

interface SpaceTemplateCardProps {
  template: SpaceTemplate;
  onUse: (template: SpaceTemplate) => void;
  onView: (template: SpaceTemplate) => void;
}

// Map category slug to background color and default icon
const getCategoryStyle = (categorySlug?: string): { bg: string; defaultIcon: string } => {
  const styleMap: Record<string, { bg: string; defaultIcon: string }> = {
    marketing: { bg: 'bg-blue-500', defaultIcon: 'Megaphone' },
    engineering: { bg: 'bg-green-500', defaultIcon: 'Code' },
    sales: { bg: 'bg-blue-500', defaultIcon: 'Briefcase' },
    support: { bg: 'bg-orange-500', defaultIcon: 'HeadphonesIcon' },
    legal: { bg: 'bg-gray-500', defaultIcon: 'Scale' },
    operations: { bg: 'bg-green-500', defaultIcon: 'Settings' },
    research: { bg: 'bg-orange-500', defaultIcon: 'Search' },
  };
  return styleMap[categorySlug || ''] || { bg: 'bg-gray-500', defaultIcon: 'Boxes' };
};

export const SpaceTemplateCard = ({ template, onUse, onView }: SpaceTemplateCardProps) => {
  const categorySlug = template.category?.slug || '';
  const { bg, defaultIcon } = getCategoryStyle(categorySlug);
  const colorCode = template.color_code || bg;
  const displayMode = template.display_mode || 'icon';
  const iconName = template.icon || defaultIcon;
  
  // Detect if color is hex code or Tailwind class
  const isHexColor = colorCode.startsWith('#');
  const bgClassName = isHexColor ? '' : colorCode;
  const bgStyle = isHexColor ? { backgroundColor: colorCode } : undefined;
  
  return (
    <div 
      className={`flex-shrink-0 relative overflow-hidden ${bgClassName} rounded-lg shadow-md`}
      style={bgStyle}
    >
      {/* Decorative SVG */}
      <svg 
        className="absolute bottom-0 left-0 mb-8" 
        viewBox="0 0 375 283" 
        fill="none"
        style={{ transform: 'scale(1.5)', opacity: 0.1 }}
      >
        <rect x="159.52" y="175" width="152" height="152" rx="8" transform="rotate(-45 159.52 175)" fill="white" />
        <rect y="107.48" width="152" height="152" rx="8" transform="rotate(-45 0 107.48)" fill="white" />
      </svg>
      
      {/* Featured star indicator */}
      {template.is_featured && (
        <div className="absolute top-3 right-3 z-20">
          <Star className="h-5 w-5 text-yellow-300" />
        </div>
      )}
      
      {/* Icon/Image section with shadow effect */}
      <div className="relative pt-8 px-8 flex items-center justify-center">
        <div 
          className="block absolute w-44 h-44 bottom-0 left-0 -mb-22 ml-2.5"
          style={{
            background: 'radial-gradient(black, transparent 60%)',
            transform: 'rotate3d(0, 0, 1, 20deg) scale3d(1, 0.6, 1)',
            opacity: 0.2
          }}
        />
        <div className="relative w-28 h-28 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
          {displayMode === 'image' && template.image_url ? (
            <img src={template.image_url} alt={template.name} className="w-full h-full object-cover" />
          ) : (
            <DynamicIcon name={iconName} className="w-14 h-14 text-white" />
          )}
        </div>
      </div>
      
      {/* Text content */}
      <div className="relative text-white px-5 pb-3 mt-5">
        <span className="block opacity-75 -mb-1 text-xs">
          {template.category?.name || 'Space'}
        </span>
        <span className="block font-semibold text-lg truncate">{template.name}</span>
      </div>
      
      {/* Button */}
      <div className="relative px-5 pb-5">
        <Button
          onClick={() => onView(template)}
          variant="outline"
          size="sm"
          className="w-full bg-white/20 border-white/30 text-white hover:bg-white/30"
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      </div>
    </div>
  );
};