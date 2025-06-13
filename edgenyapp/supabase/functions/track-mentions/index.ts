/**
 * LayerEdge Community Platform - Automated Mention Tracking Edge Function
 *
 * This is a Supabase Edge Function that runs in Deno runtime, NOT Node.js.
 * It's excluded from Next.js compilation via tsconfig.json and next.config.js.
 *
 * Purpose: Automatically track X (Twitter) mentions of "Edgen", "$EDGEN", and "@layeredge"
 * and award points to registered users.
 *
 * Deployment: Use `supabase functions deploy track-mentions` to deploy this function.
 *
 * Note: This file uses Deno-style imports which are incompatible with Next.js.
 * Do not move this file to the src/ directory or remove it from tsconfig exclude.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Tweet {
  id: string
  text: string
  author_id: string
  created_at: string
  public_metrics: {
    like_count: number
    retweet_count: number
    reply_count: number
    quote_count: number
  }
}

interface TwitterApiResponse {
  data?: Tweet[]
  meta?: {
    newest_id?: string
    oldest_id?: string
    result_count: number
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔍 Starting automated mention tracking...')

    // Authenticate request
    const authHeader = req.headers.get('Authorization')
    const expectedAuth = `Bearer ${Deno.env.get('MENTION_TRACKER_SECRET')}`

    if (authHeader !== expectedAuth) {
      console.error('❌ Unauthorized request:', { authHeader: !!authHeader })
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      })
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get X API Bearer Token
    const xBearerToken = Deno.env.get('X_BEARER_TOKEN')
    if (!xBearerToken) {
      throw new Error('Missing X API Bearer Token')
    }

    console.log('✅ Configuration validated')

    // Fetch last processed tweet ID from system config
    const { data: config, error: configError } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'last_tweet_id')
      .single()

    if (configError && configError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error fetching config:', configError)
      throw new Error(`Config fetch error: ${configError.message}`)
    }

    const lastTweetId = config?.value
    console.log('📋 Last processed tweet ID:', lastTweetId || 'none')

    // Build X API search parameters
    const searchParams = new URLSearchParams({
      'query': '(Edgen OR $EDGEN OR @layeredge) -is:retweet',
      'tweet.fields': 'author_id,created_at,public_metrics',
      'max_results': '100'
    })

    if (lastTweetId) {
      searchParams.append('since_id', lastTweetId)
    }

    console.log('🔍 Searching for tweets with query:', searchParams.get('query'))

    // Call X API
    const apiUrl = `https://api.x.com/2/tweets/search/recent?${searchParams}`
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${xBearerToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ X API error:', response.status, errorText)

      if (response.status === 429) {
        return new Response(JSON.stringify({
          error: 'Rate limited',
          message: 'X API rate limit reached. Will retry in next cycle.',
          retryAfter: response.headers.get('x-rate-limit-reset')
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      throw new Error(`X API error: ${response.status} ${errorText}`)
    }

    const apiData: TwitterApiResponse = await response.json()
    const tweets = apiData.data || []

    console.log(`📊 Found ${tweets.length} new tweets`)

    if (tweets.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No new tweets found',
        processed: 0,
        total_tweets: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Process tweets and award points
    let processedCount = 0
    let skippedCount = 0
    const errors: string[] = []

    for (const tweet of tweets) {
      try {
        console.log(`🔄 Processing tweet ${tweet.id} from author ${tweet.author_id}`)

        // Check if user exists in our system
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('x_user_id', tweet.author_id)
          .single()

        if (userError || !user) {
          console.log(`⏭️  Skipping tweet ${tweet.id} - user not registered`)
          skippedCount++
          continue
        }

        console.log(`👤 Found registered user: ${user.id}`)

        // Award points using database function
        const { error: awardError } = await supabase.rpc('award_points_for_tweet', {
          p_user_id: user.id,
          p_tweet_id: tweet.id,
          p_author_id: tweet.author_id,
          p_tweet_content: tweet.text,
          p_engagement_metrics: tweet.public_metrics
        })

        if (awardError) {
          if (awardError.code === '23505') { // Unique violation - tweet already processed
            console.log(`⏭️  Tweet ${tweet.id} already processed`)
            skippedCount++
          } else {
            console.error(`❌ Error awarding points for tweet ${tweet.id}:`, awardError)
            errors.push(`Tweet ${tweet.id}: ${awardError.message}`)
          }
        } else {
          console.log(`✅ Awarded points for tweet ${tweet.id}`)
          processedCount++
        }

      } catch (error) {
        console.error(`❌ Error processing tweet ${tweet.id}:`, error)
        errors.push(`Tweet ${tweet.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Update last processed tweet ID
    if (tweets.length > 0) {
      const newestTweetId = tweets[0].id // Tweets are returned in reverse chronological order

      const { error: updateError } = await supabase
        .from('system_config')
        .upsert({
          key: 'last_tweet_id',
          value: newestTweetId,
          updated_at: new Date().toISOString()
        })

      if (updateError) {
        console.error('❌ Error updating last tweet ID:', updateError)
        errors.push(`Config update: ${updateError.message}`)
      } else {
        console.log(`📝 Updated last tweet ID to: ${newestTweetId}`)
      }
    }

    const result = {
      success: true,
      message: 'Mention tracking completed',
      processed: processedCount,
      skipped: skippedCount,
      total_tweets: tweets.length,
      errors: errors.length,
      error_details: errors.slice(0, 3), // Include first 3 errors
      timestamp: new Date().toISOString()
    }

    console.log('🎉 Tracking completed:', result)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('💥 Fatal error in mention tracking:', error)

    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
