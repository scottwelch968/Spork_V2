/**
 * Admin Tabs Component
 * Compact tabs for admin navigation
 */

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/admin/lib/utils";

const AdminTabs = TabsPrimitive.Root;

const AdminTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-8 items-center justify-center rounded bg-admin-bg-muted p-0.5 text-admin-text-muted",
      className
    )}
    {...props}
  />
));
AdminTabsList.displayName = TabsPrimitive.List.displayName;

const AdminTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded px-2.5 py-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-border-focus focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-admin-bg-elevated data-[state=active]:text-admin-text data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
));
AdminTabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const AdminTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-border-focus focus-visible:ring-offset-0",
      className
    )}
    {...props}
  />
));
AdminTabsContent.displayName = TabsPrimitive.Content.displayName;

export { AdminTabs, AdminTabsList, AdminTabsTrigger, AdminTabsContent };

// Aliases for standard naming
export { AdminTabs as Tabs, AdminTabsList as TabsList, AdminTabsTrigger as TabsTrigger, AdminTabsContent as TabsContent };
