/**
 * Admin Dialog Component
 * Compact modals for admin operations
 */

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/admin/lib/utils";

const AdminDialog = DialogPrimitive.Root;

const AdminDialogTrigger = DialogPrimitive.Trigger;

const AdminDialogPortal = DialogPrimitive.Portal;

const AdminDialogClose = DialogPrimitive.Close;

const AdminDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
AdminDialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const AdminDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AdminDialogPortal>
    <AdminDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-3 border border-admin-border bg-admin-bg-elevated p-4 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-md",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-3 top-3 rounded opacity-70 ring-offset-transparent transition-opacity hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-admin-border-focus focus:ring-offset-1 disabled:pointer-events-none data-[state=open]:bg-admin-hover">
        <X className="h-4 w-4 text-admin-text-muted" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </AdminDialogPortal>
));
AdminDialogContent.displayName = DialogPrimitive.Content.displayName;

const AdminDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1 text-left",
      className
    )}
    {...props}
  />
);
AdminDialogHeader.displayName = "AdminDialogHeader";

const AdminDialogFooter = ({
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
AdminDialogFooter.displayName = "AdminDialogFooter";

const AdminDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-sm font-semibold text-admin-text leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
AdminDialogTitle.displayName = DialogPrimitive.Title.displayName;

const AdminDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(
      "text-xs text-admin-text-muted",
      className
    )}
    {...props}
  />
));
AdminDialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  AdminDialog,
  AdminDialog as Dialog,
  AdminDialogPortal,
  AdminDialogOverlay,
  AdminDialogClose,
  AdminDialogTrigger,
  AdminDialogTrigger as DialogTrigger,
  AdminDialogContent,
  AdminDialogContent as DialogContent,
  AdminDialogHeader,
  AdminDialogHeader as DialogHeader,
  AdminDialogFooter,
  AdminDialogFooter as DialogFooter,
  AdminDialogTitle,
  AdminDialogTitle as DialogTitle,
  AdminDialogDescription,
  AdminDialogDescription as DialogDescription,
};
