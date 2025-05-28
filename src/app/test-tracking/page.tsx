'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import TrackingDashboard from '@/components/TrackingDashboard'
import UnclaimedTweets from '@/components/UnclaimedTweets'

export default function TestTrackingPage() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-2 text-foreground">Enhanced Tweet Tracking Test Page</h1>
          <p className="text-muted-foreground">
            Test the enhanced tweet tracking system components and functionality
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-background-secondary p-1 rounded-lg border border-border">
            {[
              { id: 'dashboard', label: 'Tracking Dashboard' },
              { id: 'unclaimed', label: 'Unclaimed Tweets' },
              { id: 'manual', label: 'Manual Tests' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-layeredge-orange text-black'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'dashboard' && <TrackingDashboard />}
          {activeTab === 'unclaimed' && <UnclaimedTweets />}
          {activeTab === 'manual' && <ManualTestPanel />}
        </div>
      </div>
    </div>
  )
}

function ManualTestPanel() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runManualTest = async (testType: string) => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      let response: Response

      switch (testType) {
        case 'status':
          response = await fetch('/api/tracking/status')
          break
        case 'discover':
          response = await fetch('/api/tracking/discover', {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer layeredge-admin-secret-2024',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ method: 'twscrape' })
          })
          break
        case 'stats':
          response = await fetch('/api/tracking/discover?hours=24')
          break
        default:
          throw new Error('Unknown test type')
      }

      const data = await response.json()
      setResults(data)

      if (!response.ok) {
        setError(data.error || 'Request failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <motion.div
        className="card-layeredge hover-glow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-foreground mb-2">Manual API Tests</h2>
          <p className="text-muted-foreground mb-6">
            Test the tracking system API endpoints manually
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => runManualTest('status')}
                disabled={loading}
                className="btn-layeredge-ghost px-4 py-2 rounded-lg"
              >
                Test Status API
              </button>
              <button
                onClick={() => runManualTest('discover')}
                disabled={loading}
                className="btn-layeredge-ghost px-4 py-2 rounded-lg"
              >
                Test Manual Discovery
              </button>
              <button
                onClick={() => runManualTest('stats')}
                disabled={loading}
                className="btn-layeredge-ghost px-4 py-2 rounded-lg"
              >
                Test Statistics API
              </button>
            </div>

            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-layeredge-orange mx-auto"></div>
                <p className="mt-2 text-foreground">Running test...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <h4 className="font-medium text-red-400 mb-2">Error</h4>
                <p className="text-red-300">{error}</p>
              </div>
            )}

            {results && (
              <div className="bg-background-secondary border border-border rounded-lg p-4">
                <h4 className="font-medium text-green-400 mb-2">Results</h4>
                <pre className="text-sm text-foreground overflow-auto max-h-96">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div
        className="card-layeredge hover-glow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-foreground mb-2">Component Tests</h2>
          <p className="text-muted-foreground mb-6">
            Test individual components and their functionality
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-background-secondary border border-border rounded-lg">
                <h4 className="font-medium mb-2 text-foreground">UnclaimedTweets Component</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Tests user interface for claiming retroactive tweets
                </p>
                <p className="text-xs text-green-400">
                  ✅ Component loaded in &quot;Unclaimed Tweets&quot; tab
                </p>
              </div>
              <div className="p-4 bg-background-secondary border border-border rounded-lg">
                <h4 className="font-medium mb-2 text-foreground">TrackingDashboard Component</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Tests admin monitoring and control interface
                </p>
                <p className="text-xs text-green-400">
                  ✅ Component loaded in &quot;Tracking Dashboard&quot; tab
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
