import { Metadata } from 'next'
import { ContentModerationDashboard } from '@/components/ContentModerationDashboard'

export const metadata: Metadata = {
  title: 'Content Moderation Dashboard - LayerEdge Admin',
  description: 'Monitor and manage content moderation for the LayerEdge community platform',
}

export default function ModerationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ContentModerationDashboard />
    </div>
  )
}
