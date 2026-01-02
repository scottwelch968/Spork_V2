/**
 * Admin Calendar Component
 * Date picker for admin forms
 */

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/admin/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function AdminCalendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-3 sm:space-x-3 sm:space-y-0",
        month: "space-y-3",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-xs font-medium text-admin-text",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded border border-admin-border hover:bg-admin-hover"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-admin-text-muted rounded-md w-7 font-normal text-[10px]",
        row: "flex w-full mt-1",
        cell: cn(
          "relative p-0 text-center text-xs focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-admin-accent-muted [&:has([aria-selected].day-outside)]:bg-admin-accent-muted/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day: cn(
          "h-7 w-7 p-0 font-normal text-xs aria-selected:opacity-100 inline-flex items-center justify-center rounded hover:bg-admin-hover focus:bg-admin-hover"
        ),
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected:
          "bg-admin-accent text-white hover:bg-admin-accent-hover hover:text-white focus:bg-admin-accent focus:text-white",
        day_today: "bg-admin-bg-muted text-admin-text",
        day_outside:
          "day-outside text-admin-text-muted opacity-50 aria-selected:bg-admin-accent-muted/50 aria-selected:text-admin-text-muted aria-selected:opacity-30",
        day_disabled: "text-admin-text-muted opacity-50",
        day_range_middle:
          "aria-selected:bg-admin-accent-muted aria-selected:text-admin-accent",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-3.5 w-3.5" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-3.5 w-3.5" />,
      }}
      {...props}
    />
  );
}
AdminCalendar.displayName = "AdminCalendar";

export { AdminCalendar, AdminCalendar as Calendar };
