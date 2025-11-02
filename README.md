# ?? HybridTradeAI - AI-Powered Investment Platform

A complete, production-ready investment platform with real-time notifications, AdMob task system, AI support, and automated profit distribution.

## ?? Features

### Core Features
- **Investment System**: Three investment plans (Starter, Pro, Elite) with dynamic ROI ranges
- **Automated Profit Distribution**: Weekly profit distribution with 10% management fee
- **Real-Time Notifications**: SSE with Redis pub/sub for live updates
- **AdMob Task System**: Video ads, surveys, app installs with 30% platform commission
- **AI Support**: Company-knowledgeable AI assistant for user support
- **Admin Control Panel**: Complete admin workflows for deposit/withdrawal approval, KYC management

### Security & Compliance
- KYC verification system with admin approval
- Reserve buffer system (10% of AUM)
- Audit logging for all financial actions
- Rate limiting on critical endpoints
- Separate balances: Invested (locked) vs Withdrawal (profits only)

## ??? Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Next.js API Routes, Prisma, PostgreSQL, Redis
- **Authentication**: NextAuth with role-based access
- **Real-time**: Server-Sent Events (SSE), Redis pub/sub
- **Payments**: Stripe integration
- **AI**: OpenAI for support system

## ?? Installation

### Prerequisites
- Node.js 18+ and npm 9+
- PostgreSQL database
- Redis server
- Stripe account (for payments)
- OpenAI API key (for AI support)

### Setup Steps

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd hybridtradeai
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:
- Database URL (PostgreSQL)
- Redis URL
- NextAuth secrets
- Stripe keys
- OpenAI API key
- etc.

4. **Set up the database**
```bash
# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate

# Seed initial data
npx ts-node scripts/seedPlans.ts
npx ts-node scripts/initRevenueStreams.ts
```

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## ?? Project Structure

```
hybridtradeai/
??? prisma/
?   ??? schema.prisma          # Database schema
??? src/
?   ??? app/
?   ?   ??? api/              # API routes
?   ?   ??? (auth)/           # Auth pages
?   ?   ??? dashboard/        # User dashboard
?   ?   ??? admin/            # Admin panel
?   ?   ??? layout.tsx
?   ??? lib/
?   ?   ??? auth/             # Authentication utilities
?   ?   ??? db/               # Prisma client
?   ?   ??? redis/            # Redis connection
?   ?   ??? notifications/    # Notification service
?   ?   ??? profit/           # Profit distribution engine
?   ?   ??? investment/       # Investment service
?   ?   ??? ads/              # AdMob service
?   ?   ??? ai/               # AI support service
?   ??? components/
?   ?   ??? ui/               # shadcn/ui components
?   ?   ??? dashboard/        # Dashboard components
?   ?   ??? admin/            # Admin components
?   ??? hooks/                # Custom React hooks
??? scripts/
?   ??? seedPlans.ts          # Seed investment plans
?   ??? initRevenueStreams.ts # Initialize revenue streams
?   ??? cleanupNotifications.ts
??? package.json
```

## ?? Deployment

### Vercel Deployment

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Deploy to Vercel**
- Import your repository in Vercel
- Add environment variables
- Deploy

3. **Set up cron jobs** (for profit distribution)
- Use Vercel Cron or external service
- Configure to hit `/api/admin/profit/distribute` weekly

### Railway/Render Deployment

1. **Database**: Set up PostgreSQL on Railway/Render
2. **Redis**: Set up Redis instance
3. **Deploy**: Connect your GitHub repo and deploy
4. **Environment**: Add all environment variables
5. **Migrations**: Run `npm run db:push` after deployment

## ?? Configuration

### Investment Plans

Edit plans in `scripts/seedPlans.ts`:
- Starter: $100 - $5,000 (5-12% weekly ROI)
- Pro: $5,000 - $50,000 (8-18% weekly ROI)
- Elite: $50,000+ (12-25% weekly ROI)

### Revenue Streams

Configure in `scripts/initRevenueStreams.ts`:
- Algorithmic Trading: 40%
- Crypto Staking: 25%
- Copy-trading: 15%
- Advertising: 20%

### Profit Distribution

- **Schedule**: Weekly (Sunday 2 AM)
- **Management Fee**: 10% of profits
- **Calculation**: Random ROI within plan range

## ?? Admin Operations

### Creating Admin User

```typescript
// Update user role in database
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

### Manual Profit Distribution

Trigger manually via API:
```bash
POST /api/admin/profit/distribute
Authorization: Bearer <admin-token>
```

### Approving Deposits

1. Navigate to `/admin/deposits`
2. Review pending deposits
3. Approve or reject with reason

## ?? Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **API Keys**: Rotate keys regularly
3. **Database**: Use connection pooling and prepared statements
4. **Redis**: Secure with password
5. **Rate Limiting**: Implement on all public endpoints
6. **KYC**: Require for withdrawals over threshold
7. **Audit Logs**: Review regularly

## ?? Testing

```bash
# Run linter
npm run lint

# Type checking
npx tsc --noEmit

# Database studio
npm run db:studio
```

## ?? API Documentation

### User Endpoints

- `POST /api/auth/register` - Register new user
- `GET /api/user/profile` - Get user profile
- `GET /api/user/investments` - Get user investments
- `POST /api/user/investments` - Create deposit request
- `GET /api/user/transactions` - Get transaction history
- `GET /api/user/ad-tasks` - Get available ad tasks
- `POST /api/user/ad-tasks/:id/complete` - Complete ad task

### Admin Endpoints

- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/deposits/pending` - Pending deposits
- `POST /api/admin/deposits/:id/approve` - Approve deposit
- `POST /api/admin/deposits/:id/reject` - Reject deposit
- `POST /api/admin/profit/distribute` - Trigger profit distribution

### Notification Endpoints

- `GET /api/notifications/stream` - SSE stream
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read

## ?? Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## ?? License

This project is proprietary and confidential.

## ?? Support

For support, email support@hybridtradeai.com or join our Slack channel.

## ?? Roadmap

- [ ] Mobile app (React Native)
- [ ] Multi-currency support
- [ ] Advanced analytics dashboard
- [ ] Social trading features
- [ ] Referral program enhancements
- [ ] Two-factor authentication
- [ ] Withdrawal automation
- [ ] Advanced KYC with document verification AI

## ?? Disclaimer

Investment involves risk. This platform is for educational/demonstration purposes. Always consult with financial advisors before making investment decisions.

---

Built with ?? by the HybridTradeAI Team
