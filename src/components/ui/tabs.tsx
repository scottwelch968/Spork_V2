import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

type TabVariant = "segment" | "underline" | "pill" | "chip" | "ghost" | "boxed"

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  variant?: TabVariant
}

const variantListClasses: Record<TabVariant, string> = {
  segment: "ui-tabs-segment",
  underline: "ui-tabs-underline",
  pill: "ui-tabs-pill",
  chip: "ui-tabs-chip",
  ghost: "ui-tabs-ghost",
  boxed: "ui-tabs-boxed",
}

const variantTriggerClasses: Record<TabVariant, string> = {
  segment: "ui-tab-segment",
  underline: "ui-tab-underline",
  pill: "ui-tab-pill",
  chip: "ui-tab-chip",
  ghost: "ui-tab-ghost",
  boxed: "ui-tab-boxed",
}

// Context to pass variant down to triggers
const TabsVariantContext = React.createContext<TabVariant>("segment")

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant = "underline", ...props }, ref) => (
  <TabsVariantContext.Provider value={variant}>
    <TabsPrimitive.List
      ref={ref}
      className={cn(variantListClasses[variant], className)}
      {...props}
    />
  </TabsVariantContext.Provider>
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const variant = React.useContext(TabsVariantContext)
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(variantTriggerClasses[variant], className)}
      {...props}
    />
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
export type { TabVariant }
