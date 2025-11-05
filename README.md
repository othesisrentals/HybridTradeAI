# HybridTradeAI ??

A complete, production-ready investment platform with real-time notifications, AdMob task system, AI support, and automated profit distribution.

## ? Features

### Core Investment System
- **Three Investment Plans** (Starter, Pro, Elite) with dynamic ROI ranges
- **Admin-approved deposits** ? Auto-investment ? Weekly profit distribution
- **Separate balances**: Invested (locked) vs Withdrawal (profits only)
- **KYC verification system** with admin approval

### Real-Time Notifications
- **Server-Sent Events (SSE)** with Redis pub/sub for live updates
- **Cross-tab synchronization** with leader election
- **Notification bell and center** with filtering
- **Admin broadcast capabilities**

### AdMob Task System
- Video ads, surveys, app installs, offer walls
- **30% platform commission** on ad earnings
- Daily limits and cooldown periods
- Plan-based task access (Elite gets premium tasks)

### AI Support System
- Company-knowledgeable AI assistant
- Personalized profit estimates
- Investment guidance and status updates
- Real-time portfolio analytics

### Admin Control Panel
- Deposit/withdrawal approval workflows
- KYC verification management
- Revenue stream performance tracking
- Reserve buffer management
- Ad task creation and management

## ??? Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Next.js API Routes, Prisma, PostgreSQL, Redis, NextAuth
- **Real-time**: Server-Sent Events (SSE), Redis pub/sub
- **Payments**: Stripe integration
- **Ads**: Google AdMob, Unity Ads, IronSource
- **AI**: OpenAI GPT-4 for support system

## ?? Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database
- Redis instance
- Stripe account
- Google AdMob account (optional)

