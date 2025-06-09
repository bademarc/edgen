import { Metadata } from 'next'
import ManualTweetSubmission from '@/components/ManualTweetSubmission'

export const metadata: Metadata = {
  title: 'Submit Tweet - LayerEdge Community',
  description: 'Submit your tweets containing @layeredge or $EDGEN mentions to earn points in the LayerEdge community platform.',
}

export default function SubmitTweetPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Submit Tweet</h1>
              <p className="text-gray-400 mt-2">
                Manually submit your tweets to earn points in the LayerEdge community
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Powered by</div>
              <div className="text-orange-500 font-bold">LayerEdge</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <ManualTweetSubmission />
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 bg-gray-900/50 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-400 text-sm">
            <p>
              LayerEdge Community Platform - Earn points by engaging with the community
            </p>
            <p className="mt-2">
              Make sure your tweets contain <span className="text-orange-500">@layeredge</span> or{' '}
              <span className="text-orange-500">$EDGEN</span> mentions to qualify for points
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
