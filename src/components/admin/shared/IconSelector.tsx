import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DynamicIcon, COMMON_ICONS } from '@/components/ui/DynamicIcon';
import { Search, Lightbulb, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconSelectorProps {
  value: string | null;
  onChange: (icon: string) => void;
  label?: string;
  suggestedIcon?: string | null;
}

export function IconSelector({ value, onChange, label = 'Select Icon', suggestedIcon }: IconSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredIcons = COMMON_ICONS.filter(icon =>
    icon.label.toLowerCase().includes(search.toLowerCase()) ||
    icon.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(filteredIcons.map(i => i.category))];
  
  const suggestedIconData = suggestedIcon ? COMMON_ICONS.find(i => i.name === suggestedIcon) : null;

  const handleUseSuggested = () => {
    if (suggestedIcon) {
      onChange(suggestedIcon);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      
      {/* Suggestion Banner */}
      {suggestedIcon && suggestedIconData && value !== suggestedIcon && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-yellow-500/10 border border-yellow-500/20">
          <Lightbulb className="h-4 w-4 text-yellow-500 flex-shrink-0" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <DynamicIcon name={suggestedIcon} className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-muted-foreground truncate">
              Suggested: <span className="font-medium text-foreground">{suggestedIconData.label}</span>
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs border-yellow-500/30 hover:bg-yellow-500/20"
            onClick={handleUseSuggested}
          >
            <Check className="h-3 w-3 mr-1" />
            Use
          </Button>
        </div>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start gap-2">
            {value ? (
              <>
                <DynamicIcon name={value} className="h-4 w-4" />
                <span>{COMMON_ICONS.find(i => i.name === value)?.label || value}</span>
                {value === suggestedIcon && (
                  <span className="ml-auto text-xs text-yellow-600 bg-yellow-500/10 px-1.5 py-0.5 rounded">
                    Suggested
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">Select an icon</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search icons..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
          <ScrollArea className="h-[280px]">
            <div className="p-3 space-y-4">
              {categories.map(category => (
                <div key={category}>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">{category}</h4>
                  <div className="grid grid-cols-6 gap-1.5">
                    {filteredIcons
                      .filter(i => i.category === category)
                      .map(icon => {
                        const isSelected = value === icon.name;
                        const isSuggested = suggestedIcon === icon.name;
                        
                        return (
                          <button
                            key={icon.name}
                            type="button"
                            className={cn(
                              'h-9 w-9 rounded-md flex items-center justify-center transition-colors relative',
                              isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90',
                              !isSelected && isSuggested && 'ring-2 ring-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20',
                              !isSelected && !isSuggested && 'hover:bg-accent'
                            )}
                            onClick={() => {
                              onChange(icon.name);
                              setOpen(false);
                            }}
                            title={`${icon.label}${isSuggested ? ' (Suggested)' : ''}`}
                          >
                            <DynamicIcon name={icon.name} className="h-5 w-5" />
                            {isSuggested && !isSelected && (
                              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-yellow-500" />
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
              {filteredIcons.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No icons found</p>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
