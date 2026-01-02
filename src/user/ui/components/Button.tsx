import * as React from "react";
import { cn } from "@/user/ui/lib/cn";

type Variant = "default" | "primary" | "ghost" | "icon";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const styles: Record<Variant, string> = {
  default: "ui-btn",
  primary: "ui-btn ui-btn-primary",
  ghost: "ui-btn ui-btn-ghost",
  icon: "ui-btn-icon",
};

export function Button({ variant = "default", className, ...props }: ButtonProps) {
  return <button className={cn(styles[variant], className)} {...props} />;
}
