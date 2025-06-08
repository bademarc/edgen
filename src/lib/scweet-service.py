#!/usr/bin/env python3
"""
Scweet Service for LayerEdge Community Platform
FastAPI service that wraps Scweet functionality for tweet scraping
"""

import os
import asyncio
import logging
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, HttpUrl
import redis
import json
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models for API
class TweetRequest(BaseModel):
    tweet_url: str
    include_engagement: bool = True
    include_user_info: bool = True

class TweetResponse(BaseModel):
    tweet_id: str
    content: str
    author: Dict[str, Any]
    engagement: Dict[str, int]
    created_at: str
    source: str = "scweet"
    is_from_layeredge_community: bool = False

class UserInfoRequest(BaseModel):
    username: str
    include_followers: bool = False

class UserInfoResponse(BaseModel):
    username: str
    display_name: str
    bio: str
    followers_count: int
    following_count: int
    verified: bool
    location: Optional[str] = None
    website: Optional[str] = None
    join_date: Optional[str] = None

class EngagementRequest(BaseModel):
    tweet_url: str

class EngagementResponse(BaseModel):
    likes: int
    retweets: int
    replies: int
    timestamp: str
    source: str = "scweet"

# Global variables
scweet_instance = None
twikit_client = None
redis_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup resources"""
    global scweet_instance, twikit_client, redis_client

    try:
        # Initialize Redis for caching
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
        redis_client = redis.from_url(redis_url, decode_responses=True)

        # Initialize Official Scweet v3.0+
        from Scweet.scweet import Scweet
        scweet_instance = Scweet(
            proxy=None,  # No proxy for now
            cookies=None,  # Nodriver handles cookies automatically
            cookies_directory='/tmp/cookies',  # Official parameter name
            user_agent=None,  # Use default
            disable_images=True,  # Faster scraping
            env_path='.env',  # Twitter credentials file
            n_splits=-1,  # No date splitting for single tweets
            concurrency=3,  # Lower for Koyeb resource limits
            headless=True,  # Required for server deployment
            scroll_ratio=50  # Reduced for faster scraping
        )

        # Initialize Twikit client
        try:
            from twikit import Client
            twikit_client = Client('en-US')

            # Try to login with credentials if available
            twikit_username = os.getenv('TWIKIT_USERNAME')
            twikit_email = os.getenv('TWIKIT_EMAIL')
            twikit_password = os.getenv('TWIKIT_PASSWORD')

            if twikit_username and twikit_email and twikit_password:
                await twikit_client.login(
                    auth_info_1=twikit_username,
                    auth_info_2=twikit_email,
                    password=twikit_password
                )
                logger.info("Twikit client logged in successfully")
            else:
                logger.info("Twikit client initialized without login (guest mode)")

        except Exception as e:
            logger.warning(f"Failed to initialize Twikit client: {e}")
            twikit_client = None

        logger.info("Scweet and Twikit services initialized successfully")
        yield

    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")
        yield
    finally:
        # Cleanup
        if redis_client:
            redis_client.close()
        if twikit_client:
            try:
                await twikit_client.close()
            except:
                pass
        logger.info("Services cleanup completed")

# Create FastAPI app
app = FastAPI(
    title="Scweet Service for LayerEdge",
    description="Tweet scraping service using Scweet",
    version="1.0.0",
    lifespan=lifespan
)

def extract_tweet_id(tweet_url: str) -> str:
    """Extract tweet ID from URL"""
    import re
    match = re.search(r'/status/(\d+)', tweet_url)
    if match:
        return match.group(1)
    raise ValueError("Invalid tweet URL format")

def extract_username(tweet_url: str) -> str:
    """Extract username from tweet URL"""
    import re
    match = re.search(r'(?:x\.com|twitter\.com)/([^/]+)/status/', tweet_url)
    if match:
        return match.group(1)
    raise ValueError("Cannot extract username from URL")

async def get_cached_data(key: str) -> Optional[Dict]:
    """Get cached data from Redis"""
    try:
        if redis_client:
            data = redis_client.get(key)
            if data:
                return json.loads(data)
    except Exception as e:
        logger.warning(f"Redis cache read error: {e}")
    return None

async def set_cached_data(key: str, data: Dict, ttl: int = 300) -> None:
    """Set cached data in Redis with TTL"""
    try:
        if redis_client:
            redis_client.setex(key, ttl, json.dumps(data, default=str))
    except Exception as e:
        logger.warning(f"Redis cache write error: {e}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "scweet-twikit",
        "timestamp": datetime.utcnow().isoformat(),
        "scweet_ready": scweet_instance is not None,
        "twikit_ready": twikit_client is not None
    }

@app.post("/tweet", response_model=TweetResponse)
async def get_tweet_data(request: TweetRequest):
    """Get tweet data using Scweet"""
    if not scweet_instance:
        raise HTTPException(status_code=503, detail="Scweet service not initialized")
    
    try:
        tweet_id = extract_tweet_id(request.tweet_url)
        username = extract_username(request.tweet_url)
        
        # Check cache first
        cache_key = f"tweet:{tweet_id}"
        cached_data = await get_cached_data(cache_key)
        if cached_data:
            logger.info(f"Returning cached data for tweet {tweet_id}")
            return TweetResponse(**cached_data)
        
        # Use Official Scweet v3.0+ API to scrape tweet data
        logger.info(f"Scraping tweet data for {request.tweet_url}")

        # Official Scweet scrape() method for getting tweets from specific user
        results = scweet_instance.scrape(
            since=(datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d"),
            until=datetime.now().strftime("%Y-%m-%d"),
            words=None,  # No keyword filtering
            to_account=None,
            from_account=username,  # Target specific user
            lang=None,  # Any language
            limit=50,  # Limit results
            display_type="Latest",  # Get latest tweets
            resume=False,
            filter_replies=False,
            proximity=False,
            geocode=None,
            minreplies=None,
            minlikes=None,
            minretweets=None,
            save_dir=None,  # Don't save to file
            custom_csv_name=None
        )

        # Find the specific tweet by ID
        tweet_data = None
        for tweet in results:
            # Official Scweet returns tweets with 'tweetId' field
            if str(tweet.get('tweetId', '')).endswith(tweet_id):
                tweet_data = tweet
                break

        if not tweet_data:
            raise HTTPException(status_code=404, detail="Tweet not found in recent tweets")
        
        # Get user info using Official Scweet get_user_information() method
        user_info = {}
        if request.include_user_info:
            try:
                # Official Scweet get_user_information() method
                user_data = scweet_instance.get_user_information(
                    handles=[username],
                    login=False  # Try without login first
                )
                if user_data and username in user_data:
                    user_info = user_data[username]
            except Exception as e:
                logger.warning(f"Failed to get user info for {username}: {e}")
                # Continue without user info
        
        # Format response using Official Scweet data structure
        response_data = {
            "tweet_id": tweet_id,
            "content": tweet_data.get('Text', ''),  # Official Scweet field name
            "author": {
                "username": username,
                "display_name": user_info.get('name', username),
                "verified": user_info.get('verified', False),
                "followers_count": user_info.get('followers', 0),
                "following_count": user_info.get('following', 0)
            },
            "engagement": {
                "likes": int(tweet_data.get('Likes', 0)),      # Official Scweet field name
                "retweets": int(tweet_data.get('Retweets', 0)), # Official Scweet field name
                "replies": int(tweet_data.get('Replies', 0))   # Official Scweet field name
            },
            "created_at": tweet_data.get('Timestamp', datetime.utcnow().isoformat()), # Official Scweet field name
            "source": "scweet",
            "is_from_layeredge_community": check_layeredge_community(tweet_data.get('Text', ''))
        }
        
        # Cache the result
        await set_cached_data(cache_key, response_data, ttl=300)  # 5 minutes
        
        return TweetResponse(**response_data)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error scraping tweet {request.tweet_url}: {e}")
        raise HTTPException(status_code=500, detail="Failed to scrape tweet data")

@app.post("/engagement", response_model=EngagementResponse)
async def get_engagement_metrics(request: EngagementRequest):
    """Get real-time engagement metrics for a tweet"""
    if not scweet_instance:
        raise HTTPException(status_code=503, detail="Scweet service not initialized")
    
    try:
        tweet_id = extract_tweet_id(request.tweet_url)
        
        # Check cache first (shorter TTL for engagement data)
        cache_key = f"engagement:{tweet_id}"
        cached_data = await get_cached_data(cache_key)
        if cached_data:
            return EngagementResponse(**cached_data)
        
        # Get fresh engagement data
        tweet_data = await get_tweet_data(TweetRequest(tweet_url=request.tweet_url))
        
        response_data = {
            "likes": tweet_data.engagement["likes"],
            "retweets": tweet_data.engagement["retweets"],
            "replies": tweet_data.engagement["replies"],
            "timestamp": datetime.utcnow().isoformat(),
            "source": "scweet"
        }
        
        # Cache with shorter TTL for engagement data
        await set_cached_data(cache_key, response_data, ttl=60)  # 1 minute
        
        return EngagementResponse(**response_data)
        
    except Exception as e:
        logger.error(f"Error getting engagement for {request.tweet_url}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get engagement metrics")

@app.post("/user", response_model=UserInfoResponse)
async def get_user_info(request: UserInfoRequest):
    """Get user information"""
    if not scweet_instance:
        raise HTTPException(status_code=503, detail="Scweet service not initialized")
    
    try:
        # Check cache first
        cache_key = f"user:{request.username}"
        cached_data = await get_cached_data(cache_key)
        if cached_data:
            return UserInfoResponse(**cached_data)
        
        # Use Official Scweet get_user_information() method
        user_data = scweet_instance.get_user_information(
            handles=[request.username],
            login=False  # Try without login first for public profiles
        )

        if not user_data or request.username not in user_data:
            raise HTTPException(status_code=404, detail="User not found or profile is private")

        user_info = user_data[request.username]
        
        response_data = {
            "username": request.username,
            "display_name": user_info.get('name', request.username),
            "bio": user_info.get('description', ''),
            "followers_count": user_info.get('followers', 0),
            "following_count": user_info.get('following', 0),
            "verified": user_info.get('verified', False),
            "location": user_info.get('location'),
            "website": user_info.get('website'),
            "join_date": user_info.get('join_date')
        }
        
        # Cache user data for longer
        await set_cached_data(cache_key, response_data, ttl=1800)  # 30 minutes
        
        return UserInfoResponse(**response_data)
        
    except Exception as e:
        logger.error(f"Error getting user info for {request.username}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user information")

@app.post("/twikit/tweet", response_model=TweetResponse)
async def get_tweet_data_twikit(request: TweetRequest):
    """Get tweet data using Twikit as fallback"""
    if not twikit_client:
        raise HTTPException(status_code=503, detail="Twikit service not initialized")

    try:
        tweet_id = extract_tweet_id(request.tweet_url)

        # Check cache first
        cache_key = f"twikit_tweet:{tweet_id}"
        cached_data = await get_cached_data(cache_key)
        if cached_data:
            logger.info(f"Returning cached Twikit data for tweet {tweet_id}")
            return TweetResponse(**cached_data)

        # Get tweet data using Twikit
        logger.info(f"Fetching tweet data via Twikit for {request.tweet_url}")

        tweet = await twikit_client.get_tweet_by_id(tweet_id)

        if not tweet:
            raise HTTPException(status_code=404, detail="Tweet not found via Twikit")

        # Get user info if requested
        user_info = {}
        if request.include_user_info and tweet.user:
            user_info = {
                'name': tweet.user.name,
                'verified': tweet.user.verified,
                'followers': tweet.user.followers_count,
                'following': tweet.user.following_count
            }

        # Format response using Twikit data structure
        response_data = {
            "tweet_id": tweet_id,
            "content": tweet.text or '',
            "author": {
                "username": tweet.user.screen_name if tweet.user else 'unknown',
                "display_name": user_info.get('name', tweet.user.screen_name if tweet.user else 'unknown'),
                "verified": user_info.get('verified', False),
                "followers_count": user_info.get('followers', 0),
                "following_count": user_info.get('following', 0)
            },
            "engagement": {
                "likes": int(tweet.favorite_count or 0),
                "retweets": int(tweet.retweet_count or 0),
                "replies": int(tweet.reply_count or 0)
            },
            "created_at": tweet.created_at.isoformat() if tweet.created_at else datetime.utcnow().isoformat(),
            "source": "twikit",
            "is_from_layeredge_community": check_layeredge_community(tweet.text or '')
        }

        # Cache the result
        await set_cached_data(cache_key, response_data, ttl=300)  # 5 minutes

        return TweetResponse(**response_data)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching tweet via Twikit {request.tweet_url}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch tweet data via Twikit")

@app.post("/twikit/engagement", response_model=EngagementResponse)
async def get_engagement_metrics_twikit(request: EngagementRequest):
    """Get real-time engagement metrics using Twikit"""
    if not twikit_client:
        raise HTTPException(status_code=503, detail="Twikit service not initialized")

    try:
        tweet_id = extract_tweet_id(request.tweet_url)

        # Check cache first (shorter TTL for engagement data)
        cache_key = f"twikit_engagement:{tweet_id}"
        cached_data = await get_cached_data(cache_key)
        if cached_data:
            return EngagementResponse(**cached_data)

        # Get fresh engagement data via Twikit
        tweet = await twikit_client.get_tweet_by_id(tweet_id)

        if not tweet:
            raise HTTPException(status_code=404, detail="Tweet not found via Twikit")

        response_data = {
            "likes": int(tweet.favorite_count or 0),
            "retweets": int(tweet.retweet_count or 0),
            "replies": int(tweet.reply_count or 0),
            "timestamp": datetime.utcnow().isoformat(),
            "source": "twikit"
        }

        # Cache with shorter TTL for engagement data
        await set_cached_data(cache_key, response_data, ttl=60)  # 1 minute

        return EngagementResponse(**response_data)

    except Exception as e:
        logger.error(f"Error getting engagement via Twikit for {request.tweet_url}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get engagement metrics via Twikit")

@app.post("/twikit/user", response_model=UserInfoResponse)
async def get_user_info_twikit(request: UserInfoRequest):
    """Get user information using Twikit"""
    if not twikit_client:
        raise HTTPException(status_code=503, detail="Twikit service not initialized")

    try:
        # Check cache first
        cache_key = f"twikit_user:{request.username}"
        cached_data = await get_cached_data(cache_key)
        if cached_data:
            return UserInfoResponse(**cached_data)

        # Get user data via Twikit
        user = await twikit_client.get_user_by_screen_name(request.username)

        if not user:
            raise HTTPException(status_code=404, detail="User not found via Twikit")

        response_data = {
            "username": request.username,
            "display_name": user.name or request.username,
            "bio": user.description or '',
            "followers_count": user.followers_count or 0,
            "following_count": user.following_count or 0,
            "verified": user.verified or False,
            "location": user.location,
            "website": user.url,
            "join_date": user.created_at.isoformat() if user.created_at else None
        }

        # Cache user data for longer
        await set_cached_data(cache_key, response_data, ttl=1800)  # 30 minutes

        return UserInfoResponse(**response_data)

    except Exception as e:
        logger.error(f"Error getting user info via Twikit for {request.username}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user information via Twikit")

def check_layeredge_community(content: str) -> bool:
    """Check if tweet content is related to LayerEdge community"""
    content_lower = content.lower()
    return '@layeredge' in content_lower or '$edgen' in content_lower

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "scweet-service:app",
        host="0.0.0.0",
        port=8001,
        reload=False,
        log_level="info"
    )
