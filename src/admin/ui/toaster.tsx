/**
 * Admin Toaster Component
 * Toast container for admin notifications
 */

import { useAdminToast } from "@/admin/hooks/use-admin-toast";
import {
  AdminToast,
  AdminToastClose,
  AdminToastDescription,
  AdminToastProvider,
  AdminToastTitle,
  AdminToastViewport,
} from "@/admin/ui/toast";

export function AdminToaster() {
  const { toasts } = useAdminToast();

  return (
    <AdminToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <AdminToast key={id} {...props}>
            <div className="grid gap-1">
              {title && <AdminToastTitle>{title}</AdminToastTitle>}
              {description && (
                <AdminToastDescription>{description}</AdminToastDescription>
              )}
            </div>
            {action}
            <AdminToastClose />
          </AdminToast>
        );
      })}
      <AdminToastViewport />
    </AdminToastProvider>
  );
}
