/**
 * Admin Checkbox Component
 * Compact checkboxes for admin forms
 */

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/admin/lib/utils";

const AdminCheckbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded border border-admin-border bg-admin-bg ring-offset-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-border-focus focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-admin-accent data-[state=checked]:border-admin-accent data-[state=checked]:text-white",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-3 w-3" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
AdminCheckbox.displayName = CheckboxPrimitive.Root.displayName;

// Export as both AdminCheckbox and Checkbox for compatibility
export { AdminCheckbox, AdminCheckbox as Checkbox };
