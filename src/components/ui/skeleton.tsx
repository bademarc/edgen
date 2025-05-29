import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted skeleton-layeredge",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
