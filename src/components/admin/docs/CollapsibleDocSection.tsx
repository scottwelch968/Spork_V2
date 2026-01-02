import { ReactNode, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface CollapsibleDocSectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  id?: string;
}

export function CollapsibleDocSection({ 
  title, 
  icon, 
  children, 
  defaultOpen = true,
  id 
}: CollapsibleDocSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} id={id}>
      <CollapsibleTrigger className="flex items-center gap-3 w-full p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
        {isOpen ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        )}
        <span className="text-primary">{icon}</span>
        <h2 className="text-lg font-semibold">{title}</h2>
      </CollapsibleTrigger>
      <CollapsibleContent className={cn("mt-4", isOpen && "animate-in slide-in-from-top-2")}>
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