## ?? Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd hybridtradeai
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `NEXTAUTH_SECRET` - 32-character secret (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Your app URL (e.g., `http://localhost:3000`)
- `STRIPE_SECRET_KEY` - Stripe secret key
- `OPENAI_API_KEY` - OpenAI API key for AI support

See `.env.example` for all required variables.

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed initial data (creates plans, admin user, etc.)
npm run db:seed
```

**Default Admin Credentials:**
- Email: `admin@hybridtradeai.com`
- Password: `Admin123!`

?? **Change the admin password immediately after first login!**

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## ?? Project Structure

```
hybridtradeai/
??? prisma/
?   ??? schema.prisma          # Complete database schema
??? src/
?   ??? app/
?   ?   ??? api/               # API routes
?   ?   ?   ??? auth/          # Authentication
?   ?   ?   ??? admin/         # Admin endpoints
?   ?   ?   ??? user/          # User endpoints
?   ?   ?   ??? notifications/ # Notification SSE
?   ?   ?   ??? ads/           # Ad task endpoints
?   ?   ?   ??? ai/            # AI support endpoints
?   ?   ??? (auth)/            # Auth pages
?   ?   ??? (public)/          # Public pages
?   ?   ??? admin/             # Admin dashboard
?   ?   ??? dashboard/         # User dashboard
?   ?   ??? layout.tsx
?   ??? lib/
?   ?   ??? db/                # Database utilities
?   ?   ??? redis/             # Redis client
?   ?   ??? auth/              # NextAuth config
?   ?   ??? notifications/     # Notification system
?   ?   ??? profit/             # Profit distribution
?   ?   ??? ads/               # AdMob system
?   ?   ??? ai/                # AI support
?   ??? components/            # React components
??? scripts/
?   ??? seed.ts               # Database seed script
??? DEPLOYMENT.md             # Deployment guide
```

## ?? Investment Plans

### Starter Plan
- **Minimum**: $100
- **Maximum**: $5,000
- **ROI Range**: 5-12% per week
- **Duration**: 12 weeks
- **Management Fee**: 10% of profits

### Pro Plan
- **Minimum**: $5,000
- **Maximum**: $50,000
- **ROI Range**: 8-18% per week
- **Duration**: 12 weeks
- **Management Fee**: 10% of profits
- **Premium Features**: Premium ad tasks

### Elite Plan
- **Minimum**: $50,000
- **Maximum**: $500,000
- **ROI Range**: 12-25% per week
- **Duration**: 12 weeks
- **Management Fee**: 10% of profits
- **Premium Features**: Premium ad tasks, priority support

## ?? Revenue Streams

- **Algorithmic Trading**: 40% allocation
- **Crypto Staking**: 25% allocation
- **Copy Trading**: 15% allocation
- **Advertising & Tasks**: 20% allocation
- **Management Fees**: 10% of all profits

## ?? Profit Distribution

- **Weekly automated runs** (Sunday 2 AM UTC)
- **Random ROI** within plan ranges
- **10% management fee** on all profits
- **Profits go to withdrawal balance** only

## ?? Notification System

Real-time notifications via Server-Sent Events:
- Investment approvals
- Profit distributions
- Deposit/withdrawal status
- KYC verification updates
- Admin broadcasts
- Ad task completions

## ?? Ad Task System

- **User earns 70%** of ad revenue
- **Platform keeps 30%** commission
- **Daily limits** per user
- **Plan-based access** to premium tasks
- **Verification required** for some tasks

## ?? AI Support

- Company knowledge base integration
- Personalized responses based on user portfolio
- Investment guidance
- Profit estimates
- Real-time status updates

## ?? Security Features

- KYC/AML verification required for investments
- Reserve buffer system (10% of AUM)
- Withdrawal limits and admin approval
- Audit logging for all financial actions
- Rate limiting on critical endpoints
- Input validation with Zod schemas

## ?? Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide.

### Quick Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Setup Cron Jobs

Weekly profit distribution (Sunday 2 AM UTC):

```bash
# Vercel Cron (vercel.json)
{
  "crons": [{
    "path": "/api/admin/profit/distribute",
    "schedule": "0 2 * * 0"
  }]
}
```

## ?? API Documentation

### User Endpoints

- `POST /api/user/deposit` - Create deposit request
- `POST /api/user/withdraw` - Create withdrawal request
- `GET /api/user/investments` - Get user investments

### Admin Endpoints

- `GET /api/admin/transactions/pending` - Get pending transactions
- `POST /api/admin/transactions/approve` - Approve/reject transaction
- `POST /api/admin/broadcast` - Send broadcast notification
- `POST /api/admin/kyc/approve` - Approve/reject KYC
- `POST /api/admin/profit/distribute` - Trigger profit distribution
- `POST /api/admin/ads/verify` - Verify ad task completion

### Notification Endpoints

- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/sse` - SSE stream for real-time updates
- `PATCH /api/notifications` - Mark notification as read

### Ad Task Endpoints

- `GET /api/ads/tasks` - Get available ad tasks
- `POST /api/ads/complete` - Complete ad task

### AI Support Endpoints

- `GET /api/ai/conversations` - Get user conversations
- `POST /api/ai/conversations` - Create new conversation
- `GET /api/ai/conversations/[id]` - Get conversation
- `POST /api/ai/conversations/[id]` - Send message

## ?? Development

### Database Management

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# Create migration
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Seed database
npm run db:seed
```

### Code Quality

```bash
# Lint
npm run lint

# Type check
npx tsc --noEmit
```

## ?? Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` format
- Check network access
- Verify database is running

### Redis Connection Issues
- Verify `REDIS_URL` format
- Check Redis server status
- Verify network access

### SSE Notifications Not Working
- Check Redis pub/sub connections
- Verify channel names match
- Check browser console for errors

## ?? License

MIT

## ?? Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## ?? Support

For issues or questions:
- Check application logs
- Review database query logs
- Monitor Redis pub/sub channels
- Check API response times

---

Built with ?? using Next.js 14, Prisma, PostgreSQL, and Redis
