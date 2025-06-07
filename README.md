# LayerEdge $Edgen Community Platform

A comprehensive React.js web application for the LayerEdge $Edgen token community that gamifies user engagement with X (Twitter) community posts.

## 🚀 Features

### Core Functionality
- **X Community Integration**: Connect to the LayerEdge X community at https://x.com/i/communities/1890107751621357663
- **Points System**: Earn points for tweet submissions and engagement
- **Leaderboard**: Compete with community members and track rankings
- **User Dashboard**: Personal statistics and activity overview
- **Tweet Submission**: Submit and verify tweets from the LayerEdge community

### Technical Features
- **Modern Stack**: Next.js 15, React 19, TypeScript, Tailwind CSS v4
- **Dark Theme**: Futuristic dark design with smooth animations
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Real-time Updates**: Live points calculation and leaderboard updates
- **Database Integration**: Prisma ORM with SQLite for development

## 🎯 Points System

- **Base Points**: 5 points per verified tweet submission
- **Engagement Multipliers**:
  - +1 point per like
  - +3 points per retweet
  - +2 points per reply
- **Real-time Updates**: Points update automatically as engagement changes

## 📱 Pages & Components

### Pages
1. **Home Page** (`/`) - Hero section with project overview and call-to-action
2. **Login Page** (`/login`) - Authentication with X OAuth (currently using mock auth for demo)
3. **Dashboard** (`/dashboard`) - Personal stats, recent activity, and quick actions
4. **Leaderboard** (`/leaderboard`) - Top community members ranked by points
5. **Submit Tweet** (`/submit`) - Form to submit tweets with validation
6. **About** (`/about`) - Project information and community guidelines
7. **FAQ** (`/faq`) - Frequently asked questions with search functionality

### Key Components
- **Navigation**: Responsive navigation with authentication state
- **AuthProvider**: Mock authentication system for development
- **TweetCard**: Display tweet information with engagement metrics
- **PointsProgress**: Circular progress indicators for points tracking
- **LoadingSpinner**: Consistent loading states throughout the app

## 🛠 Tech Stack

- **Frontend**: React 19, Next.js 15, TypeScript
- **Styling**: Tailwind CSS v4, Framer Motion for animations
- **Database**: Prisma ORM with SQLite
- **Forms**: React Hook Form with Zod validation
- **State Management**: Zustand for global state
- **Icons**: Heroicons
- **Authentication**: Mock system (ready for X OAuth integration)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd layeredge-edgen-community
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Update `.env.local` with your configuration:
   ```env
   # Database - Supabase PostgreSQL (already configured)
   DATABASE_URL="postgres://postgres.bzqayhnlogpaxfcmmrlq:d234A879a1%23@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
   DIRECT_URL="postgres://postgres.bzqayhnlogpaxfcmmrlq:d234A879a1%23@aws-0-eu-north-1.pooler.supabase.com:5432/postgres"

   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   TWITTER_CLIENT_ID="your-twitter-client-id"
   TWITTER_CLIENT_SECRET="your-twitter-client-secret"
   TWITTER_BEARER_TOKEN="your-twitter-bearer-token"
   LAYEREDGE_COMMUNITY_URL="https://x.com/i/communities/1890107751621357663"
   ```

4. **Set up the database**
   ```bash
   # Apply database schema to Supabase
   npm run db:push

   # Seed with demo data
   npm run db:seed

   # Verify database setup (optional)
   npm run db:verify
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

The application uses **Supabase PostgreSQL** with Prisma ORM and the following main models:

- **User**: User profiles with points and rankings
- **Tweet**: Submitted tweets with engagement metrics
- **PointsHistory**: Track points awarded over time
- **Account/Session**: Authentication data (NextAuth.js compatible)

### Database Configuration
- **Provider**: Supabase PostgreSQL
- **Region**: EU North (Stockholm) - `aws-0-eu-north-1`
- **Connection Pooling**: Transaction pooler for serverless compatibility
- **IPv4/IPv6**: Dual support for maximum deployment compatibility

For detailed database setup information, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push database schema changes to Supabase
- `npm run db:studio` - Open Prisma Studio
- `npm run db:generate` - Generate Prisma client
- `npm run db:seed` - Seed database with demo data
- `npm run db:verify` - Verify Supabase database setup and connectivity
- `npm run db:migrate` - Deploy migrations (used in production)

### Mock Authentication

For development purposes, the app uses a mock authentication system. Click "Sign in with X" to authenticate as a demo user. In production, this would be replaced with real X OAuth.

## 🪟 Windows-Specific Setup

### Prisma Client Generation Issues

If you encounter file permission errors during Prisma client generation on Windows (EPERM errors when renaming .dll.node files), use these solutions:

#### Quick Fix
```bash
# Use the Windows-specific Prisma generation script
npm run db:generate:windows
```

#### Alternative PowerShell Fix
```bash
# Use PowerShell-based solution
npm run db:generate:windows-ps
```

#### Manual Troubleshooting
1. **Close all IDEs and editors** that might be locking files
2. **Run as Administrator** if permission issues persist
3. **Temporarily disable antivirus** software during build
4. **Clean and reinstall** dependencies:
   ```bash
   npm run clean
   npm install --legacy-peer-deps
   ```

#### Common Windows Issues
- **File Locking**: Windows locks .dll files more aggressively than other platforms
- **Antivirus Interference**: Real-time scanning can prevent file operations
- **Long Path Names**: Ensure your project path isn't too deep
- **Permission Issues**: Some operations require administrator privileges

The build system includes automatic retry logic and multiple fallback strategies specifically designed for Windows environments.

## 🎨 Design System

### Colors
- **Primary**: Blue (#3b82f6)
- **Accent**: Green (#10b981)
- **Background**: Dark (#0a0a0a)
- **Cards**: Dark gray (#111827)
- **Text**: Light (#ededed)

### Components
- Consistent spacing and typography
- Smooth animations with Framer Motion
- Responsive grid layouts
- Card-based design patterns

## 🔮 Future Enhancements

1. **Real X OAuth Integration**: Replace mock auth with actual X API
2. **Real-time Notifications**: WebSocket integration for live updates
3. **Advanced Analytics**: Detailed engagement metrics and charts
4. **Mobile App**: React Native version
5. **Token Integration**: Actual $Edgen token rewards
6. **Community Features**: Comments, reactions, and social features

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For questions or support, please contact the LayerEdge team or open an issue in this repository.
