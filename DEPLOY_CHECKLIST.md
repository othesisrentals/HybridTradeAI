# ?? Deployment Checklist

Quick checklist for deploying HybridTradeAI to production.

## Pre-Deployment

### 1. Environment Setup
- [ ] Copy `.env.example` to `.env.local`
- [ ] Fill in all required environment variables
- [ ] Generate secure secrets:
  ```bash
  openssl rand -base64 32  # For NEXTAUTH_SECRET and JWT_SECRET
  ```

### 2. Database Setup
- [ ] Create PostgreSQL database (Supabase/Railway/Neon)
- [ ] Copy database connection string
- [ ] Test database connection locally
- [ ] Run migrations: `npm run db:migrate`
- [ ] Seed database: `npm run db:seed`

### 3. Redis Setup
- [ ] Create Redis instance (Upstash/Railway/Redis Cloud)
- [ ] Copy Redis connection string
- [ ] Test Redis connection locally

### 4. Third-Party Services
- [ ] Stripe account configured
- [ ] Stripe webhook endpoint set up
- [ ] OpenAI API key obtained
- [ ] Resend API key obtained (optional)
- [ ] AdMob account configured (optional)

## Deployment Steps

### Option A: Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import GitHub repository
   - Add all environment variables
   - Deploy

3. **Post-Deployment**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Pull env vars
   vercel env pull .env.local
   
   # Run migrations
   npx prisma migrate deploy
   
   # Seed database
   npm run db:seed
   ```

### Option B: Railway

1. **Connect Repository**
   - Go to [railway.app](https://railway.app)
   - Create new project
   - Connect GitHub repository

2. **Add Services**
   - Add PostgreSQL database
   - Add Redis database
   - Configure environment variables

3. **Deploy**
   - Railway auto-deploys on push
   - Run migrations: `railway run npx prisma migrate deploy`
   - Seed: `railway run npm run db:seed`

### Option C: Docker

1. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

2. **Deploy**
   ```bash
   docker-compose up -d
   docker-compose exec app npx prisma migrate deploy
   docker-compose exec app npm run db:seed
   ```

## Post-Deployment

### 1. Verify Deployment
- [ ] Application loads correctly
- [ ] Health check: `curl https://your-domain.com/api/health`
- [ ] Test authentication (sign in/sign up)
- [ ] Test admin login (default: admin@hybridtradeai.com / admin123)
- [ ] **CHANGE ADMIN PASSWORD IMMEDIATELY**

### 2. Database Verification
- [ ] All tables created
- [ ] Plans seeded correctly
- [ ] Admin user exists
- [ ] Revenue streams initialized

### 3. Functionality Tests
- [ ] User registration works
- [ ] Authentication works
- [ ] Dashboard loads
- [ ] Deposit creation works
- [ ] Admin panel accessible
- [ ] Notifications working (SSE)
- [ ] AI chat working

### 4. Security Checklist
- [ ] HTTPS enabled
- [ ] Admin password changed
- [ ] Environment variables secured
- [ ] CORS configured
- [ ] Rate limiting enabled (if available)

### 5. Cron Jobs
- [ ] Profit distribution scheduled (Sunday 2 AM UTC)
- [ ] Cron job monitoring set up

### 6. Monitoring
- [ ] Error tracking configured (Sentry)
- [ ] Logging set up
- [ ] Uptime monitoring configured
- [ ] Database backup scheduled

## Quick Commands

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Database
npm run db:migrate    # Run migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio

# Deployment prep
./scripts/deploy.sh  # Run deployment script
```

## Environment Variables Checklist

Required:
- [ ] DATABASE_URL
- [ ] REDIS_URL
- [ ] NEXTAUTH_SECRET
- [ ] NEXTAUTH_URL
- [ ] JWT_SECRET
- [ ] STRIPE_SECRET_KEY
- [ ] STRIPE_PUBLISHABLE_KEY
- [ ] STRIPE_WEBHOOK_SECRET
- [ ] OPENAI_API_KEY

Optional:
- [ ] ADMOB_APP_ID
- [ ] ADMOB_AD_UNIT_ID
- [ ] ADMOB_API_KEY
- [ ] RESEND_API_KEY
- [ ] SENTRY_DSN

## Troubleshooting

### Build Fails
- Check Node.js version (18+)
- Verify Prisma client generated
- Check environment variables

### Database Errors
- Verify DATABASE_URL format
- Check network access
- Test connection locally

### Redis Errors
- Verify REDIS_URL format
- Check Redis server status
- Test connection locally

### Authentication Issues
- Verify NEXTAUTH_SECRET set
- Check NEXTAUTH_URL matches domain
- Verify JWT_SECRET set

## Support

See `DEPLOYMENT_GUIDE.md` for detailed instructions.
