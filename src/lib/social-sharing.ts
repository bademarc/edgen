export interface ShareData {
  title: string
  text: string
  url?: string
  hashtags?: string[]
}

export interface TweetShareData {
  content: string
  points: number
  engagement: {
    likes: number
    retweets: number
    replies: number
  }
  tweetUrl: string
}

export interface AchievementShareData {
  name: string
  description: string
  icon: string
  points: number
  rarity: string
}

export class SocialSharingService {
  private static readonly PLATFORM_URLS = {
    twitter: 'https://twitter.com/intent/tweet',
    facebook: 'https://www.facebook.com/sharer/sharer.php',
    linkedin: 'https://www.linkedin.com/sharing/share-offsite/',
    reddit: 'https://reddit.com/submit',
    telegram: 'https://t.me/share/url',
    whatsapp: 'https://wa.me/',
  }

  static async shareNative(data: ShareData): Promise<boolean> {
    if (navigator.share && navigator.canShare?.(data)) {
      try {
        await navigator.share(data)
        return true
      } catch (error) {
        console.error('Native sharing failed:', error)
        return false
      }
    }
    return false
  }

  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (error) {
      console.error('Clipboard copy failed:', error)
      return false
    }
  }

  static generateTweetShareText(data: TweetShareData): string {
    const { content, points, engagement, tweetUrl } = data
    const totalEngagement = engagement.likes + engagement.retweets + engagement.replies
    
    return `🎉 Just earned ${points} points on LayerEdge for my tweet!

"${content.length > 100 ? content.substring(0, 100) + '...' : content}"

📊 Engagement: ${totalEngagement} interactions
🏆 Points: ${points}

Join the LayerEdge community and start earning! 🚀

#LayerEdge #Bitcoin #Community #Web3

${tweetUrl}`
  }

  static generateAchievementShareText(data: AchievementShareData): string {
    const { name, description, icon, points, rarity } = data
    
    return `🏆 Achievement Unlocked! ${icon}

"${name}" - ${rarity.toUpperCase()}

${description}

+${points} points earned! 🚀

Join me on LayerEdge and start your Bitcoin journey!

#LayerEdge #Bitcoin #Achievement #Web3`
  }

  static generateSubmissionShareText(totalSubmissions: number, totalPoints: number): string {
    return `📈 LayerEdge Community Update!

✅ ${totalSubmissions} tweets submitted
🏆 ${totalPoints} total points earned
🚀 Building the future of Bitcoin together

Join the LayerEdge community and start earning points for your engagement!

#LayerEdge #Bitcoin #Community #Web3`
  }

  static getShareUrl(platform: keyof typeof SocialSharingService.PLATFORM_URLS, params: Record<string, string>): string {
    const baseUrl = this.PLATFORM_URLS[platform]
    const searchParams = new URLSearchParams(params)
    return `${baseUrl}?${searchParams.toString()}`
  }

  static shareToTwitter(text: string, url?: string): void {
    const params: Record<string, string> = { text }
    if (url) params.url = url
    
    const shareUrl = this.getShareUrl('twitter', params)
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  static shareToFacebook(url: string): void {
    const shareUrl = this.getShareUrl('facebook', { u: url })
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  static shareToLinkedIn(url: string, title?: string): void {
    const params: Record<string, string> = { url }
    if (title) params.title = title
    
    const shareUrl = this.getShareUrl('linkedin', params)
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  static shareToReddit(url: string, title?: string): void {
    const params: Record<string, string> = { url }
    if (title) params.title = title
    
    const shareUrl = this.getShareUrl('reddit', params)
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  static shareToTelegram(text: string, url?: string): void {
    const fullText = url ? `${text} ${url}` : text
    const shareUrl = this.getShareUrl('telegram', { text: fullText })
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  static shareToWhatsApp(text: string): void {
    const encodedText = encodeURIComponent(text)
    const shareUrl = `${this.PLATFORM_URLS.whatsapp}?text=${encodedText}`
    window.open(shareUrl, '_blank')
  }

  static async shareWithFallback(data: ShareData, fallbackText: string): Promise<void> {
    // Try native sharing first
    const nativeSuccess = await this.shareNative(data)
    
    if (!nativeSuccess) {
      // Fallback to clipboard
      const clipboardSuccess = await this.copyToClipboard(fallbackText)
      
      if (clipboardSuccess) {
        // You could show a toast notification here
        console.log('Content copied to clipboard')
      } else {
        // Final fallback - open Twitter share
        this.shareToTwitter(fallbackText, data.url)
      }
    }
  }
}
