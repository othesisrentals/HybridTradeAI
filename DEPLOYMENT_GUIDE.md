# HybridTradeAI - Complete Deployment Guide

## ?? Quick Deployment Options

### Option 1: Vercel (Recommended - Easiest)

#### Prerequisites
- GitHub account
- Vercel account (free tier available)
- PostgreSQL database (Supabase, Railway, or Neon)
- Redis instance (Upstash free tier available)

#### Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   In Vercel dashboard, add these environment variables:
   ```
   DATABASE_URL=postgresql://...
   REDIS_URL=redis://...
   NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
   NEXTAUTH_URL=https://your-app.vercel.app
   JWT_SECRET=<generate-with-openssl-rand-base64-32>
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   OPENAI_API_KEY=sk-...
   ADMOB_APP_ID=ca-app-pub-...
   ADMOB_AD_UNIT_ID=ca-app-pub-...
   ADMOB_API_KEY=...
   RESEND_API_KEY=re_...
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

5. **Run Database Migrations**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Pull environment variables
   vercel env pull .env.local
   
   # Run migrations
   npx prisma migrate deploy
   
   # Seed database
   npm run db:seed
   ```

6. **Set Up Cron Job**
   - Go to Vercel dashboard ? Settings ? Cron Jobs
   - Add: `0 2 * * 0` ? `/api/admin/profit/distribute`
   - Or use `vercel.json` (already configured)

---

### Option 2: Railway (Full Stack)

#### Steps

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

3. **Add PostgreSQL**
   - Click "+ New" ? "Database" ? "PostgreSQL"
   - Railway will provide connection string

4. **Add Redis**
   - Click "+ New" ? "Database" ? "Redis"
   - Railway will provide connection string

5. **Configure Environment Variables**
   Add all variables from `.env.example` in Railway dashboard

6. **Deploy**
   - Railway will auto-detect Next.js
   - Build will run automatically
   - After deploy, run migrations:
   ```bash
   railway run npx prisma migrate deploy
   railway run npm run db:seed
   ```

7. **Set Up Cron Job**
   - Use Railway Cron or external service (cron-job.org)
   - Schedule: `0 2 * * 0` (Sunday 2 AM UTC)
   - URL: `https://your-app.railway.app/api/admin/profit/distribute`

---

### Option 3: Docker Deployment

#### Prerequisites
- Docker and Docker Compose installed
- Domain name (optional)

#### Steps

1. **Set Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

2. **Build and Run**
   ```bash
   # Build and start all services
   docker-compose up -d
   
   # Run migrations
   docker-compose exec app npx prisma migrate deploy
   
   # Seed database
   docker-compose exec app npm run db:seed
   ```

3. **Access Application**
   - App: http://localhost:3000
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

4. **Production Deployment**
   For production, use a reverse proxy (nginx, Traefik) and SSL certificates.

---

### Option 4: Manual Server Deployment

#### Requirements
- Ubuntu 20.04+ server
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- PM2 or systemd
- Nginx (for reverse proxy)

#### Steps

