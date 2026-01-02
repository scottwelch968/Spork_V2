
import React from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchFilterProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearchChange?: (value: string) => void;
  value?: string;
  clearable?: boolean;
  containerClassName?: string;
  placeholder?: string;
}

const SearchFilter: React.FC<SearchFilterProps> = ({ 
  onSearchChange, 
  value = "", 
  clearable = true,
  containerClassName,
  placeholder = "Search...",
  className,
  ...props
}) => {
  const [searchValue, setSearchValue] = React.useState(value || "");

  React.useEffect(() => {
    setSearchValue(value || "");
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    onSearchChange && onSearchChange(e.target.value);
  };

  const clearSearch = () => {
    setSearchValue("");
    onSearchChange && onSearchChange("");
  };

  return (
    <div className={cn("relative w-full sm:w-60", containerClassName)}>
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input 
        placeholder={placeholder} 
        className={cn("pl-8", clearable && searchValue ? "pr-8" : "", className)} 
        value={searchValue}
        onChange={handleChange}
        {...props}
      />
      {clearable && searchValue && (
        <button 
          onClick={clearSearch}
          className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground hover:text-foreground"
          type="button"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default SearchFilter;
