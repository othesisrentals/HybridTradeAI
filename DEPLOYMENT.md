# HybridTradeAI - Deployment Guide

Complete deployment guide for production environment.

## Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database (recommended: Supabase, Railway, or Neon)
- Redis instance (recommended: Upstash, Railway, or Redis Cloud)
- Domain name with SSL certificate
- Stripe account for payments
- Google AdMob account for ad tasks

## Environment Setup

1. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

2. Fill in all required environment variables:

```bash
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# Redis
REDIS_URL="redis://user:password@host:6379"

# Authentication
NEXTAUTH_SECRET="generate-32-character-secret"
NEXTAUTH_URL="https://yourdomain.com"
JWT_SECRET="generate-32-character-secret"

# Payments (Stripe)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Ad Networks
ADMOB_APP_ID="ca-app-pub-..."
ADMOB_AD_UNIT_ID="ca-app-pub-..."
ADMOB_API_KEY="..."

# Email (Resend)
RESEND_API_KEY="re_..."

# AI
OPENAI_API_KEY="sk-..."

# App Configuration
NEXT_PUBLIC_APP_NAME="HybridTradeAI"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NODE_ENV="production"
```

### Generating Secrets

```bash
# Generate NEXTAUTH_SECRET and JWT_SECRET
openssl rand -base64 32
```

## Database Setup

1. **Run Prisma migrations:**

```bash
npm run db:migrate
```

2. **Seed initial data:**

```bash
npm run db:seed
```

This creates:
- Revenue streams
- Investment plans (Starter, Pro, Elite)
- Admin user (email: `admin@hybridtradeai.com`, password: `admin123`)
- Sample ad tasks
- Reserve buffer

?? **IMPORTANT:** Change admin password immediately after first login!

## Deployment Platforms

### Vercel (Recommended)

1. **Install Vercel CLI:**

```bash
npm i -g vercel
```

2. **Deploy:**

```bash
vercel
```

3. **Set environment variables** in Vercel dashboard

4. **Configure PostgreSQL and Redis** addons or external services

5. **Run migrations** after deployment:

```bash
vercel env pull .env.local
npm run db:migrate
npm run db:seed
```

### Railway

1. **Connect GitHub repository** to Railway

2. **Add PostgreSQL** service and copy connection string

3. **Add Redis** service and copy connection string

4. **Set environment variables** in Railway dashboard

5. **Deploy** - Railway will auto-detect Next.js

6. **Run migrations** via Railway CLI or dashboard shell:

```bash
railway run npm run db:migrate
railway run npm run db:seed
```

### Docker Deployment

1. **Create Dockerfile:**

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run db:generate
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

2. **Update next.config.js:**

```javascript
const nextConfig = {
  output: 'standalone',
  // ... rest of config
}
```

3. **Build and run:**

```bash
docker build -t hybridtradeai .
docker run -p 3000:3000 --env-file .env.local hybridtradeai
```

## Cron Jobs

Set up automated tasks:

### Weekly Profit Distribution

Run every Sunday at 2 AM UTC:

```bash
# Using cron (Linux/Mac)
0 2 * * 0 curl -X POST https://yourdomain.com/api/admin/profit/distribute \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY"
```

Or use Vercel Cron Jobs:

```json
// vercel.json
{
  "crons": [{
    "path": "/api/admin/profit/distribute",
    "schedule": "0 2 * * 0"
  }]
}
```

### Auto-Investment

Should run automatically after deposit approval, but can be triggered manually:

```bash
curl -X POST https://yourdomain.com/api/admin/auto-invest \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY"
```

## Stripe Webhook Setup

1. **Create webhook endpoint** in Stripe Dashboard:
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

2. **Copy webhook secret** to `STRIPE_WEBHOOK_SECRET`

3. **Test webhook** using Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong secrets (32+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Set up rate limiting (Vercel Pro or Cloudflare)
- [ ] Configure CORS properly
- [ ] Enable database backups
- [ ] Set up monitoring (Sentry recommended)
- [ ] Configure firewall rules
- [ ] Review and test all admin endpoints
- [ ] Enable 2FA for admin accounts (future enhancement)

## Monitoring & Maintenance

### Database Backups

- **Supabase:** Automatic daily backups
- **Railway:** Configure in dashboard
- **Self-hosted:** Set up pg_dump cron job

### Monitoring

1. **Application Monitoring:**
   - Sentry for error tracking
   - Vercel Analytics for performance

2. **Database Monitoring:**
   - PostgreSQL slow query logs
   - Connection pool monitoring

3. **Redis Monitoring:**
   - Memory usage
   - Connection count
   - Pub/sub message throughput

### Health Checks

Create health check endpoint:

```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    await redis.ping()
    return Response.json({ status: 'ok' })
  } catch (error) {
    return Response.json({ status: 'error' }, { status: 500 })
  }
}
```

## Scaling Considerations

1. **Database:**
   - Use connection pooling (PgBouncer)
   - Add read replicas for heavy queries
   - Index frequently queried fields

2. **Redis:**
   - Use Redis Cluster for high availability
   - Set up replication

3. **Application:**
   - Use CDN for static assets
   - Enable edge caching where possible
   - Consider serverless functions for heavy workloads

## Troubleshooting

### Common Issues

1. **Database connection errors:**
   - Check DATABASE_URL format
   - Verify network access
   - Check connection pool limits

2. **Redis connection errors:**
   - Verify REDIS_URL format
   - Check Redis server status
   - Verify network access

3. **SSE notifications not working:**
   - Check Redis pub/sub connections
   - Verify channel names match
   - Check browser console for errors

4. **Profit distribution not running:**
   - Verify cron job is configured
   - Check admin API key
   - Review server logs

## Support

For issues or questions:
- Check application logs
- Review database query logs
- Monitor Redis pub/sub channels
- Check API response times

## Post-Deployment

1. Test all user flows
2. Verify admin panel access
3. Test payment integration
4. Verify notification system
5. Test profit distribution (dry run first)
6. Monitor error rates
7. Set up alerts for critical errors
