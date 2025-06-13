/**
 * Official Scweet v3.0+ Integration Monitoring Service
 * Tracks performance, success rates, and health metrics for Official Altimis/Scweet
 */

interface ScweetMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  lastRequestTime: Date | null
  errorTypes: Record<string, number>
  sourceDistribution: Record<string, number>
}

interface PerformanceLog {
  timestamp: Date
  operation: 'tweet_data' | 'engagement' | 'user_info'
  success: boolean
  responseTime: number
  source: 'api' | 'scweet' | 'twikit' | 'scraper'  // Added 'twikit' for enhanced fallback
  error?: string
}

export class ScweetMonitor {
  private metrics: ScweetMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    lastRequestTime: null,
    errorTypes: {},
    sourceDistribution: {}
  }

  private performanceLogs: PerformanceLog[] = []
  private readonly maxLogs = 1000 // Keep last 1000 operations

  logRequest(
    operation: 'tweet_data' | 'engagement' | 'user_info',
    success: boolean,
    responseTime: number,
    source: 'api' | 'scweet' | 'twikit' | 'scraper',
    error?: string
  ): void {
    const timestamp = new Date()

    // Update metrics
    this.metrics.totalRequests++
    this.metrics.lastRequestTime = timestamp

    if (success) {
      this.metrics.successfulRequests++
    } else {
      this.metrics.failedRequests++
      if (error) {
        this.metrics.errorTypes[error] = (this.metrics.errorTypes[error] || 0) + 1
      }
    }

    // Update source distribution
    this.metrics.sourceDistribution[source] = (this.metrics.sourceDistribution[source] || 0) + 1

    // Update average response time
    const totalTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime
    this.metrics.averageResponseTime = totalTime / this.metrics.totalRequests

    // Add to performance logs
    const log: PerformanceLog = {
      timestamp,
      operation,
      success,
      responseTime,
      source,
      error
    }

    this.performanceLogs.push(log)

    // Trim logs if necessary
    if (this.performanceLogs.length > this.maxLogs) {
      this.performanceLogs = this.performanceLogs.slice(-this.maxLogs)
    }

    // Log significant events
    if (!success) {
      console.warn(`Scweet operation failed: ${operation} via ${source} - ${error}`)
    }

    // Alert on high failure rate
    const recentFailureRate = this.getRecentFailureRate()
    if (recentFailureRate > 0.5 && this.metrics.totalRequests > 10) {
      console.error(`🚨 High failure rate detected: ${(recentFailureRate * 100).toFixed(1)}%`)
    }
  }

  getMetrics(): ScweetMetrics {
    return { ...this.metrics }
  }

  getSuccessRate(): number {
    if (this.metrics.totalRequests === 0) return 0
    return this.metrics.successfulRequests / this.metrics.totalRequests
  }

  getRecentFailureRate(minutes: number = 5): number {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000)
    const recentLogs = this.performanceLogs.filter(log => log.timestamp > cutoff)
    
    if (recentLogs.length === 0) return 0
    
    const failures = recentLogs.filter(log => !log.success).length
    return failures / recentLogs.length
  }

  getSourcePerformance(): Record<string, { 
    count: number
    successRate: number
    avgResponseTime: number 
  }> {
    const sources: Record<string, PerformanceLog[]> = {}
    
    this.performanceLogs.forEach(log => {
      if (!sources[log.source]) sources[log.source] = []
      sources[log.source].push(log)
    })

    const performance: Record<string, { count: number; successRate: number; avgResponseTime: number }> = {}

    Object.entries(sources).forEach(([source, logs]) => {
      const successCount = logs.filter(log => log.success).length
      const avgTime = logs.reduce((sum, log) => sum + log.responseTime, 0) / logs.length

      performance[source] = {
        count: logs.length,
        successRate: successCount / logs.length,
        avgResponseTime: Math.round(avgTime)
      }
    })

    return performance
  }

  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy'
    issues: string[]
    recommendations: string[]
  } {
    const issues: string[] = []
    const recommendations: string[] = []
    
    const successRate = this.getSuccessRate()
    const recentFailureRate = this.getRecentFailureRate()
    const avgResponseTime = this.metrics.averageResponseTime

    // Check success rate
    if (successRate < 0.8) {
      issues.push(`Low overall success rate: ${(successRate * 100).toFixed(1)}%`)
      recommendations.push('Check Scweet service health and network connectivity')
    }

    // Check recent failure rate
    if (recentFailureRate > 0.3) {
      issues.push(`High recent failure rate: ${(recentFailureRate * 100).toFixed(1)}%`)
      recommendations.push('Consider scaling Scweet service or checking for rate limits')
    }

    // Check response time
    if (avgResponseTime > 10000) { // 10 seconds
      issues.push(`High average response time: ${avgResponseTime}ms`)
      recommendations.push('Consider optimizing Scweet configuration or scaling resources')
    }

    // Check error patterns
    const topErrors = Object.entries(this.metrics.errorTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)

    if (topErrors.length > 0) {
      issues.push(`Top errors: ${topErrors.map(([error, count]) => `${error} (${count})`).join(', ')}`)
    }

    let status: 'healthy' | 'degraded' | 'unhealthy'
    if (issues.length === 0) {
      status = 'healthy'
    } else if (successRate > 0.5) {
      status = 'degraded'
    } else {
      status = 'unhealthy'
    }

    return { status, issues, recommendations }
  }

  generateReport(): string {
    const metrics = this.getMetrics()
    const health = this.getHealthStatus()
    const sourcePerf = this.getSourcePerformance()

    let report = '📊 Scweet Integration Performance Report\n'
    report += '=' .repeat(50) + '\n\n'

    // Overall metrics
    report += '📈 Overall Metrics:\n'
    report += `   Total Requests: ${metrics.totalRequests}\n`
    report += `   Success Rate: ${(this.getSuccessRate() * 100).toFixed(1)}%\n`
    report += `   Average Response Time: ${metrics.averageResponseTime.toFixed(0)}ms\n`
    report += `   Last Request: ${metrics.lastRequestTime?.toISOString() || 'Never'}\n\n`

    // Source performance
    report += '🔄 Source Performance:\n'
    Object.entries(sourcePerf).forEach(([source, perf]) => {
      report += `   ${source.toUpperCase()}:\n`
      report += `     Requests: ${perf.count}\n`
      report += `     Success Rate: ${(perf.successRate * 100).toFixed(1)}%\n`
      report += `     Avg Response Time: ${perf.avgResponseTime}ms\n`
    })
    report += '\n'

    // Health status
    report += `🏥 Health Status: ${health.status.toUpperCase()}\n`
    if (health.issues.length > 0) {
      report += '   Issues:\n'
      health.issues.forEach(issue => report += `     - ${issue}\n`)
    }
    if (health.recommendations.length > 0) {
      report += '   Recommendations:\n'
      health.recommendations.forEach(rec => report += `     - ${rec}\n`)
    }

    return report
  }

  reset(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastRequestTime: null,
      errorTypes: {},
      sourceDistribution: {}
    }
    this.performanceLogs = []
  }
}

// Singleton instance
let monitorInstance: ScweetMonitor | null = null

export function getScweetMonitor(): ScweetMonitor {
  if (!monitorInstance) {
    monitorInstance = new ScweetMonitor()
  }
  return monitorInstance
}

// Utility function to wrap fallback service calls with monitoring
export function withMonitoring<T>(
  operation: 'tweet_data' | 'engagement' | 'user_info',
  source: 'api' | 'scweet' | 'twikit' | 'scraper',
  fn: () => Promise<T>
): Promise<T> {
  const monitor = getScweetMonitor()
  const startTime = Date.now()

  return fn()
    .then(result => {
      const responseTime = Date.now() - startTime
      monitor.logRequest(operation, true, responseTime, source)
      return result
    })
    .catch(error => {
      const responseTime = Date.now() - startTime
      monitor.logRequest(operation, false, responseTime, source, error.message)
      throw error
    })
}
