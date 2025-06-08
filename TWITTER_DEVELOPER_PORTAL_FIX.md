# 🚨 CRITICAL: Twitter Developer Portal Configuration Fix

## IMMEDIATE ACTION REQUIRED

The "Token exchange failed: 401 Unauthorized" error indicates a mismatch between your Twitter App configuration and the OAuth request.

### STEP 1: Go to Twitter Developer Portal

1. Visit: https://developer.twitter.com/en/portal/dashboard
2. Select your LayerEdge app
3. Go to "Settings" tab

### STEP 2: Update App Settings (EXACT VALUES)

**App Details:**
- **App Name:** LayerEdge Community Platform
- **Website URL:** `https://edgen.koyeb.app`
- **Callback URLs:** `https://edgen.koyeb.app/auth/twitter/callback`
- **Terms of Service:** `https://edgen.koyeb.app/terms`
- **Privacy Policy:** `https://edgen.koyeb.app/privacy`

### STEP 3: OAuth 2.0 Settings

**CRITICAL:** Ensure these settings are enabled:

1. **OAuth 2.0 is ENABLED**
2. **Type of App:** Web App
3. **App permissions:** Read
4. **Callback URLs:** `https://edgen.koyeb.app/auth/twitter/callback`
5. **Website URL:** `https://edgen.koyeb.app`

### STEP 4: Verify Client Credentials

**Your current Koyeb environment variables:**
- `TWITTER_CLIENT_ID=QlEtZHlyVzFqaHhkXzNLNVN3bE06MTpjaQ`
- `TWITTER_CLIENT_SECRET=Rl2zEnwWoSrc-3QgDEbs0Uy-0SBeCpcOuTndIxFjdE4xmoJiAy`

**VERIFY:** These match exactly in Twitter Developer Portal:
1. Go to "Keys and tokens" tab
2. Check "OAuth 2.0 Client ID" matches: `QlEtZHlyVzFqaHhkXzNLNVN3bE06MTpjaQ`
3. Check "OAuth 2.0 Client Secret" matches: `Rl2zEnwWoSrc-3QgDEbs0Uy-0SBeCpcOuTndIxFjdE4xmoJiAy`

### STEP 5: Common Issues & Fixes

**Issue 1: Callback URL Mismatch**
- ❌ Wrong: `http://localhost:3000/auth/twitter/callback`
- ❌ Wrong: `https://edgen.koyeb.app/auth/callback`
- ✅ Correct: `https://edgen.koyeb.app/auth/twitter/callback`

**Issue 2: OAuth 2.0 Not Enabled**
- Go to Settings → Authentication settings
- Ensure "OAuth 2.0" toggle is ON
- Ensure "OAuth 1.0a" is OFF (if using OAuth 2.0)

**Issue 3: App Permissions**
- Minimum required: "Read"
- Recommended: "Read and Write" (for future features)

**Issue 4: Client Secret Mismatch**
- If credentials don't match, regenerate them in Twitter Developer Portal
- Update Koyeb environment variables with new values

### STEP 6: Test After Changes

1. Save all changes in Twitter Developer Portal
2. Wait 5-10 minutes for changes to propagate
3. Test OAuth flow: https://edgen.koyeb.app/auth/twitter
4. Check Koyeb logs for detailed error messages

### DEBUGGING

If still getting 401 errors, check Koyeb logs for:
- "Token exchange request" details
- "Token exchange response" details
- Any credential mismatches

---

**MOST COMMON CAUSE:** Callback URL mismatch between Twitter Developer Portal and actual OAuth request.
**SOLUTION:** Ensure callback URL is exactly `https://edgen.koyeb.app/auth/twitter/callback` in Twitter Developer Portal.
