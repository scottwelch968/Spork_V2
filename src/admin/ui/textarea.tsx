/**
 * Admin Textarea Component
 * Compact multi-line inputs for admin forms
 */

import * as React from "react";
import { cn } from "@/admin/lib/utils";

export interface AdminTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }

const AdminTextarea = React.forwardRef<HTMLTextAreaElement, AdminTextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-admin-border bg-admin-bg px-3 py-2 text-sm text-admin-text ring-offset-background placeholder:text-admin-text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
AdminTextarea.displayName = "AdminTextarea";

export { AdminTextarea, AdminTextarea as Textarea };
