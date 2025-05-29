import type React from "react"

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  className?: string
}

export function FeatureCard({ icon, title, description, className }: FeatureCardProps) {
  return (
    <div className={`group relative overflow-hidden rounded-lg border bg-card p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 ${className || ''}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      <div className="relative space-y-3">
        <div className="text-primary">{icon}</div>
        <h3 className="font-semibold text-lg text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
