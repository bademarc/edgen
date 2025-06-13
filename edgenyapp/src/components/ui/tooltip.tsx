/**
 * Tooltip Component for LayerEdge Platform
 * Fixes hover text visibility issues with proper z-index and positioning
 */

"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      // FIXED: High z-index to ensure tooltips appear above all other elements
      "z-[9999] overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      // Additional positioning fixes
      "max-w-xs break-words shadow-lg border border-border/20",
      // Ensure tooltip doesn't get clipped
      "will-change-transform",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

// Enhanced tooltip with better positioning and visibility
// CRITICAL FIX: Removed individual TooltipProvider to prevent multiple instances and React Error #185
const EnhancedTooltip = React.forwardRef<
  HTMLDivElement,
  {
    children: React.ReactNode
    content: React.ReactNode
    side?: "top" | "right" | "bottom" | "left"
    align?: "start" | "center" | "end"
    delayDuration?: number
    className?: string
  }
>(({ children, content, side = "top", align = "center", delayDuration = 200, className }, ref) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <div ref={ref} className={cn("cursor-help", className)}>
        {children}
      </div>
    </TooltipTrigger>
    <TooltipContent side={side} align={align}>
      {content}
    </TooltipContent>
  </Tooltip>
))
EnhancedTooltip.displayName = "EnhancedTooltip"

// Date tooltip specifically for tweet dates
const DateTooltip = React.forwardRef<
  HTMLSpanElement,
  {
    originalDate: Date
    submittedDate?: Date
    children: React.ReactNode
    className?: string
  }
>(({ originalDate, submittedDate, children, className }, ref) => {
  const tooltipContent = (
    <div className="space-y-1">
      <div className="font-medium">Tweet Details</div>
      <div className="text-xs">
        <div>Original: {originalDate.toLocaleString()}</div>
        {submittedDate && (
          <div>Submitted: {submittedDate.toLocaleString()}</div>
        )}
      </div>
    </div>
  )

  return (
    <EnhancedTooltip content={tooltipContent} side="top" align="start">
      <span ref={ref} className={cn("inline-flex items-center", className)}>
        {children}
      </span>
    </EnhancedTooltip>
  )
})
DateTooltip.displayName = "DateTooltip"

// Button tooltip for interactive elements
// CRITICAL FIX: Removed individual TooltipProvider to prevent multiple instances and React Error #185
const ButtonTooltip = React.forwardRef<
  HTMLButtonElement,
  {
    children: React.ReactNode
    tooltip: string
    side?: "top" | "right" | "bottom" | "left"
    className?: string
  } & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, tooltip, side = "top", className, ...props }, ref) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        ref={ref}
        className={cn(
          // FIXED: Ensure button tooltips have proper focus and hover states
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "transition-colors duration-200",
          className
        )}
        {...props}
      >
        {children}
      </button>
    </TooltipTrigger>
    <TooltipContent side={side}>
      {tooltip}
    </TooltipContent>
  </Tooltip>
))
ButtonTooltip.displayName = "ButtonTooltip"

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  EnhancedTooltip,
  DateTooltip,
  ButtonTooltip,
}
