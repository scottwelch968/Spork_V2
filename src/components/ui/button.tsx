
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "ui-btn",
  {
    variants: {
      variant: {
        default: "ui-btn-primary",
        destructive: "ui-btn-danger",
        outline: "ui-btn-outline",
        secondary: "ui-btn-secondary",
        ghost: "ui-btn-ghost",
        link: "ui-btn-link",
        active: "ui-btn-link text-primary",
        dark: "ui-btn-dark",
        light: "ui-btn-light",
        topbar: "ui-btn-topbar",
      },
      size: {
        default: "",
        sm: "ui-btn-sm",
        lg: "ui-btn-lg",
        icon: "ui-btn-icon",
      },
      status: {
        active: "after:content-[''] after:ml-1 after:inline-block after:w-2 after:h-2 after:bg-green-500 after:rounded-full",
        inactive: "after:content-[''] after:ml-1 after:inline-block after:w-2 after:h-2 after:bg-red-500 after:rounded-full opacity-70 cursor-not-allowed",
        none: "",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      status: "none",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, status, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, status, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
