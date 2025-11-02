# ?? HybridTradeAI Deployment Guide

Complete guide to deploy HybridTradeAI to production.

## Prerequisites

Before deploying, ensure you have:

- ? Node.js 18+ installed
- ? PostgreSQL database (local or cloud)
- ? Redis server (local or cloud)
- ? Stripe account with API keys
- ? OpenAI API key (optional, for AI support)
- ? Git repository
- ? Vercel/Railway/Render account (for deployment)

## ??? Local Development Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd hybridtradeai
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Database (Required)
DATABASE_URL="postgresql://user:password@localhost:5432/hybridtradeai"

# Redis (Required)
REDIS_URL="redis://localhost:6379"

# NextAuth (Required)
NEXTAUTH_SECRET="generate-a-32-character-secret-here"
NEXTAUTH_URL="http://localhost:3000"
JWT_SECRET="another-32-character-secret-here"

# Stripe (Required for payments)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# OpenAI (Optional, for AI support)
OPENAI_API_KEY="sk-..."

# Email (Optional)
RESEND_API_KEY="re_..."

# Admin Credentials (for seeding)
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="SecurePassword123!"
```

### 3. Database Setup

```bash
# Push schema to database
npm run db:push

# Run seeds
npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts
```

### 4. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

### 5. Test Admin Login

- Email: `admin@yourdomain.com` (or the email you set in .env)
- Password: Your `ADMIN_PASSWORD` from .env

## ?? Production Deployment

### Option 1: Vercel (Recommended)

#### Step 1: Prepare Database

Set up a production PostgreSQL database:
- **Vercel Postgres**: Integrated solution
- **Supabase**: Free tier available
- **Neon**: Serverless PostgreSQL
- **Railway**: Easy setup

#### Step 2: Prepare Redis

Set up production Redis:
- **Upstash**: Serverless Redis (free tier)
- **Redis Cloud**: Managed Redis
- **Railway**: Easy Redis setup

#### Step 3: Deploy to Vercel

1. **Push to GitHub**:
```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

2. **Import to Vercel**:
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables (see below)

3. **Environment Variables** (Add in Vercel dashboard):

```env
# Database
DATABASE_URL=<your-production-postgres-url>

# Redis
REDIS_URL=<your-production-redis-url>

# Auth
NEXTAUTH_SECRET=<generate-new-32-char-secret>
NEXTAUTH_URL=https://yourdomain.vercel.app
JWT_SECRET=<generate-new-32-char-secret>

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OpenAI
OPENAI_API_KEY=sk-...

# Email
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com

# Config
MANAGEMENT_FEE_PERCENT=10
AD_PLATFORM_FEE_PERCENT=30
RESERVE_BUFFER_PERCENT=10

# Admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=SecurePassword123!
```

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete

5. **Post-Deployment**:

```bash
# Run database migrations (one-time)
# SSH into Vercel or use Vercel CLI
vercel env pull .env.production.local
npm run db:push

# Seed database
npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts
```

#### Step 4: Configure Stripe Webhooks

1. Go to Stripe Dashboard ? Developers ? Webhooks
2. Add endpoint: `https://yourdomain.vercel.app/api/webhooks/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copy webhook secret and update `STRIPE_WEBHOOK_SECRET` in Vercel

#### Step 5: Set Up Cron Jobs (Profit Distribution)

**Option A: Vercel Cron** (Recommended)

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/admin/profit/distribute",
      "schedule": "0 2 * * 0"
    }
  ]
}
```

**Option B: External Cron Service**

Use services like:
- **Cron-job.org** (free)
- **EasyCron** 
- **Zapier**

Configure to hit: `POST https://yourdomain.vercel.app/api/admin/profit/distribute`
Schedule: Every Sunday at 2:00 AM

Add authentication header with admin token.

### Option 2: Railway

1. **Create Railway Account**: https://railway.app

2. **Add Services**:
   - PostgreSQL database
   - Redis
   - Your Node.js app

3. **Configure Environment**:
   - Add all environment variables from Vercel guide above
   - Railway auto-provides DATABASE_URL and REDIS_URL

