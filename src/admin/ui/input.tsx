/**
 * Admin Input Component
 * Compact inputs for admin forms
 */

import * as React from "react";
import { cn } from "@/admin/lib/utils";

export interface AdminInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> { }

const AdminInput = React.forwardRef<HTMLInputElement, AdminInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-8 w-full rounded-md border border-admin-border bg-admin-bg px-3 py-1 text-xs text-admin-text transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-admin-text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
AdminInput.displayName = "AdminInput";

export { AdminInput, AdminInput as Input };
