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
redis_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup resources"""
    global scweet_instance, redis_client
    
    try:
        # Initialize Redis for caching
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
        redis_client = redis.from_url(redis_url, decode_responses=True)
        
        # Initialize Scweet
        from Scweet.scweet import Scweet
        scweet_instance = Scweet(
            proxy=None,
            cookies=None,
            cookies_path='/tmp/cookies',
            user_agent=None,
            disable_images=True,
            env_path='.env',
            n_splits=-1,
            concurrency=3,  # Lower for Koyeb resource limits
            headless=True,
            scroll_ratio=50  # Reduced for faster scraping
        )
        
        logger.info("Scweet service initialized successfully")
        yield
        
    except Exception as e:
        logger.error(f"Failed to initialize Scweet service: {e}")
        yield
    finally:
        # Cleanup
        if redis_client:
            redis_client.close()
        logger.info("Scweet service cleanup completed")

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
        "service": "scweet",
        "timestamp": datetime.utcnow().isoformat(),
        "scweet_ready": scweet_instance is not None
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
        
        # Scrape tweet data
        logger.info(f"Scraping tweet data for {request.tweet_url}")
        
        # Use Scweet to get tweet data
        # Note: This is a simplified implementation - you may need to adapt based on Scweet v3 API
        results = scweet_instance.scrape(
            since=(datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d"),
            until=datetime.now().strftime("%Y-%m-%d"),
            from_account=username,
            limit=50,
            display_type="Latest"
        )
        
        # Find the specific tweet
        tweet_data = None
        for tweet in results:
            if tweet.get('tweetId') == tweet_id:
                tweet_data = tweet
                break
        
        if not tweet_data:
            raise HTTPException(status_code=404, detail="Tweet not found")
        
        # Get user info if requested
        user_info = {}
        if request.include_user_info:
            user_data = scweet_instance.get_user_information(
                handles=[username],
                login=False
            )
            if user_data and username in user_data:
                user_info = user_data[username]
        
        # Format response
        response_data = {
            "tweet_id": tweet_id,
            "content": tweet_data.get('Text', ''),
            "author": {
                "username": username,
                "display_name": user_info.get('name', username),
                "verified": user_info.get('verified', False),
                "followers_count": user_info.get('followers', 0),
                "following_count": user_info.get('following', 0)
            },
            "engagement": {
                "likes": int(tweet_data.get('Likes', 0)),
                "retweets": int(tweet_data.get('Retweets', 0)),
                "replies": int(tweet_data.get('Replies', 0))
            },
            "created_at": tweet_data.get('Timestamp', datetime.utcnow().isoformat()),
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
        
        # Get user data
        user_data = scweet_instance.get_user_information(
            handles=[request.username],
            login=False
        )
        
        if not user_data or request.username not in user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
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
