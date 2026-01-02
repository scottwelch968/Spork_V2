/**
 * Admin Table Component
 * Standardized to match User Table design but with Admin isolation
 */

import * as React from "react";
import { cn } from "@/admin/lib/utils";

const AdminTable = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="flex flex-col">
    <div className="overflow-x-auto">
      <div className="min-w-full inline-block align-middle">
        <div
          className="overflow-hidden border border-admin-border"
          style={{ borderRadius: 'var(--admin-radius-lg)' }}
        >
          <table
            ref={ref}
            className={cn(
              "table-auto min-w-full caption-bottom text-sm",
              className
            )}
            {...props}
          />
        </div>
      </div>
    </div>
  </div>
));
AdminTable.displayName = "AdminTable";

const AdminTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "bg-admin-bg-muted",
      className
    )}
    {...props}
  />
));
AdminTableHeader.displayName = "AdminTableHeader";

const AdminTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn(
      "divide-y divide-admin-border",
      className
    )}
    {...props}
  />
));
AdminTableBody.displayName = "AdminTableBody";

const AdminTableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t border-admin-border bg-admin-bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
));
AdminTableFooter.displayName = "AdminTableFooter";

const AdminTableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "transition-all duration-500 hover:bg-admin-bg-muted/50 data-[state=selected]:bg-admin-bg-muted",
      className
    )}
    {...props}
  />
));
AdminTableRow.displayName = "AdminTableRow";

const AdminTableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, children, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "px-4 py-3 text-left whitespace-nowrap text-sm leading-6 font-semibold text-admin-text capitalize",
      className
    )}
    {...props}
  >
    {children}
  </th>
));
AdminTableHead.displayName = "AdminTableHead";

const AdminTableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "px-4 py-3 whitespace-nowrap text-sm leading-6 font-medium text-admin-text",
      className
    )}
    {...props}
  />
));
AdminTableCell.displayName = "AdminTableCell";

const AdminTableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn(
      "mt-4 text-sm text-admin-text-subtle",
      className
    )}
    {...props}
  />
));
AdminTableCaption.displayName = "AdminTableCaption";

export {
  AdminTable,
  AdminTable as Table,
  AdminTableHeader,
  AdminTableHeader as TableHeader,
  AdminTableBody,
  AdminTableBody as TableBody,
  AdminTableFooter,
  AdminTableFooter as TableFooter,
  AdminTableHead,
  AdminTableHead as TableHead,
  AdminTableRow,
  AdminTableRow as TableRow,
  AdminTableCell,
  AdminTableCell as TableCell,
  AdminTableCaption,
  AdminTableCaption as TableCaption,
};
