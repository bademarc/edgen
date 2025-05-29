import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm hover:shadow-md hover:-translate-y-0.5",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive-hover shadow-sm hover:shadow-md",
        outline: "border border-border bg-background hover:bg-secondary hover:text-secondary-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-hover",
        ghost: "hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Professional LayerEdge variants
        layeredge: "bg-primary text-primary-foreground font-semibold hover:bg-primary-hover shadow-md hover:shadow-lg hover:shadow-[0_0_10px_rgba(247,147,26,0.2)] hover:-translate-y-0.5",
        layeredgeSecondary: "bg-secondary text-secondary-foreground border border-border hover:bg-secondary-hover hover:border-primary hover:text-primary hover:-translate-y-0.5",
        layeredgeGhost: "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border",
        // Bitcoin orange primary
        bitcoin: "bg-bitcoin-orange text-black font-semibold hover:bg-bitcoin-orange-dark shadow-md hover:shadow-lg hover:shadow-[0_0_10px_rgba(247,147,26,0.2)] hover:-translate-y-0.5",
        // Professional accent
        accent: "bg-accent text-accent-foreground hover:bg-accent-hover shadow-sm hover:shadow-md hover:-translate-y-0.5",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-8 text-base",
        xl: "h-12 px-10 text-base font-semibold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
