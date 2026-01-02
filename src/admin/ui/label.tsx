/**
 * Admin Label Component
 * Compact labels for admin forms
 */

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/admin/lib/utils";

const adminLabelVariants = cva(
  "text-xs font-medium text-admin-text-muted leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const AdminLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof adminLabelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(adminLabelVariants(), className)}
    {...props}
  />
));
AdminLabel.displayName = LabelPrimitive.Root.displayName;

export { AdminLabel, AdminLabel as Label };
