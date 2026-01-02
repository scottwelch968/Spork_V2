import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * SearchBar - Standard search input
 * 
 * GOLDEN STYLE GUIDE STANDARD:
 * - Border radius: rounded-lg
 * - Border color: border-gray-200
 * - Background: bg-white
 * - Width: w-72
 * - Focus: ring-gray-300
 */
export function SearchBar({ value, onChange, placeholder = "Search...", className }: SearchBarProps) {
  return (
    <div className={cn("ui-search-wrapper", className)}>
      <Search className="ui-search-icon" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="ui-search-input"
      />
    </div>
  );
}
