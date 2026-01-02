/**
 * Admin Badge Component
 * Standardized to match User Badge design (rounded-full) with Admin isolation
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/admin/lib/utils";

const adminBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-admin-accent focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-admin-accent text-white hover:bg-admin-accent-hover",
        secondary:
          "border-transparent bg-admin-secondary text-admin-secondary-text hover:bg-admin-secondary/80",
        destructive:
          "border-transparent bg-admin-error text-white hover:bg-admin-error/80",
        outline:
          "text-admin-text",
        success:
          "border-transparent bg-admin-success text-white hover:bg-admin-success/80",
        warning:
          "border-transparent bg-admin-warning text-black hover:bg-admin-warning/80",
        info:
          "border-transparent bg-admin-info text-white hover:bg-admin-info/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface AdminBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof adminBadgeVariants> { }

function AdminBadge({ className, variant, ...props }: AdminBadgeProps) {
  return (
    <div className={cn(adminBadgeVariants({ variant }), className)} {...props} />
  );
}

export { AdminBadge, AdminBadge as Badge, adminBadgeVariants };
