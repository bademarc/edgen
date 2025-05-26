# Koyeb Deployment Guide - LayerEdge $Edgen Community

## 🚀 Pre-Deployment Checklist

### ✅ Prerequisites Complete
- [x] Supabase PostgreSQL database configured
- [x] Database migrations created and tested
- [x] Environment variables prepared
- [x] GitHub repository ready
- [x] Twitter/X API credentials available

## 📋 Step-by-Step Deployment

### Step 1: Prepare Repository for Deployment

First, let's ensure your code is committed and pushed to GitHub:

```bash
# Add all changes
git add .

# Commit the Supabase integration
git commit -m "feat: integrate Supabase PostgreSQL database for production deployment

- Configure Supabase connection strings for Koyeb compatibility
- Add transaction pooler for serverless operations
- Add session pooler for migrations
- Update Prisma schema with directUrl
- Create initial database migration
- Add database verification script
- Update environment configurations
- Ready for Koyeb deployment"

# Push to GitHub
git push origin main
```

### Step 2: Create Koyeb Service

1. **Go to Koyeb Dashboard**
   - Visit [app.koyeb.com](https://app.koyeb.com)
   - Sign in to your account

2. **Create New Service**
   - Click "Create Web Service"
   - Select "GitHub" as deployment method
   - Choose your repository: `layeredge-edgen-community`
   - Select branch: `main`

3. **Configure Build Settings**
   ```
   Service Name: layeredge-edgen-community
   Build Command: npm run build
   Start Command: npm start
   Port: 3000
   ```

### Step 3: Set Environment Variables

In the Koyeb service configuration, add these environment variables:

#### Database Configuration
```bash
DATABASE_URL=postgres://postgres.bzqayhnlogpaxfcmmrlq:d234A879a1%23@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgres://postgres.bzqayhnlogpaxfcmmrlq:d234A879a1%23@aws-0-eu-north-1.pooler.supabase.com:5432/postgres
```

#### NextAuth.js Configuration
```bash
NEXTAUTH_URL=https://your-app-name.koyeb.app
NEXTAUTH_SECRET=layeredge-edgen-community-secret-key-2024
```

#### Twitter/X API Configuration
```bash
TWITTER_CLIENT_ID=SzVkU3VsQ0NheWcwMVU1MW8ta1I6MTpjaQ
TWITTER_CLIENT_SECRET=snl_S5q_2RZ1Bk6V7GCyDUoNWuAHxFjnf6Za7W-F2qMz3UUvLS
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAHyCzwEAAAAAh9uE7X3FHoLzdxGTfVwuDVkhDV4%3DcbbsrKkuHDiBFC0PGANM7jD8vrLOd0tnlhr30brsLmXUAxHFTZ
```

#### Application Configuration
```bash
LAYEREDGE_COMMUNITY_URL=https://x.com/i/communities/1890107751621363
NODE_ENV=production
```

### Step 4: Deploy

1. **Review Configuration**
   - Verify all environment variables are set
   - Confirm build and start commands
   - Check port configuration (3000)

2. **Start Deployment**
   - Click "Deploy" button
   - Monitor build logs for any issues

### Step 5: Post-Deployment Verification

Once deployed, verify the application:

1. **Check Application Health**
   - Visit your Koyeb app URL
   - Verify the homepage loads correctly
   - Test navigation between pages

2. **Verify Database Connection**
   - Check that user data displays on leaderboard
   - Verify tweet submission functionality
   - Test authentication flow

3. **Update Twitter OAuth Settings**
   - Go to [Twitter Developer Portal](https://developer.twitter.com)
   - Update callback URL to: `https://your-app-name.koyeb.app/api/auth/callback/twitter`

## 🔧 Build Process Details

The Koyeb build will automatically:

1. **Install Dependencies**: `npm install`
2. **Generate Prisma Client**: `prisma generate`
3. **Deploy Migrations**: `prisma migrate deploy`
4. **Build Next.js**: `next build`

## 🌐 Expected Deployment URL

Your application will be available at:
```
https://layeredge-edgen-community-[your-org].koyeb.app
```

## 🔍 Monitoring and Logs

### Build Logs
Monitor the build process in Koyeb dashboard:
- Check for successful Prisma client generation
- Verify database migration deployment
- Confirm Next.js build completion

### Runtime Logs
After deployment, monitor:
- Database connection status
- API endpoint responses
- Authentication flow

## 🚨 Troubleshooting

### Common Issues and Solutions

1. **Build Failures**
   ```bash
   # If Prisma generation fails
   - Check DATABASE_URL and DIRECT_URL are set
   - Verify Supabase database is accessible
   ```

2. **Database Connection Issues**
   ```bash
   # If connection fails
   - Verify environment variables are correct
   - Check Supabase database status
   - Ensure IPv4 pooler endpoints are used
   ```

3. **Authentication Issues**
   ```bash
   # If Twitter OAuth fails
   - Update callback URL in Twitter Developer Portal
   - Verify NEXTAUTH_URL matches deployment URL
   - Check NEXTAUTH_SECRET is set
   ```

## ✅ Deployment Checklist

- [ ] Code committed and pushed to GitHub
- [ ] Koyeb service created and configured
- [ ] All environment variables set correctly
- [ ] Build completed successfully
- [ ] Application accessible via deployment URL
- [ ] Database connection verified
- [ ] Authentication flow tested
- [ ] Twitter OAuth callback URL updated

## 🎉 Success Indicators

Your deployment is successful when:
- ✅ Build completes without errors
- ✅ Application loads at deployment URL
- ✅ Database queries work (leaderboard shows data)
- ✅ Authentication redirects work
- ✅ All pages navigate correctly

## 📞 Support

If you encounter issues:
1. Check Koyeb build and runtime logs
2. Verify environment variables
3. Test database connectivity
4. Review Twitter API configuration

Ready to deploy? Let's start with Step 1!
