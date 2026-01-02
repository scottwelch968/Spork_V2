/**
 * Admin AlertDialog Component
 * Modal dialogs for destructive confirmations
 */

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "@/admin/lib/utils";

const AdminAlertDialog = AlertDialogPrimitive.Root;

const AdminAlertDialogTrigger = AlertDialogPrimitive.Trigger;

const AdminAlertDialogPortal = AlertDialogPrimitive.Portal;

const AdminAlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
));
AdminAlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

const AdminAlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AdminAlertDialogPortal>
    <AdminAlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-3 border border-admin-border bg-admin-bg-elevated p-4 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-md",
        className
      )}
      {...props}
    />
  </AdminAlertDialogPortal>
));
AdminAlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

const AdminAlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-left",
      className
    )}
    {...props}
  />
);
AdminAlertDialogHeader.displayName = "AdminAlertDialogHeader";

const AdminAlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-2",
      className
    )}
    {...props}
  />
);
AdminAlertDialogFooter.displayName = "AdminAlertDialogFooter";

const AdminAlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-sm font-semibold text-admin-text",
      className
    )}
    {...props}
  />
));
AdminAlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

const AdminAlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn(
      "text-xs text-admin-text-muted",
      className
    )}
    {...props}
  />
));
AdminAlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;

const AdminAlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 items-center justify-center rounded px-3 text-xs font-medium bg-admin-error text-white hover:bg-admin-error/90 focus:outline-none focus:ring-1 focus:ring-admin-border-focus disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
));
AdminAlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

const AdminAlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      "inline-flex h-8 items-center justify-center rounded border border-admin-border bg-transparent px-3 text-xs font-medium text-admin-text hover:bg-admin-hover focus:outline-none focus:ring-1 focus:ring-admin-border-focus disabled:pointer-events-none disabled:opacity-50 mt-2 sm:mt-0",
      className
    )}
    {...props}
  />
));
AdminAlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

export {
  AdminAlertDialog,
  AdminAlertDialog as AlertDialog,
  AdminAlertDialogPortal,
  AdminAlertDialogOverlay,
  AdminAlertDialogTrigger,
  AdminAlertDialogTrigger as AlertDialogTrigger,
  AdminAlertDialogContent,
  AdminAlertDialogContent as AlertDialogContent,
  AdminAlertDialogHeader,
  AdminAlertDialogHeader as AlertDialogHeader,
  AdminAlertDialogFooter,
  AdminAlertDialogFooter as AlertDialogFooter,
  AdminAlertDialogTitle,
  AdminAlertDialogTitle as AlertDialogTitle,
  AdminAlertDialogDescription,
  AdminAlertDialogDescription as AlertDialogDescription,
  AdminAlertDialogAction,
  AdminAlertDialogAction as AlertDialogAction,
  AdminAlertDialogCancel,
  AdminAlertDialogCancel as AlertDialogCancel,
};
