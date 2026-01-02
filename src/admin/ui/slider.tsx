/**
 * Admin Slider Component
 * Compact range sliders for admin settings
 */

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/admin/lib/utils";

const AdminSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-admin-bg-muted">
      <SliderPrimitive.Range className="absolute h-full bg-admin-accent" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-admin-accent bg-admin-bg ring-offset-transparent transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-admin-border-focus focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 cursor-pointer hover:bg-admin-hover" />
  </SliderPrimitive.Root>
));
AdminSlider.displayName = SliderPrimitive.Root.displayName;

export { AdminSlider, AdminSlider as Slider };
