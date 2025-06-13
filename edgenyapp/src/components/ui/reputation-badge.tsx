import { cn } from "@/lib/utils"

interface ReputationBadgeProps {
  score: number
  className?: string
}

export function ReputationBadge({ score, className }: ReputationBadgeProps) {
  const getTier = (score: number) => {
    if (score >= 9000) return { name: "Diamond", color: "from-primary to-primary-light", textColor: "text-primary" }
    if (score >= 7000) return { name: "Platinum", color: "from-gray-300 to-gray-500", textColor: "text-gray-300" }
    if (score >= 5000) return { name: "Gold", color: "from-yellow-400 to-yellow-600", textColor: "text-yellow-400" }
    if (score >= 3000) return { name: "Silver", color: "from-gray-400 to-gray-600", textColor: "text-gray-400" }
    return { name: "Bronze", color: "from-amber-600 to-amber-800", textColor: "text-amber-600" }
  }

  const tier = getTier(score)

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className={cn(
          "w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg shadow-lg border-2 border-border",
          tier.color,
        )}
      >
        {tier.name.charAt(0)}
      </div>
      <span className={cn("text-xs font-medium mt-1", tier.textColor)}>{tier.name}</span>
    </div>
  )
}
