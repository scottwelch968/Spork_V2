import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  value: string | null;
  onChange: (color: string | null) => void;
  label?: string;
}

const COLOR_OPTIONS = [
  { name: 'Blue', class: 'bg-blue-500', preview: 'bg-blue-500' },
  { name: 'Green', class: 'bg-green-500', preview: 'bg-green-500' },
  { name: 'Orange', class: 'bg-orange-500', preview: 'bg-orange-500' },
  { name: 'Purple', class: 'bg-purple-500', preview: 'bg-purple-500' },
  { name: 'Red', class: 'bg-red-500', preview: 'bg-red-500' },
  { name: 'Pink', class: 'bg-pink-500', preview: 'bg-pink-500' },
  { name: 'Gray', class: 'bg-gray-500', preview: 'bg-gray-500' },
  { name: 'Cyan', class: 'bg-cyan-500', preview: 'bg-cyan-500' },
  { name: 'Yellow', class: 'bg-yellow-500', preview: 'bg-yellow-500' },
  { name: 'Teal', class: 'bg-teal-500', preview: 'bg-teal-500' },
  { name: 'Indigo', class: 'bg-indigo-500', preview: 'bg-indigo-500' },
  { name: 'Rose', class: 'bg-rose-500', preview: 'bg-rose-500' },
];

export function ColorPicker({ value, onChange, label = 'Card Color' }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  
  const selectedColor = COLOR_OPTIONS.find(c => c.class === value);
  
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start gap-2">
            {selectedColor ? (
              <>
                <div className={cn('h-4 w-4 rounded-full', selectedColor.preview)} />
                <span>{selectedColor.name}</span>
              </>
            ) : (
              <>
                <Palette className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Select color (optional)</span>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="grid grid-cols-4 gap-2">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color.class}
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center transition-transform hover:scale-110',
                  color.preview
                )}
                onClick={() => {
                  onChange(color.class);
                  setOpen(false);
                }}
                title={color.name}
              >
                {value === color.class && (
                  <Check className="h-4 w-4 text-white" />
                )}
              </button>
            ))}
          </div>
          {value && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              Clear color
            </Button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
