# HybridTradeAI Architecture

## System Overview

HybridTradeAI is a production-ready investment platform built with Next.js 14, Prisma, PostgreSQL, and Redis. The system implements a complete investment workflow with real-time notifications, automated profit distribution, and comprehensive admin controls.

## Core Components

### 1. Database Layer (Prisma + PostgreSQL)

**Models:**
- `User` - User accounts with roles, balances, and KYC status
- `Plan` - Investment plans (Starter, Pro, Elite)
- `Investment` - Active investments linked to plans
- `Transaction` - All financial transactions (deposits, withdrawals, profits)
- `ProfitHistory` - Weekly profit distribution records
- `RevenueStream` - Revenue source tracking
- `PlanAllocation` - Plan-to-revenue-stream mappings
- `Notification` - User notifications with SSE support
- `AdTask` - Ad task definitions
- `AdTaskCompletion` - User ad task completions
- `KYCDocument` - KYC verification documents
- `AIConversation` & `AIMessage` - AI support chat
- `AuditLog` - Compliance and audit trail
- `ReserveBuffer` - Reserve fund management

**Key Features:**
- Atomic transactions for all financial operations
- Proper indexing for performance
- Audit logging for compliance
- JSON fields for flexible metadata storage

### 2. Authentication & Authorization (NextAuth)

**Providers:**
- Credentials (email/password)
- Extensible for OAuth providers

**Roles:**
- `USER` - Standard user
- `ADMIN` - Admin privileges
- `SUPER_ADMIN` - Full system access

**Session Management:**
- JWT-based sessions
- Server-side session validation
- Role-based access control (RBAC)

### 3. Real-Time Notification System (SSE + Redis)

**Architecture:**
- Server-Sent Events (SSE) for browser push
- Redis pub/sub for cross-server communication
- Cross-tab synchronization via shared Redis channels

**Channels:**
- `user:{userId}:notifications` - User-specific notifications
- `broadcast:notifications` - Admin broadcasts to all users

**Notification Types:**
- Investment approvals
- Profit distributions
- Deposit/withdrawal status
- KYC verification updates
- Admin broadcasts
- Ad task completions

### 4. Investment Engine

**Workflow:**
1. User creates deposit request
2. Admin approves deposit
3. Auto-investment system invests approved deposits
4. Weekly profit distribution (automated)
5. Profits credited to withdrawal balance

**Profit Distribution:**
- Runs weekly (Sunday 2 AM UTC)
- Random ROI within plan ranges
- 10% management fee deducted
- Atomic transactions ensure consistency

**Balance Management:**
- `investedBalance` - Locked investment amount
- `withdrawalBalance` - Available profits for withdrawal
- `totalEarnings` - Lifetime earnings tracking

### 5. AdMob Task System

**Task Types:**
- Video ads
- Surveys
- App installs
- Offer walls

**Economics:**
- User earns 70% of ad revenue
- Platform keeps 30% commission
- Daily limits per user
- Plan-based access to premium tasks

**Verification:**
- Automatic for simple tasks
- Manual admin verification for complex tasks
- Proof upload support

### 6. AI Support System

**Features:**
- Company knowledge base integration
- User portfolio context awareness
- Personalized responses
- Conversation history
- GPT-4 powered

**Knowledge Base Includes:**
- Investment plan details
- Revenue stream information
- Withdrawal procedures
- KYC requirements
- Ad task system details

### 7. Payment Integration (Stripe)

**Flow:**
1. User initiates deposit
2. Stripe PaymentIntent created
3. Webhook handles payment success/failure
4. Transaction status updated
5. User balance credited

**Webhook Events:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

## API Architecture

### Endpoint Structure

```
/api/
??? auth/[...nextauth]          # NextAuth endpoints
??? user/
?   ??? deposit                 # Create deposit
?   ??? withdraw                # Create withdrawal
?   ??? investments             # Get user investments
??? admin/
?   ??? transactions/
?   ?   ??? pending             # Get pending transactions
?   ?   ??? approve             # Approve/reject transaction
?   ??? kyc/approve             # Approve/reject KYC
?   ??? broadcast               # Send broadcast notification
?   ??? profit/distribute       # Trigger profit distribution
?   ??? auto-invest             # Trigger auto-investment
?   ??? ads/verify              # Verify ad task completion
??? notifications/
?   ??? /                       # Get/update notifications
?   ??? sse                     # SSE stream endpoint
??? ads/
?   ??? tasks                   # Get available tasks
?   ??? complete                # Complete ad task
??? ai/
?   ??? conversations/[...]     # AI chat endpoints
??? webhooks/
    ??? stripe                  # Stripe webhook handler
```

## Data Flow

### Deposit Flow
```
User ? POST /api/user/deposit
     ? Transaction created (PENDING)
     ? Admin approves ? Transaction (APPROVED)
     ? Auto-investment triggered
     ? Investment created (ACTIVE)
     ? User balance updated
```

### Profit Distribution Flow
```
Cron Job ? POST /api/admin/profit/distribute
        ? Get all active investments
        ? Calculate weekly profit (random ROI)
        ? Deduct management fee
        ? Credit withdrawal balance
        ? Create ProfitHistory record
        ? Send notification
```

### Notification Flow
```
Event ? createNotification()
     ? Save to database
     ? Publish to Redis channel
     ? SSE endpoint receives
     ? Browser displays notification
```

## Security Measures

1. **Financial Operations:**
   - All balance updates use atomic transactions
   - Negative balance prevention
   - Audit logging for all financial actions

2. **Authentication:**
   - Password hashing with bcrypt
   - JWT-based sessions
   - Role-based access control

3. **API Security:**
   - Input validation with Zod
   - Admin endpoint protection
   - Rate limiting (recommended)

4. **KYC Compliance:**
   - Required for investments
   - Document verification
   - Admin approval workflow

## Scalability Considerations

1. **Database:**
   - Connection pooling (PgBouncer recommended)
   - Read replicas for heavy queries
   - Proper indexing strategy

2. **Redis:**
   - Redis Cluster for high availability
   - Pub/sub for real-time features
   - Caching for frequently accessed data

3. **Application:**
   - Serverless functions (Vercel)
   - Edge caching where possible
   - CDN for static assets

## Monitoring & Observability

1. **Application Monitoring:**
   - Error tracking (Sentry)
   - Performance monitoring
   - API response times

2. **Database Monitoring:**
   - Slow query logs
   - Connection pool metrics
   - Query performance

3. **Redis Monitoring:**
   - Memory usage
   - Connection count
   - Pub/sub throughput

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide.

**Recommended Platforms:**
- Vercel (frontend + API routes)
- Railway (PostgreSQL + Redis)
- Supabase (PostgreSQL alternative)
- Upstash (Redis alternative)

## Future Enhancements

1. **Multi-currency Support:**
   - FX API integration
   - Currency conversion
   - Multi-currency balances

2. **Advanced Analytics:**
   - Portfolio performance tracking
   - Revenue stream analytics
   - User behavior insights

3. **Mobile App:**
   - React Native app
   - Push notifications
   - Mobile-optimized UI

4. **Additional Features:**
   - Referral system enhancement
   - Staking rewards
   - NFT integration
   - DeFi yield farming
