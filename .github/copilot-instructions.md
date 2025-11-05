# HybridTradeAI Copilot Instructions

## System Architecture

**Investment Platform Stack**: Next.js 14 + Prisma + PostgreSQL + Redis + NextAuth
- **Real-time system**: Server-Sent Events (SSE) with Redis pub/sub for cross-tab notification sync
- **Financial operations**: Dual-balance system (invested=locked, withdrawal=profits) with automated weekly profit distribution
- **Auth flow**: NextAuth with role-based access (USER/ADMIN/SUPER_ADMIN) + KYC verification gates

## Critical Domain Knowledge

### Investment Flow & Timing
```typescript
// Weekly profit runs every Sunday 2AM UTC via cron
// Investment hierarchy: STARTER ($100-5K) → PRO ($5K-50K) → ELITE ($50K-500K)
// ROI ranges: Starter(5-12%), Pro(8-18%), Elite(12-25%) per week
// All profits go to withdrawalBalance only, never re-invested automatically
```

### Database Transaction Patterns
**Always use `dbTransaction` wrapper for financial operations**:
```typescript
import { dbTransaction } from '@/lib/db/transactions'

await dbTransaction(async (tx) => {
  // Multiple related operations here
  await updateUserBalances(userId, { withdrawalBalance: { increment: amount }})
})
```

### Real-time Notifications
**SSE implementation with Redis channels**:
- User-specific: `user:${userId}:notifications`  
- Broadcast: `broadcast:notifications`
- Includes heartbeat (30s) and cross-tab synchronization
- Service layer: `NotificationService.create()` auto-broadcasts

### API Route Patterns
**Standard structure for authenticated endpoints**:
```typescript
// Always start with session check
const session = await getServerSession(authOptions)
if (!session?.user) return new Response('Unauthorized', { status: 401 })

// Role-based access for admin routes
if (session.user.role !== 'ADMIN') return new Response('Forbidden', { status: 403 })
```

## Directory Structure & File Conventions

```
src/lib/               # Service layer - always use these
├── auth/config.ts     # NextAuth configuration
├── db/transactions.ts # Financial transaction wrappers
├── notifications/     # NotificationService + SSE logic  
├── profit/           # Weekly distribution engine
└── redis/client.ts   # Redis pub/sub + connection management

src/app/api/          # API routes follow domain structure
├── admin/            # Role-gated admin operations
├── user/             # User-specific operations
└── notifications/sse/ # Real-time SSE endpoint
```

## Development Workflows

### Local Development
```bash
npm run dev                    # Start dev server
npm run db:generate           # Generate Prisma client after schema changes
npm run db:migrate           # Apply schema migrations  
npm run db:seed              # Seed with plans + admin user (admin@hybridtradeai.com:admin123)
```

### Testing Financial Operations
**Use the profit distribution engine**:
```typescript
import { distributeWeeklyProfits } from '@/lib/profit/distribution'
const results = await distributeWeeklyProfits() // Test profit calculation
```

## Integration Points & External Systems

**AdMob Task System**: 70/30 revenue split (user/platform)
**Stripe Integration**: Payment processing with webhook verification
**OpenAI API**: AI support system with conversation history
**KYC Verification**: Required before investment activation
**Redis Pub/Sub**: Powers all real-time features (notifications, admin broadcasts)

## Security & Financial Safeguards

- **Reserve Buffer System**: 10% of Assets Under Management (AUM) maintained
- **Audit Logging**: All financial operations logged in `AuditLog` model
- **KYC Gates**: Investment activation requires `kycStatus: 'APPROVED'`
- **Admin Approval Flow**: Deposits/withdrawals require admin approval
- **Balance Segregation**: Invested funds locked, only profits withdrawable

## Common Patterns to Follow

1. **Always use service layer**: `NotificationService`, `dbTransaction()`, etc.
2. **Financial operations**: Wrap in transactions, update audit logs, send notifications
3. **Real-time updates**: Use Redis pub/sub channels, not direct database polling
4. **Admin operations**: Check role permissions, log actions, validate KYC status
5. **API responses**: Return structured JSON with proper HTTP status codes