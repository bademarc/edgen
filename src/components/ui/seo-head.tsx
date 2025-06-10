import Head from 'next/head'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'profile'
  publishedTime?: string
  modifiedTime?: string
  author?: string
  section?: string
  tags?: string[]
  noindex?: boolean
  nofollow?: boolean
}

export function SEOHead({
  title = "LayerEdge Community Platform - Earn Points for X/Twitter Engagement",
  description = "Join the LayerEdge $EDGEN community platform. Engage with LayerEdge content on X/Twitter and earn points for your participation. Connect, compete, and climb the leaderboard.",
  keywords = ["LayerEdge", "EDGEN", "community", "Twitter", "X", "engagement", "points", "leaderboard", "cryptocurrency", "blockchain"],
  image = "/icon/-AlLx9IW_400x400.png",
  url = "https://edgen.koyeb.app",
  type = "website",
  publishedTime,
  modifiedTime,
  author = "LayerEdge Team",
  section,
  tags,
  noindex = false,
  nofollow = false
}: SEOProps) {
  const fullImageUrl = image.startsWith('http') ? image : `${url}${image}`
  
  // Generate structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "LayerEdge Community Platform",
    "description": description,
    "url": url,
    "applicationCategory": "SocialNetworkingApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "creator": {
      "@type": "Organization",
      "name": "LayerEdge",
      "url": "https://layeredge.io",
      "logo": {
        "@type": "ImageObject",
        "url": fullImageUrl
      },
      "sameAs": [
        "https://twitter.com/layeredge",
        "https://discord.gg/layeredge",
        "https://github.com/layeredge"
      ]
    },
    "featureList": [
      "Twitter/X engagement tracking",
      "Points-based reward system",
      "Community leaderboards",
      "Real-time statistics",
      "Social media integration"
    ],
    "screenshot": {
      "@type": "ImageObject",
      "url": fullImageUrl
    }
  }

  // Add article-specific structured data if type is article
  if (type === 'article' && publishedTime) {
    structuredData["@type"] = "Article"
    structuredData["headline"] = title
    structuredData["datePublished"] = publishedTime
    if (modifiedTime) {
      structuredData["dateModified"] = modifiedTime
    }
    if (author) {
      structuredData["author"] = {
        "@type": "Person",
        "name": author
      }
    }
    if (section) {
      structuredData["articleSection"] = section
    }
    if (tags) {
      structuredData["keywords"] = tags.join(", ")
    }
  }

  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow'
  ].join(', ')

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="author" content={author} />
      <meta name="robots" content={robotsContent} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#f7931a" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:width" content="400" />
      <meta property="og:image:height" content="400" />
      <meta property="og:image:alt" content="LayerEdge Logo" />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="LayerEdge Community Platform" />
      <meta property="og:locale" content="en_US" />
      
      {/* Article-specific Open Graph tags */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      {type === 'article' && section && (
        <meta property="article:section" content={section} />
      )}
      {type === 'article' && tags && tags.map((tag, index) => (
        <meta key={index} property="article:tag" content={tag} />
      ))}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@layeredge" />
      <meta name="twitter:creator" content="@layeredge" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:image:alt" content="LayerEdge Logo" />
      
      {/* Additional Meta Tags */}
      <meta name="application-name" content="LayerEdge" />
      <meta name="apple-mobile-web-app-title" content="LayerEdge" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="msapplication-TileColor" content="#f7931a" />
      <meta name="msapplication-TileImage" content={fullImageUrl} />
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://api.twitter.com" />
      <link rel="preconnect" href="https://pbs.twimg.com" />
      
      {/* DNS Prefetch */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      <link rel="dns-prefetch" href="//api.twitter.com" />
      <link rel="dns-prefetch" href="//pbs.twimg.com" />
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
      
      {/* Additional structured data for organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "LayerEdge",
            "url": "https://layeredge.io",
            "logo": {
              "@type": "ImageObject",
              "url": fullImageUrl
            },
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "email": "community@layeredge.io"
            },
            "sameAs": [
              "https://twitter.com/layeredge",
              "https://discord.gg/layeredge",
              "https://github.com/layeredge",
              "https://t.me/layeredge"
            ]
          })
        }}
      />
      
      {/* Breadcrumb structured data for non-homepage */}
      {url !== "https://edgen.koyeb.app" && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://edgen.koyeb.app"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": title,
                  "item": url
                }
              ]
            })
          }}
        />
      )}
    </Head>
  )
}

// Predefined SEO configurations for common pages
export const seoConfigs = {
  home: {
    title: "LayerEdge Community Platform - Earn Points for X/Twitter Engagement",
    description: "Join the LayerEdge $EDGEN community platform. Engage with LayerEdge content on X/Twitter and earn points for your participation. Connect, compete, and climb the leaderboard.",
    keywords: ["LayerEdge", "EDGEN", "community", "Twitter", "X", "engagement", "points", "leaderboard", "cryptocurrency", "blockchain"]
  },
  dashboard: {
    title: "Dashboard - LayerEdge Community Platform",
    description: "View your LayerEdge community stats, points earned, tweet submissions, and leaderboard ranking. Track your engagement and climb the rankings.",
    keywords: ["dashboard", "stats", "points", "ranking", "LayerEdge", "community"]
  },
  leaderboard: {
    title: "Leaderboard - LayerEdge Community Platform",
    description: "See the top LayerEdge community members ranked by points earned through X/Twitter engagement. Compete with other members and climb the rankings.",
    keywords: ["leaderboard", "rankings", "top users", "competition", "LayerEdge", "community"]
  },
  faq: {
    title: "FAQ - LayerEdge Community Platform",
    description: "Frequently asked questions about the LayerEdge community platform, points system, tweet submissions, and how to earn rewards for X/Twitter engagement.",
    keywords: ["FAQ", "help", "questions", "support", "LayerEdge", "community", "points system"]
  },
  terms: {
    title: "Terms of Service - LayerEdge Community Platform",
    description: "Terms of Service for the LayerEdge community platform. Learn about our community guidelines, points system rules, and user responsibilities.",
    keywords: ["terms of service", "community guidelines", "rules", "LayerEdge", "legal"]
  },
  privacy: {
    title: "Privacy Policy - LayerEdge Community Platform",
    description: "Privacy Policy for the LayerEdge community platform. Learn how we collect, use, and protect your personal information and Twitter data.",
    keywords: ["privacy policy", "data protection", "GDPR", "Twitter API", "user data", "LayerEdge"]
  }
}
