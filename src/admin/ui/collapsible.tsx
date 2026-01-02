/**
 * Admin Collapsible Component
 * Expandable sections for admin UI
 */

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

const AdminCollapsible = CollapsiblePrimitive.Root;

const AdminCollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;

const AdminCollapsibleContent = CollapsiblePrimitive.CollapsibleContent;

export {
  AdminCollapsible,
  AdminCollapsible as Collapsible,
  AdminCollapsibleTrigger,
  AdminCollapsibleTrigger as CollapsibleTrigger,
  AdminCollapsibleContent,
  AdminCollapsibleContent as CollapsibleContent,
};
