/**
 * Admin Card Component
 * Standardized to match User Card design (rounded-xl/lg) with Admin isolation
 */

import * as React from "react";
import { cn } from "@/admin/lib/utils";

const AdminCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "border border-admin-border bg-admin-bg-elevated text-admin-text shadow-sm",
      className
    )}
    style={{ borderRadius: 'var(--admin-radius-lg)' }}
    {...props}
  />
));
AdminCard.displayName = "AdminCard";

const AdminCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
AdminCardHeader.displayName = "AdminCardHeader";

const AdminCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
AdminCardTitle.displayName = "AdminCardTitle";

const AdminCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm text-admin-text-muted",
      className
    )}
    {...props}
  />
));
AdminCardDescription.displayName = "AdminCardDescription";

const AdminCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-6 pt-0", className)}
    {...props}
  />
));
AdminCardContent.displayName = "AdminCardContent";

const AdminCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
AdminCardFooter.displayName = "AdminCardFooter";

export {
  AdminCard,
  AdminCard as Card,
  AdminCardHeader,
  AdminCardHeader as CardHeader,
  AdminCardFooter,
  AdminCardFooter as CardFooter,
  AdminCardTitle,
  AdminCardTitle as CardTitle,
  AdminCardDescription,
  AdminCardDescription as CardDescription,
  AdminCardContent,
  AdminCardContent as CardContent,
};
