# 🚨 CRITICAL KOYEB ENVIRONMENT VARIABLES - EXACT VALUES REQUIRED

## IMMEDIATE ACTION REQUIRED

Go to https://app.koyeb.com → LayerEdge service → Settings → Environment Variables

### ADD/UPDATE THESE EXACT VALUES:

```bash
# PRIORITY 1: Twitter API Authentication (EXACT VALUES)
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAADEZ2AEAAAAAU7lOXErZa3sVAe9ZmVjVbeT1bSE%3DkCgb5dbAOmBchFS9wpE4hnhCVmD18qahYF1gSXIMUDvMb5QlVX
TWITTER_CLIENT_ID=QlEtZHlyVzFqaHhkXzNLNVN3bE06MTpjaQ
TWITTER_CLIENT_SECRET=Rl2zEnwWoSrc-3QgDEbs0Uy-0SBeCpcOuTndIxFjdE4xmoJiAy

# PRIORITY 2: Production URLs (CRITICAL)
NEXT_PUBLIC_SITE_URL=https://edgen.koyeb.app
NEXTAUTH_URL=https://edgen.koyeb.app

# PRIORITY 3: Redis Configuration (EXACT VALUES)
UPSTASH_REDIS_REST_URL=https://gusc1-national-lemur-31832.upstash.io
UPSTASH_REDIS_REST_TOKEN=acd4b50ce33b4436b09f6f278848dfb7
REDIS_HOST=gusc1-national-lemur-31832.upstash.io
REDIS_PORT=31832
REDIS_PASSWORD=acd4b50ce33b4436b09f6f278848dfb7

# Server Configuration
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

## TWITTER DEVELOPER PORTAL CONFIGURATION

**CRITICAL:** Update Twitter App settings at https://developer.twitter.com

1. **Callback URL:** `https://edgen.koyeb.app/auth/twitter/callback`
2. **Website URL:** `https://edgen.koyeb.app`
3. **Terms of Service:** `https://edgen.koyeb.app/terms`
4. **Privacy Policy:** `https://edgen.koyeb.app/privacy`

## DEPLOYMENT STEPS

1. **Add Environment Variables** (copy exact values above)
2. **Update Twitter Developer Portal** (callback URL)
3. **Trigger Koyeb Redeploy** (manual redeploy button)
4. **Monitor Deployment Logs** (watch for errors)
5. **Test OAuth Flow** (complete login process)

## SUCCESS CRITERIA

- ✅ No "Bearer Token format" warnings in logs
- ✅ Twitter OAuth completes without "unauthorized_client" errors
- ✅ Server starts with `node server.js` successfully
- ✅ Redis operations complete without authentication errors
- ✅ Tweet tracking monitors @layeredge and $EDGEN mentions

## VALIDATION

Run after deployment:
```bash
node scripts/validate-env-vars.js
```

---

**CRITICAL:** These are the EXACT values from your deployment logs analysis.
Any deviation will cause authentication failures.
