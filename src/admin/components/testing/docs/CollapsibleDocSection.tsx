import { ReactNode, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/admin/ui';
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
        <Collapsible open={isOpen} onOpenChange={setIsOpen} id={id} className="border border-admin-border rounded-xl overflow-hidden bg-admin-card shadow-sm">
            <CollapsibleTrigger className="flex items-center gap-3 w-full p-4 bg-admin-bg-muted/50 hover:bg-admin-bg-muted transition-all duration-300">
                <div className="flex-shrink-0">
                    {isOpen ? (
                        <ChevronDown className="h-5 w-5 text-admin-text-muted" />
                    ) : (
                        <ChevronRight className="h-5 w-5 text-admin-text-muted" />
                    )}
                </div>
                <span className="text-admin-info p-2 bg-admin-info/10 rounded-lg">{icon}</span>
                <h2 className="text-lg font-bold text-admin-text font-roboto-slab">{title}</h2>
            </CollapsibleTrigger>
            <CollapsibleContent className={cn("p-6 border-t border-admin-border animate-in slide-in-from-top-2 duration-300")}>
                {children}
            </CollapsibleContent>
        </Collapsible>
    );
}
