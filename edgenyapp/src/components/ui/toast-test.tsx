'use client'

import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { layeredgeToast } from '@/lib/toast'
import { SparklesIcon, TrophyIcon, ChatBubbleLeftRightIcon, UserIcon } from '@heroicons/react/24/outline'

export function ToastTest() {
  const testToasts = [
    {
      name: 'Points Earned',
      icon: SparklesIcon,
      action: () => layeredgeToast.pointsEarned(45, 'Tweet about @layeredge got 23 likes!'),
      variant: 'layeredge' as const
    },
    {
      name: 'Achievement Unlocked',
      icon: TrophyIcon,
      action: () => layeredgeToast.achievementUnlocked('Bitcoin Advocate', 100),
      variant: 'bitcoin' as const
    },
    {
      name: 'Tweet Tracked',
      icon: ChatBubbleLeftRightIcon,
      action: () => layeredgeToast.tweetTracked({ likes: 23, retweets: 8, replies: 5 }, 45),
      variant: 'layeredgeSecondary' as const
    },
    {
      name: 'Welcome Message',
      icon: UserIcon,
      action: () => layeredgeToast.welcome('CryptoEnthusiast'),
      variant: 'layeredge' as const
    },
    {
      name: 'Rank Up',
      icon: TrophyIcon,
      action: () => layeredgeToast.rankUp(15, 23),
      variant: 'layeredge' as const
    },
    {
      name: 'Success Toast',
      icon: SparklesIcon,
      action: () => layeredgeToast.success('Operation completed successfully!', 'Your action was processed'),
      variant: 'outline' as const
    },
    {
      name: 'Error Toast',
      icon: SparklesIcon,
      action: () => layeredgeToast.error('Something went wrong', 'Please try again later'),
      variant: 'destructive' as const
    },
    {
      name: 'Info Toast',
      icon: SparklesIcon,
      action: () => layeredgeToast.info('New feature available', 'Check out the enhanced navigation!'),
      variant: 'secondary' as const
    }
  ]

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <SparklesIcon className="h-6 w-6 text-layeredge-orange" />
          <span>Toast Notification Test</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {testToasts.map((test) => (
            <Button
              key={test.name}
              variant={test.variant}
              onClick={test.action}
              className="flex items-center space-x-2 h-auto py-3"
            >
              <test.icon className="h-4 w-4" />
              <span>{test.name}</span>
            </Button>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={() => layeredgeToast.dismiss()}
            className="w-full"
          >
            Dismiss All Toasts
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
