import { getCacheService } from './cache'

interface QueueJob {
  id: string
  type: 'tweet_monitoring' | 'engagement_update' | 'user_sync'
  data: any
  priority: number
  attempts: number
  maxAttempts: number
  createdAt: Date
  scheduledAt?: Date
}

interface QueueConfig {
  maxConcurrent: number
  retryDelay: number
  maxRetries: number
}

class QueueService {
  private cache = getCacheService()
  private processing = new Map<string, boolean>()
  private config: QueueConfig

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = {
      maxConcurrent: 10,
      retryDelay: 5000,
      maxRetries: 3,
      ...config
    }
  }

  // Add job to queue
  async addJob(job: Omit<QueueJob, 'id' | 'attempts' | 'createdAt'>): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const fullJob: QueueJob = {
      id: jobId,
      attempts: 0,
      createdAt: new Date(),
      ...job
    }

    const queueKey = `queue:${job.type}`
    const jobKey = `job:${jobId}`

    // Store job data
    await this.cache.set(jobKey, fullJob, 3600) // 1 hour TTL

    // Add to priority queue (using sorted set with priority as score)
    const score = job.priority || 0
    await this.cache.set(`${queueKey}:${jobId}`, score, 3600)

    console.log(`📋 Added job ${jobId} to queue ${job.type} with priority ${score}`)
    return jobId
  }

  // Process jobs from queue
  async processQueue(queueType: string, processor: (job: QueueJob) => Promise<boolean>): Promise<void> {
    const queueKey = `queue:${queueType}`
    
    // Check if already processing this queue type
    if (this.processing.get(queueType)) {
      return
    }

    this.processing.set(queueType, true)

    try {
      // Get jobs sorted by priority (highest first)
      const jobIds = await this.getQueuedJobs(queueType)
      
      // Process up to maxConcurrent jobs
      const jobsToProcess = jobIds.slice(0, this.config.maxConcurrent)
      
      const promises = jobsToProcess.map(async (jobId) => {
        try {
          const job = await this.getJob(jobId)
          if (!job) return

          // Check if job is scheduled for future
          if (job.scheduledAt && job.scheduledAt > new Date()) {
            return
          }

          console.log(`🔄 Processing job ${jobId} (attempt ${job.attempts + 1})`)
          
          const success = await processor(job)
          
          if (success) {
            await this.completeJob(jobId, queueType)
            console.log(`✅ Job ${jobId} completed successfully`)
          } else {
            await this.retryJob(job, queueType)
          }
        } catch (error) {
          console.error(`❌ Error processing job ${jobId}:`, error)
          const job = await this.getJob(jobId)
          if (job) {
            await this.retryJob(job, queueType)
          }
        }
      })

      await Promise.allSettled(promises)
    } finally {
      this.processing.set(queueType, false)
    }
  }

  // Get job by ID
  private async getJob(jobId: string): Promise<QueueJob | null> {
    return await this.cache.get<QueueJob>(`job:${jobId}`)
  }

  // Get queued job IDs sorted by priority
  private async getQueuedJobs(queueType: string): Promise<string[]> {
    // This is a simplified implementation
    // In production, you'd use Redis ZRANGE for proper sorted set operations
    const queueKey = `queue:${queueType}`
    
    // For now, return a simple list (would need Redis sorted sets for proper implementation)
    const jobs = await this.cache.get<string[]>(`${queueKey}:list`) || []
    return jobs
  }

  // Complete and remove job
  private async completeJob(jobId: string, queueType: string): Promise<void> {
    await this.cache.del(`job:${jobId}`)
    
    // Remove from queue list
    const queueKey = `queue:${queueType}`
    const jobs = await this.cache.get<string[]>(`${queueKey}:list`) || []
    const updatedJobs = jobs.filter(id => id !== jobId)
    await this.cache.set(`${queueKey}:list`, updatedJobs, 3600)
  }

  // Retry failed job
  private async retryJob(job: QueueJob, queueType: string): Promise<void> {
    job.attempts++
    
    if (job.attempts >= this.config.maxRetries) {
      console.error(`💀 Job ${job.id} failed after ${job.attempts} attempts, moving to dead letter queue`)
      await this.moveToDeadLetter(job)
      await this.completeJob(job.id, queueType)
      return
    }

    // Schedule retry with exponential backoff
    const delay = this.config.retryDelay * Math.pow(2, job.attempts - 1)
    job.scheduledAt = new Date(Date.now() + delay)
    
    await this.cache.set(`job:${job.id}`, job, 3600)
    console.log(`🔄 Job ${job.id} scheduled for retry in ${delay}ms (attempt ${job.attempts})`)
  }

  // Move failed job to dead letter queue
  private async moveToDeadLetter(job: QueueJob): Promise<void> {
    const deadLetterKey = `dead_letter:${job.type}`
    await this.cache.set(`${deadLetterKey}:${job.id}`, job, 86400) // 24 hour TTL
  }

  // Get queue statistics
  async getQueueStats(queueType: string): Promise<{
    pending: number
    processing: number
    failed: number
  }> {
    const queueKey = `queue:${queueType}`
    const deadLetterKey = `dead_letter:${queueType}`
    
    const pending = (await this.cache.get<string[]>(`${queueKey}:list`) || []).length
    const processing = this.processing.get(queueType) ? 1 : 0
    
    // Count dead letter jobs (simplified)
    const failed = 0 // Would need proper Redis operations to count
    
    return { pending, processing, failed }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    return await this.cache.healthCheck()
  }
}

// Singleton instance
let queueService: QueueService | null = null

export function getQueueService(): QueueService {
  if (!queueService) {
    queueService = new QueueService()
  }
  return queueService
}

export { QueueService }
export type { QueueJob }
