import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { IconSelector } from './IconSelector';
import { TemplateImageGalleryPicker } from './TemplateImageGalleryPicker';
import { ImageIcon, Sparkles } from 'lucide-react';
import { suggestIconFromName } from '@/components/ui/DynamicIcon';

interface DisplayModeSelectorProps {
  displayMode: 'icon' | 'image';
  icon: string | null;
  imageUrl: string | null;
  onDisplayModeChange: (mode: 'icon' | 'image') => void;
  onIconChange: (icon: string) => void;
  onImageChange: (url: string | null) => void;
  folder?: string;
  templateName?: string;
}

export function DisplayModeSelector({
  displayMode,
  icon,
  imageUrl,
  onDisplayModeChange,
  onIconChange,
  onImageChange,
  folder = 'templates/spaces',
  templateName,
}: DisplayModeSelectorProps) {
  // Calculate suggested icon based on template name
  const suggestedIcon = templateName ? suggestIconFromName(templateName) : null;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Card Display</Label>
        <ToggleGroup
          type="single"
          value={displayMode}
          onValueChange={(value) => {
            if (value) onDisplayModeChange(value as 'icon' | 'image');
          }}
          className="justify-start"
        >
          <ToggleGroupItem value="icon" aria-label="Use icon" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Use Icon
          </ToggleGroupItem>
          <ToggleGroupItem value="image" aria-label="Use image" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            Use Image
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {displayMode === 'icon' ? (
        <IconSelector
          value={icon}
          onChange={onIconChange}
          label="Card Icon"
          suggestedIcon={suggestedIcon}
        />
      ) : (
        <TemplateImageGalleryPicker
          value={imageUrl}
          onChange={onImageChange}
          folder={folder}
          label="Card Image"
        />
      )}
    </div>
  );
}