1. **Server Setup**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install PostgreSQL
   sudo apt install postgresql postgresql-contrib
   
   # Install Redis
   sudo apt install redis-server
   ```

2. **Clone Repository**
   ```bash
   git clone <your-repo-url>
   cd hybridtradeai
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env.local
   nano .env.local  # Edit with your values
   ```

4. **Database Setup**
   ```bash
   # Create database
   sudo -u postgres psql
   CREATE DATABASE hybridtradeai;
   CREATE USER hybridtradeai WITH PASSWORD 'your-password';
   GRANT ALL PRIVILEGES ON DATABASE hybridtradeai TO hybridtradeai;
   \q
   
   # Run migrations
   npx prisma migrate deploy
   npm run db:seed
   ```

5. **Build Application**
   ```bash
   npm run build
   ```

6. **Set Up PM2**
   ```bash
   npm install -g pm2
   pm2 start npm --name "hybridtradeai" -- start
   pm2 save
   pm2 startup
   ```

7. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

8. **Set Up SSL (Let's Encrypt)**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## ?? Post-Deployment Checklist

### Database Setup
- [ ] Run Prisma migrations
- [ ] Seed initial data (plans, admin user)
- [ ] Verify database connection
- [ ] Set up database backups

### Environment Variables
- [ ] All required variables set
- [ ] Secrets are secure (not in git)
- [ ] NEXTAUTH_URL matches production domain
- [ ] Database URL is correct

### Application
- [ ] Application builds successfully
- [ ] All API endpoints working
- [ ] Authentication working
- [ ] Real-time notifications working
- [ ] Admin panel accessible

### Security
- [ ] HTTPS/SSL enabled
- [ ] Admin password changed
- [ ] Rate limiting configured
- [ ] CORS configured correctly
- [ ] Environment variables secured

### Monitoring
- [ ] Error tracking set up (Sentry)
- [ ] Logging configured
- [ ] Health check endpoint working
- [ ] Uptime monitoring configured

### Cron Jobs
- [ ] Weekly profit distribution scheduled
- [ ] Auto-investment configured
- [ ] Cron job monitoring set up

---

## ?? Database Providers

### Supabase (Recommended for Vercel)
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Copy connection string
4. Use format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

### Railway PostgreSQL
1. Add PostgreSQL service in Railway
2. Copy connection string from variables
3. Already formatted correctly

### Neon (Serverless PostgreSQL)
1. Create account at [neon.tech](https://neon.tech)
2. Create project
3. Copy connection string
4. Perfect for serverless deployments

---

## ?? Redis Providers

### Upstash (Recommended for Serverless)
1. Create account at [upstash.com](https://upstash.com)
2. Create Redis database
3. Copy REST URL (for serverless) or Redis URL
4. Free tier: 10,000 commands/day

### Railway Redis
1. Add Redis service in Railway
2. Copy connection string from variables

### Redis Cloud
1. Create account at [redis.com](https://redis.com)
2. Create database
3. Copy connection string

---

## ?? Email Setup (Resend)

1. Create account at [resend.com](https://resend.com)
2. Verify domain (optional)
3. Get API key
4. Add to environment variables

---

## ?? Stripe Setup

1. Create account at [stripe.com](https://stripe.com)
2. Get API keys from dashboard
3. Set up webhook endpoint:
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook secret

---

## ?? OpenAI Setup

1. Create account at [platform.openai.com](https://platform.openai.com)
2. Get API key
3. Add billing method
4. Copy API key to environment

---

## ?? AdMob Setup (Optional)

1. Create account at [admob.google.com](https://admob.google.com)
2. Create app
3. Create ad units
4. Get app ID and ad unit IDs
5. Add to environment variables

---

## ?? Troubleshooting

### Build Fails
- Check Node.js version (18+)
- Verify all dependencies installed
- Check Prisma client generation
- Review build logs

### Database Connection Errors
- Verify DATABASE_URL format
- Check network access
- Verify credentials
- Test connection locally

### Redis Connection Errors
- Verify REDIS_URL format
- Check Redis server status
- Verify network access
- Test connection locally

### Authentication Issues
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches domain
- Verify JWT_SECRET is set
- Check session configuration

### SSE Notifications Not Working
- Verify Redis connection
- Check browser console for errors
- Verify channel names match
- Check CORS settings

---

## ?? Monitoring & Maintenance

### Health Checks
```bash
# Check application health
curl https://your-domain.com/api/health

# Check database
npx prisma db pull

# Check Redis
redis-cli ping
```

### Database Backups
```bash
# Manual backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### Logs
```bash
# Vercel
vercel logs

# Railway
railway logs

# Docker
docker-compose logs -f app

# PM2
pm2 logs hybridtradeai
```

---

## ?? Production Best Practices

1. **Always use HTTPS** - SSL certificates required
2. **Set up monitoring** - Track errors and performance
3. **Configure backups** - Regular database backups
4. **Use environment variables** - Never commit secrets
5. **Enable rate limiting** - Protect API endpoints
6. **Set up alerts** - Get notified of issues
7. **Regular updates** - Keep dependencies updated
8. **Security scanning** - Regular security audits

---

## ?? Support

If you encounter issues:
1. Check logs for error messages
2. Verify all environment variables
3. Test database/Redis connections
4. Review deployment platform docs
5. Check GitHub issues

---

**Ready to deploy!** ??

Choose your preferred deployment method and follow the steps above.
