import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-border shadow-sm hover:border-border-hover hover:shadow-md hover:-translate-y-0.5",
        professional: "border-border shadow-sm hover:border-border-hover hover:shadow-md hover:-translate-y-0.5",
        elevated: "bg-card-elevated border-border shadow-lg hover:border-border-hover hover:shadow-xl hover:-translate-y-1",
        accent: "border-border shadow-sm hover:border-primary hover:shadow-[0_0_10px_rgba(247,147,26,0.1),0_4px_6px_-1px_rgba(0,0,0,0.7)] hover:-translate-y-0.5",
        subtle: "border-border-subtle shadow-sm hover:border-border hover:shadow-md",
        layeredge: "border-border shadow-sm hover:border-primary hover:shadow-[0_0_15px_rgba(247,147,26,0.2),0_4px_6px_-1px_rgba(0,0,0,0.7)] hover:-translate-y-1 transition-all duration-300",
        glass: "bg-background/80 backdrop-blur-sm border-border/50 shadow-sm hover:border-border hover:shadow-md hover:-translate-y-0.5",
        interactive: "border-border shadow-sm hover:border-primary hover:shadow-[0_0_20px_rgba(247,147,26,0.3),0_8px_16px_-4px_rgba(0,0,0,0.8)] hover:-translate-y-2 cursor-pointer transition-all duration-300 active:-translate-y-1",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, className }))}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
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
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