4. **Deploy**:
   - Connect GitHub repository
   - Railway will auto-deploy on push

5. **Run Migrations**:
```bash
railway run npm run db:push
railway run npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts
```

### Option 3: Docker Deployment

#### Dockerfile

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:password@db:5432/hybridtradeai
      REDIS_URL: redis://redis:6379
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: hybridtradeai
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

Deploy:
```bash
docker-compose up -d
```

## ?? Production Security Checklist

### Before Going Live:

- [ ] Change all default passwords
- [ ] Use strong, unique secrets for NEXTAUTH_SECRET and JWT_SECRET
- [ ] Enable HTTPS (handled automatically by Vercel/Railway)
- [ ] Configure proper CORS settings
- [ ] Set up rate limiting (already implemented)
- [ ] Enable Prisma connection pooling
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Configure backup strategy for database
- [ ] Set up SSL for Redis connection
- [ ] Enable 2FA for admin accounts (future feature)
- [ ] Review and test all API endpoints
- [ ] Set up error tracking
- [ ] Configure log aggregation
- [ ] Test webhook handling
- [ ] Verify email sending works
- [ ] Test payment flows end-to-end

## ?? Post-Deployment Testing

### 1. Test User Flow

```bash
# Register new user
curl -X POST https://yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!Test",
    "name": "Test User"
  }'

# Login
curl -X POST https://yourdomain.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!Test"
  }'
```

### 2. Test Admin Functions

- Login as admin
- Navigate to `/admin`
- Try approving/rejecting deposits
- Manually trigger profit distribution
- Create ad tasks

### 3. Test Real-Time Notifications

- Open dashboard in two browser tabs
- Perform an action in one tab
- Verify notification appears in other tab

### 4. Test Stripe Integration

- Create test deposit
- Use Stripe test card: 4242 4242 4242 4242
- Verify webhook handling

## ?? Maintenance Tasks

### Daily
- Monitor error logs
- Check pending deposits

### Weekly
- Verify profit distribution ran successfully
- Review transaction logs
- Check system performance

### Monthly
- Database backup verification
- Security updates (npm audit)
- Review user feedback
- Clean up old notifications:
```bash
npm run cleanup:notifications
```

## ?? Scaling Considerations

### When to Scale:

**Vertical Scaling** (Increase resources):
- Database: Upgrade to higher tier when queries slow down
- Redis: Upgrade when memory usage > 80%
- App: Increase server resources when CPU > 70%

**Horizontal Scaling**:
- Add more app instances behind load balancer
- Use Redis Cluster for high traffic
- Implement database read replicas
- Add CDN for static assets

### Performance Optimization:

1. **Database**:
   - Add indexes for frequently queried fields
   - Use connection pooling (already configured)
   - Implement caching for expensive queries

2. **Redis**:
   - Set TTL on cached data
   - Use Redis pipelines for bulk operations
   - Monitor memory usage

3. **Application**:
   - Enable Next.js caching
   - Optimize images (use next/image)
   - Implement lazy loading
   - Use React.memo for expensive components

## ?? Troubleshooting

### Database Connection Issues

```bash
# Test connection
npx prisma db execute --stdin <<< "SELECT 1"

# Reset database (DANGER: deletes all data)
npx prisma migrate reset
```

### Redis Connection Issues

```bash
# Test Redis locally
redis-cli ping

# Check connection in app logs
# Look for "? Redis Client Connected"
```

### Build Failures

```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npx tsc --noEmit
```

### Webhook Not Working

1. Check Stripe webhook secret matches
2. Verify endpoint URL is correct
3. Check Vercel logs for errors
4. Test with Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## ?? Support

For deployment issues:
- Check logs: `vercel logs` or Railway logs
- Review GitHub Issues
- Contact: dev@hybridtradeai.com

## ?? Success!

Your HybridTradeAI platform is now live! 

Next steps:
1. Monitor initial user signups
2. Test all critical flows
3. Set up analytics (Google Analytics, Mixpanel)
4. Configure monitoring alerts
5. Plan feature roadmap

---

**Important**: This is a financial platform. Always test thoroughly in a staging environment before deploying changes to production.
