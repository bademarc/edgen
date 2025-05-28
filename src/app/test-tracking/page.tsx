'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import UnclaimedTweets from '@/components/UnclaimedTweets'
import TrackingDashboard from '@/components/TrackingDashboard'

export default function TestTrackingPage() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Enhanced Tweet Tracking Test Page</h1>
          <p className="text-gray-400">
            Test the enhanced tweet tracking system components and functionality
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Tracking Dashboard</TabsTrigger>
            <TabsTrigger value="unclaimed">Unclaimed Tweets</TabsTrigger>
            <TabsTrigger value="manual">Manual Tests</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <TrackingDashboard />
          </TabsContent>

          <TabsContent value="unclaimed" className="space-y-6">
            <UnclaimedTweets />
          </TabsContent>

          <TabsContent value="manual" className="space-y-6">
            <ManualTestPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function ManualTestPanel() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
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
      <Card>
        <CardHeader>
          <CardTitle>Manual API Tests</CardTitle>
          <CardDescription>
            Test the tracking system API endpoints manually
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => runManualTest('status')}
              disabled={loading}
              variant="outline"
            >
              Test Status API
            </Button>
            <Button
              onClick={() => runManualTest('discover')}
              disabled={loading}
              variant="outline"
            >
              Test Manual Discovery
            </Button>
            <Button
              onClick={() => runManualTest('stats')}
              disabled={loading}
              variant="outline"
            >
              Test Statistics API
            </Button>
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              <p className="mt-2">Running test...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
              <h4 className="font-medium text-red-400 mb-2">Error</h4>
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {results && (
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
              <h4 className="font-medium text-green-400 mb-2">Results</h4>
              <pre className="text-sm text-gray-300 overflow-auto max-h-96">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Component Tests</CardTitle>
          <CardDescription>
            Test individual components and their functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800 rounded-lg">
                <h4 className="font-medium mb-2">UnclaimedTweets Component</h4>
                <p className="text-sm text-gray-400 mb-2">
                  Tests user interface for claiming retroactive tweets
                </p>
                <p className="text-xs text-green-400">
                  ✅ Component loaded in "Unclaimed Tweets" tab
                </p>
              </div>
              <div className="p-4 bg-gray-800 rounded-lg">
                <h4 className="font-medium mb-2">TrackingDashboard Component</h4>
                <p className="text-sm text-gray-400 mb-2">
                  Tests admin monitoring and control interface
                </p>
                <p className="text-xs text-green-400">
                  ✅ Component loaded in "Tracking Dashboard" tab
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
