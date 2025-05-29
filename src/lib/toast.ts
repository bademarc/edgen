import { toast } from 'sonner'

// LayerEdge-themed toast notifications
export const layeredgeToast = {
  // Success notifications for achievements and points
  success: (message: string, description?: string) => {
    return toast.success(message, {
      description,
      duration: 4000,
      action: {
        label: 'View',
        onClick: () => window.location.href = '/dashboard'
      }
    })
  },

  // Error notifications
  error: (message: string, description?: string) => {
    return toast.error(message, {
      description,
      duration: 5000,
      action: {
        label: 'Retry',
        onClick: () => window.location.reload()
      }
    })
  },

  // Info notifications for general updates
  info: (message: string, description?: string) => {
    return toast.info(message, {
      description,
      duration: 3000,
    })
  },

  // Warning notifications
  warning: (message: string, description?: string) => {
    return toast.warning(message, {
      description,
      duration: 4000,
    })
  },

  // Points earned notification
  pointsEarned: (points: number, reason: string) => {
    return toast.success(`+${points} Points Earned!`, {
      description: reason,
      duration: 5000,
      action: {
        label: 'View Dashboard',
        onClick: () => window.location.href = '/dashboard'
      }
    })
  },

  // Achievement unlocked notification
  achievementUnlocked: (achievementName: string, points: number) => {
    return toast.success(`🏆 Achievement Unlocked!`, {
      description: `${achievementName} - ${points} points earned`,
      duration: 6000,
      action: {
        label: 'Share',
        onClick: () => {
          const text = `🎉 Just unlocked the "${achievementName}" achievement on LayerEdge! +${points} points earned! 🚀\n\n#LayerEdge #Bitcoin #Achievement`
          if (navigator.share) {
            navigator.share({ title: 'Achievement Unlocked!', text })
          } else {
            navigator.clipboard.writeText(text)
            toast.info('Achievement details copied to clipboard!')
          }
        }
      }
    })
  },

  // Tweet tracked notification
  tweetTracked: (engagement: { likes: number; retweets: number; replies: number }, points: number) => {
    return toast.success('Tweet Tracked Successfully!', {
      description: `${engagement.likes} likes, ${engagement.retweets} retweets, ${engagement.replies} replies - ${points} points earned`,
      duration: 4000,
      action: {
        label: 'View Activity',
        onClick: () => window.location.href = '/dashboard'
      }
    })
  },

  // Welcome notification for new users
  welcome: (username: string) => {
    return toast.success(`Welcome to LayerEdge, ${username}!`, {
      description: 'Start tweeting about @layeredge or $EDGEN to earn points automatically',
      duration: 6000,
      action: {
        label: 'Get Started',
        onClick: () => window.location.href = '/dashboard'
      }
    })
  },

  // Rank up notification
  rankUp: (newRank: number, oldRank: number) => {
    return toast.success(`🚀 Rank Up!`, {
      description: `You've moved from #${oldRank} to #${newRank} on the leaderboard!`,
      duration: 5000,
      action: {
        label: 'View Leaderboard',
        onClick: () => window.location.href = '/leaderboard'
      }
    })
  },

  // Loading notification
  loading: (message: string) => {
    return toast.loading(message, {
      duration: Infinity, // Will be dismissed manually
    })
  },

  // Custom notification with LayerEdge branding
  custom: (message: string, options?: {
    description?: string
    duration?: number
    action?: {
      label: string
      onClick: () => void
    }
    type?: 'success' | 'error' | 'info' | 'warning'
  }) => {
    const { description, duration = 4000, action, type = 'info' } = options || {}
    
    switch (type) {
      case 'success':
        return toast.success(message, { description, duration, action })
      case 'error':
        return toast.error(message, { description, duration, action })
      case 'warning':
        return toast.warning(message, { description, duration, action })
      default:
        return toast.info(message, { description, duration, action })
    }
  },

  // Dismiss all toasts
  dismiss: () => {
    toast.dismiss()
  },

  // Dismiss specific toast
  dismissToast: (toastId: string | number) => {
    toast.dismiss(toastId)
  }
}

// Export individual functions for convenience
export const {
  success,
  error,
  info,
  warning,
  pointsEarned,
  achievementUnlocked,
  tweetTracked,
  welcome,
  rankUp,
  loading,
  custom,
  dismiss,
  dismissToast
} = layeredgeToast

// Default export
export default layeredgeToast
