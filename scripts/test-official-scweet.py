#!/usr/bin/env python3
"""
Official Scweet v3.0+ Direct Integration Test
Tests the Official Altimis/Scweet library directly for LayerEdge platform
"""

import os
import sys
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

# Add the project root to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

def test_official_scweet_import():
    """Test importing Official Scweet v3.0+ library"""
    print("🔍 Testing Official Scweet v3.0+ Import...")
    
    try:
        from Scweet.scweet import Scweet
        from Scweet.utils import create_mailtm_email
        print("✅ Official Scweet v3.0+ imported successfully!")
        return True
    except ImportError as e:
        print(f"❌ Failed to import Official Scweet: {e}")
        print("💡 Install Official Scweet with: pip install git+https://github.com/Altimis/Scweet.git@master")
        return False
    except Exception as e:
        print(f"❌ Unexpected error importing Scweet: {e}")
        return False

def initialize_official_scweet():
    """Initialize Official Scweet v3.0+ with proper configuration"""
    print("🚀 Initializing Official Scweet v3.0+...")
    
    try:
        from Scweet.scweet import Scweet
        
        # Official Scweet v3.0+ initialization parameters
        scweet = Scweet(
            proxy=None,  # No proxy
            cookies=None,  # Nodriver handles cookies automatically
            cookies_directory='/tmp/scweet_cookies',  # Official parameter name
            user_agent=None,  # Use default user agent
            disable_images=True,  # Faster scraping
            env_path='.env',  # Environment file for credentials
            n_splits=-1,  # No date splitting for single tweets
            concurrency=2,  # Lower concurrency for testing
            headless=True,  # Headless mode
            scroll_ratio=50  # Moderate scrolling
        )
        
        print("✅ Official Scweet v3.0+ initialized successfully!")
        return scweet
    except Exception as e:
        print(f"❌ Failed to initialize Official Scweet: {e}")
        return None

def test_user_information(scweet, usernames: List[str]):
    """Test Official Scweet get_user_information() method"""
    print(f"👤 Testing Official Scweet get_user_information() for {len(usernames)} users...")
    
    try:
        # Official Scweet v3.0+ get_user_information method
        user_data = scweet.get_user_information(
            handles=usernames,
            login=False  # Try without login first
        )
        
        if user_data:
            print("✅ User information retrieved successfully!")
            for username, info in user_data.items():
                print(f"   @{username}:")
                print(f"     Name: {info.get('name', 'N/A')}")
                print(f"     Followers: {info.get('followers', 'N/A')}")
                print(f"     Following: {info.get('following', 'N/A')}")
                print(f"     Verified: {info.get('verified', False)}")
                print(f"     Bio: {info.get('description', 'N/A')[:100]}...")
            return True
        else:
            print("❌ No user data returned")
            return False
            
    except Exception as e:
        print(f"❌ Error getting user information: {e}")
        return False

