import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Star, MoreVertical, Archive, Palette, Check, Sparkles,
  Boxes, Code, Megaphone, Briefcase, HeadphonesIcon, Scale, Settings,
  Rocket, Brain, Lightbulb, Users, FileText, Calculator, PenTool,
  Camera, Music, Gamepad2, ShoppingCart, Heart, Globe, Zap,
  type LucideIcon
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { RemixSpaceDialog } from './RemixSpaceDialog';

const COLOR_OPTIONS = [
  { value: 'blue', label: 'Blue', bgClass: 'bg-blue-500' },
  { value: 'gray', label: 'Gray', bgClass: 'bg-gray-500' },
  { value: 'red', label: 'Red', bgClass: 'bg-red-500' },
  { value: 'green', label: 'Green', bgClass: 'bg-green-500' },
  { value: 'yellow', label: 'Yellow', bgClass: 'bg-yellow-500' },
  { value: 'pink', label: 'Pink', bgClass: 'bg-pink-500' },
];

// Map color code to background class
const getColorBackground = (colorCode: string | null): string => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500',
    gray: 'bg-gray-500',
    red: 'bg-red-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    pink: 'bg-pink-500',
  };
  return colorMap[colorCode || ''] || 'bg-blue-500';
};

// Map space name to relevant icon
const getSpaceIcon = (name: string): LucideIcon => {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('market') || lowerName.includes('advertis') || lowerName.includes('promo')) return Megaphone;
  if (lowerName.includes('code') || lowerName.includes('dev') || lowerName.includes('engineer') || lowerName.includes('tech')) return Code;
  if (lowerName.includes('sale') || lowerName.includes('business') || lowerName.includes('deal')) return Briefcase;
  if (lowerName.includes('support') || lowerName.includes('help') || lowerName.includes('service')) return HeadphonesIcon;
  if (lowerName.includes('legal') || lowerName.includes('compliance') || lowerName.includes('law')) return Scale;
  if (lowerName.includes('operation') || lowerName.includes('ops') || lowerName.includes('config')) return Settings;
  if (lowerName.includes('launch') || lowerName.includes('startup') || lowerName.includes('project')) return Rocket;
  if (lowerName.includes('ai') || lowerName.includes('research') || lowerName.includes('data') || lowerName.includes('analytic')) return Brain;
  if (lowerName.includes('idea') || lowerName.includes('innovat') || lowerName.includes('creative')) return Lightbulb;
  if (lowerName.includes('team') || lowerName.includes('hr') || lowerName.includes('people')) return Users;
  if (lowerName.includes('doc') || lowerName.includes('content') || lowerName.includes('write') || lowerName.includes('blog')) return FileText;
  if (lowerName.includes('finance') || lowerName.includes('account') || lowerName.includes('budget')) return Calculator;
  if (lowerName.includes('design') || lowerName.includes('art') || lowerName.includes('ui') || lowerName.includes('ux')) return PenTool;
  if (lowerName.includes('photo') || lowerName.includes('video') || lowerName.includes('media')) return Camera;
  if (lowerName.includes('music') || lowerName.includes('audio') || lowerName.includes('podcast')) return Music;
  if (lowerName.includes('game') || lowerName.includes('play') || lowerName.includes('fun')) return Gamepad2;
  if (lowerName.includes('shop') || lowerName.includes('store') || lowerName.includes('ecommerce') || lowerName.includes('product')) return ShoppingCart;
  if (lowerName.includes('health') || lowerName.includes('wellness') || lowerName.includes('fitness')) return Heart;
  if (lowerName.includes('global') || lowerName.includes('international') || lowerName.includes('world')) return Globe;
  if (lowerName.includes('automat') || lowerName.includes('workflow') || lowerName.includes('integrat')) return Zap;
  
  return Boxes;
};

export interface ColorTheme {
  gradient: string;
  circle: string;
  accentCircle: string;
  icon: string;
}

interface SpaceCardProps {
  space: {
    id: string;
    name: string;
    description: string | null;
    color_code: string | null;
    owner_id: string;
    last_activity_at: string | null;
    is_archived: boolean;
    is_default?: boolean;
    ai_model?: string | null;
    ai_instructions?: string | null;
    compliance_rule?: string | null;
    file_quota_mb?: number | null;
  };
  isOwner: boolean;
  isPinned: boolean;
  memberCount: number;
  colorTheme: ColorTheme;
  onPin: () => void;
  onArchive: () => void;
  onChangeColor: (colorCode: string) => void;
}

export function SpaceCard({
  space,
  isPinned,
  onPin,
  onArchive,
  onChangeColor,
}: SpaceCardProps) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showRemixDialog, setShowRemixDialog] = useState(false);
  const bgColor = getColorBackground(space.color_code);
  const SpaceIcon = getSpaceIcon(space.name);

  const handleCardClick = (e: React.MouseEvent) => {
    if (!isMenuOpen) {
      navigate(`/workspace/${space.id}`);
    }
  };

  return (
    <Card
      className={`${bgColor} rounded-lg shadow-md cursor-pointer relative overflow-hidden border-0 h-[280px]`}
      onClick={handleCardClick}
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
      
      {/* Pinned star indicator */}
      {isPinned && (
        <div className="absolute top-3 left-3 z-20">
          <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
        </div>
      )}
      
      {/* Dropdown positioned in top-right */}
      <div className="absolute top-3 right-3 z-20">
        <DropdownMenu onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="hover:bg-white/20 text-white">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            {/* Pin/Unpin - disabled for default workspace */}
            {space.is_default ? (
              <DropdownMenuItem disabled>
                <Star className="h-4 w-4 mr-2 text-yellow-500 fill-yellow-500" />
                Always Pinned
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onPin}>
                <Star className="h-4 w-4 mr-2" />
                {isPinned ? 'Unpin' : 'Pin'}
              </DropdownMenuItem>
            )}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Palette className="h-4 w-4 mr-2" />
                Change Color
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="bg-popover">
                  {COLOR_OPTIONS.map((color) => (
                    <DropdownMenuItem
                      key={color.value}
                      onClick={() => onChangeColor(color.value)}
                    >
                      <div className={`w-4 h-4 rounded-full ${color.bgClass} mr-2`} />
                      {color.label}
                      {space.color_code === color.value && <Check className="h-4 w-4 ml-auto" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            {/* Hide Remix and Archive for default workspace */}
            {!space.is_default && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowRemixDialog(true)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Remix
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onArchive}>
                  <Archive className="h-4 w-4 mr-2" />
                  {space.is_archived ? 'Unarchive' : 'Archive'}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Remix Dialog */}
      <RemixSpaceDialog
        open={showRemixDialog}
        onOpenChange={setShowRemixDialog}
        space={{
          id: space.id,
          name: space.name,
          description: space.description,
          ai_model: space.ai_model || null,
          ai_instructions: space.ai_instructions || null,
          compliance_rule: space.compliance_rule || null,
          color_code: space.color_code,
          file_quota_mb: space.file_quota_mb || null,
        }}
      />
      
      {/* Icon section with shadow effect */}
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
          <SpaceIcon className="w-14 h-14 text-white" />
        </div>
      </div>
      
      {/* Text content */}
      <div className="relative text-white px-5 pb-3 mt-5">
        <span className="block font-semibold text-lg truncate">{space.name}</span>
        {space.description && (
          <span className="block opacity-75 text-sm line-clamp-2 mt-1">
            {space.description}
          </span>
        )}
      </div>
      
      {/* Bottom padding */}
      <div className="pb-5" />
    </Card>
  );
}
