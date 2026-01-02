/**
 * Admin Button Component
 * Standardized to match User Button design (Shadcn/Perplexity) with Admin isolation
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/admin/lib/utils";
import { Loader2 } from "lucide-react";

// Matches standard Shadcn button structure
const adminButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-admin-accent text-white hover:bg-admin-accent-hover",
        destructive:
          "bg-admin-error text-white hover:bg-admin-error/90",
        outline:
          "border border-admin-border bg-transparent hover:bg-admin-bg-muted hover:text-admin-text",
        secondary:
          "bg-admin-secondary text-admin-secondary-text hover:bg-admin-secondary/80",
        ghost:
          "hover:bg-admin-bg-muted hover:text-admin-text",
        link:
          "text-admin-accent underline-offset-4 hover:underline",
        success:
          "bg-admin-success text-white hover:bg-admin-success/90",
        warning:
          "bg-admin-warning text-black hover:bg-admin-warning/90",
      },
      size: {
        default: "h-10 px-4 py-2", // Standard Shadcn size
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xs: "h-7 rounded px-2 text-xs", // Kept for compact admin needs
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface AdminButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof adminButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const AdminButton = React.forwardRef<HTMLButtonElement, AdminButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(adminButtonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </Comp>
    );
  }
);
AdminButton.displayName = "AdminButton";

export { AdminButton, AdminButton as Button, adminButtonVariants };