def test_tweet_scraping(scweet, username: str, days_back: int = 7):
    """Test Official Scweet scrape() method"""
    print(f"🐦 Testing Official Scweet scrape() for @{username} (last {days_back} days)...")
    
    try:
        # Calculate date range
        until_date = datetime.now()
        since_date = until_date - timedelta(days=days_back)
        
        # Official Scweet v3.0+ scrape method
        results = scweet.scrape(
            since=since_date.strftime("%Y-%m-%d"),
            until=until_date.strftime("%Y-%m-%d"),
            words=None,  # No keyword filtering
            to_account=None,
            from_account=username,  # Target specific user
            lang=None,  # Any language
            limit=10,  # Limit for testing
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
        
        if results:
            print(f"✅ Retrieved {len(results)} tweets successfully!")
            for i, tweet in enumerate(results[:3]):  # Show first 3 tweets
                print(f"   Tweet {i+1}:")
                print(f"     ID: {tweet.get('tweetId', 'N/A')}")
                print(f"     Text: {tweet.get('Text', 'N/A')[:100]}...")
                print(f"     Likes: {tweet.get('Likes', 0)}")
                print(f"     Retweets: {tweet.get('Retweets', 0)}")
                print(f"     Replies: {tweet.get('Replies', 0)}")
                print(f"     Timestamp: {tweet.get('Timestamp', 'N/A')}")
            return True
        else:
            print("❌ No tweets returned")
            return False
            
    except Exception as e:
        print(f"❌ Error scraping tweets: {e}")
        return False

def test_layeredge_content_detection(scweet):
    """Test scraping for LayerEdge-related content"""
    print("🔍 Testing LayerEdge content detection...")
    
    try:
        # Search for LayerEdge-related tweets
        results = scweet.scrape(
            since=(datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"),
            until=datetime.now().strftime("%Y-%m-%d"),
            words=["layeredge", "EDGEN"],  # LayerEdge keywords
            to_account=None,
            from_account=None,
            lang="en",
            limit=5,  # Small limit for testing
            display_type="Latest",
            resume=False,
            filter_replies=False,
            proximity=False,
            geocode=None,
            minreplies=None,
            minlikes=None,
            minretweets=None,
            save_dir=None,
            custom_csv_name=None
        )
        
        if results:
            print(f"✅ Found {len(results)} LayerEdge-related tweets!")
            layeredge_count = 0
            edgen_count = 0
            
            for tweet in results:
                text = tweet.get('Text', '').lower()
                if 'layeredge' in text:
                    layeredge_count += 1
                if 'edgen' in text:
                    edgen_count += 1
                    
            print(f"   Tweets mentioning 'layeredge': {layeredge_count}")
            print(f"   Tweets mentioning 'edgen': {edgen_count}")
            return True
        else:
            print("⚠️ No LayerEdge-related tweets found (this might be normal)")
            return True  # Not necessarily an error
            
    except Exception as e:
        print(f"❌ Error searching for LayerEdge content: {e}")
        return False

def generate_test_report(results: Dict[str, bool]):
    """Generate a comprehensive test report"""
    print("\n" + "="*60)
    print("📊 OFFICIAL SCWEET v3.0+ INTEGRATION TEST REPORT")
    print("="*60)
    
    total_tests = len(results)
    passed_tests = sum(results.values())
    success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
    
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {total_tests - passed_tests}")
    print(f"Success Rate: {success_rate:.1f}%")
    print()
    
    print("Test Results:")
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status} {test_name}")
    
    print("\n" + "="*60)
    
    if success_rate >= 80:
        print("🎉 EXCELLENT: Official Scweet v3.0+ integration is working well!")
        print("✅ Ready for production deployment")
    elif success_rate >= 60:
        print("⚠️ GOOD: Official Scweet v3.0+ integration is mostly working")
        print("🔧 Some issues need attention before production")
    else:
        print("❌ POOR: Official Scweet v3.0+ integration has significant issues")
        print("🚨 Requires debugging before deployment")
    
    return success_rate >= 80

def main():
    """Main test execution"""
    print("🚀 OFFICIAL SCWEET v3.0+ INTEGRATION TEST SUITE")
    print("📦 Testing Altimis/Scweet Repository Integration")
    print("🔗 https://github.com/Altimis/Scweet")
    print("="*60)
    
    results = {}
    
    # Test 1: Import Official Scweet
    results["Import Official Scweet v3.0+"] = test_official_scweet_import()
    
    if not results["Import Official Scweet v3.0+"]:
        print("\n❌ Cannot proceed without Official Scweet library")
        return False
    
    # Test 2: Initialize Official Scweet
    scweet = initialize_official_scweet()
    results["Initialize Official Scweet"] = scweet is not None
    
    if scweet is None:
        print("\n❌ Cannot proceed without Scweet initialization")
        generate_test_report(results)
        return False
    
    # Test 3: User Information
    test_usernames = ["elonmusk", "twitter"]  # Public accounts for testing
    results["Get User Information"] = test_user_information(scweet, test_usernames)
    
    # Test 4: Tweet Scraping
    results["Scrape Tweets"] = test_tweet_scraping(scweet, "elonmusk", days_back=3)
    
    # Test 5: LayerEdge Content Detection
    results["LayerEdge Content Detection"] = test_layeredge_content_detection(scweet)
    
    # Generate final report
    success = generate_test_report(results)
    
    if success:
        print("\n🎯 NEXT STEPS:")
        print("1. Deploy the Scweet service using docker-compose")
        print("2. Update LayerEdge fallback service configuration")
        print("3. Run integration tests with the full platform")
        print("4. Monitor performance in production")
    else:
        print("\n🔧 TROUBLESHOOTING:")
        print("1. Check Official Scweet installation: pip install git+https://github.com/Altimis/Scweet.git@master")
        print("2. Verify Chrome/Chromium installation")
        print("3. Check network connectivity")
        print("4. Review error messages above")
    
    return success

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⚠️ Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        sys.exit(1)
