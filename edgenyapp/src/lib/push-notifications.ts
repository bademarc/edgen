'use client'

// Push Notification Service for LayerEdge Community Platform
// Handles browser push notifications for user engagement

interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  data?: any
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
  vibrate?: number[]
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null
  private subscription: PushSubscription | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.init()
    }
  }

  private async init() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        this.registration = await navigator.serviceWorker.ready
        console.log('Push notifications service initialized')
      } catch (error) {
        console.error('Failed to initialize push notifications:', error)
      }
    }
  }

  // Check if push notifications are supported
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    )
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) return 'denied'
    return Notification.permission
  }

  // Request permission for notifications
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported')
    }

    const permission = await Notification.requestPermission()
    console.log('Notification permission:', permission)
    return permission
  }

  // Subscribe to push notifications
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.init()
    }

    if (!this.registration) {
      throw new Error('Service worker not registered')
    }

    const permission = await this.requestPermission()
    if (permission !== 'granted') {
      throw new Error('Notification permission denied')
    }

    try {
      // You would need to generate VAPID keys for production
      // For now, we'll use a placeholder
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'placeholder-vapid-key'
      
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      })

      console.log('Push subscription created:', this.subscription)
      
      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription)
      
      return this.subscription
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      throw error
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      const existingSubscription = await this.getExistingSubscription()
      if (!existingSubscription) return true
      this.subscription = existingSubscription
    }

    try {
      const result = await this.subscription.unsubscribe()
      if (result) {
        // Remove subscription from server
        await this.removeSubscriptionFromServer(this.subscription)
        this.subscription = null
      }
      return result
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      return false
    }
  }

  // Get existing subscription
  async getExistingSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.init()
    }

    if (!this.registration) return null

    try {
      return await this.registration.pushManager.getSubscription()
    } catch (error) {
      console.error('Failed to get existing subscription:', error)
      return null
    }
  }

  // Show local notification (fallback for when push isn't available)
  async showLocalNotification(payload: NotificationPayload): Promise<void> {
    if (!this.isSupported()) {
      console.warn('Notifications not supported')
      return
    }

    const permission = this.getPermissionStatus()
    if (permission !== 'granted') {
      console.warn('Notification permission not granted')
      return
    }

    if (!this.registration) {
      await this.init()
    }

    if (this.registration) {
      await this.registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon/-AlLx9IW_400x400.png',
        badge: payload.badge || '/icon/-AlLx9IW_400x400.png',
        image: payload.image,
        data: payload.data,
        actions: payload.actions,
        tag: payload.tag,
        requireInteraction: payload.requireInteraction,
        silent: payload.silent,
        vibrate: payload.vibrate || [200, 100, 200]
      })
    }
  }

  // Send subscription to server
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send subscription to server')
      }

      console.log('Subscription sent to server successfully')
    } catch (error) {
      console.error('Error sending subscription to server:', error)
      throw error
    }
  }

  // Remove subscription from server
  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to remove subscription from server')
      }

      console.log('Subscription removed from server successfully')
    } catch (error) {
      console.error('Error removing subscription from server:', error)
      throw error
    }
  }

  // Convert VAPID key to Uint8Array
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // Predefined notification types for LayerEdge
  async notifyPointsEarned(points: number, reason: string): Promise<void> {
    await this.showLocalNotification({
      title: `+${points} Points Earned!`,
      body: reason,
      icon: '/icon/-AlLx9IW_400x400.png',
      tag: 'points-earned',
      data: { type: 'points', points, reason },
      actions: [
        { action: 'view-dashboard', title: 'View Dashboard' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      vibrate: [200, 100, 200, 100, 200]
    })
  }

  async notifyRankUp(newRank: number, oldRank: number): Promise<void> {
    await this.showLocalNotification({
      title: 'Rank Up! 🎉',
      body: `You've moved up from #${oldRank} to #${newRank} on the leaderboard!`,
      icon: '/icon/-AlLx9IW_400x400.png',
      tag: 'rank-up',
      data: { type: 'rank', newRank, oldRank },
      actions: [
        { action: 'view-leaderboard', title: 'View Leaderboard' },
        { action: 'share', title: 'Share Achievement' }
      ],
      requireInteraction: true,
      vibrate: [300, 100, 300, 100, 300]
    })
  }

  async notifyTweetTracked(engagement: { likes: number; retweets: number; replies: number }): Promise<void> {
    await this.showLocalNotification({
      title: 'Tweet Tracked Successfully!',
      body: `${engagement.likes} likes, ${engagement.retweets} retweets, ${engagement.replies} replies`,
      icon: '/icon/-AlLx9IW_400x400.png',
      tag: 'tweet-tracked',
      data: { type: 'tweet', engagement },
      actions: [
        { action: 'view-activity', title: 'View Activity' }
      ]
    })
  }

  async notifyNewFeature(title: string, description: string): Promise<void> {
    await this.showLocalNotification({
      title: `New Feature: ${title}`,
      body: description,
      icon: '/icon/-AlLx9IW_400x400.png',
      tag: 'new-feature',
      data: { type: 'feature', title, description },
      actions: [
        { action: 'explore', title: 'Explore' },
        { action: 'dismiss', title: 'Later' }
      ]
    })
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService()

// Export types
export type { NotificationPayload }
