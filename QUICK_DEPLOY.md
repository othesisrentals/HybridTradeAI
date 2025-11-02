# ? Quick Deploy Guide

Get HybridTradeAI running in 5 minutes!

## ?? Fastest Path: Vercel + Supabase + Upstash

### Step 1: Set Up Services (5 min)

1. **Supabase** (Database)
   - Go to [supabase.com](https://supabase.com)
   - Create account ? New Project
   - Copy connection string from Settings ? Database

2. **Upstash** (Redis)
   - Go to [upstash.com](https://upstash.com)
   - Create account ? Create Redis Database
   - Copy REST URL or Redis URL

3. **Stripe** (Payments)
   - Go to [stripe.com](https://stripe.com)
   - Create account ? Get API keys from Dashboard
   - Set up webhook: `https://your-app.vercel.app/api/webhooks/stripe`

4. **OpenAI** (AI Support)
   - Go to [platform.openai.com](https://platform.openai.com)
   - Create account ? Get API key

### Step 2: Deploy to Vercel (2 min)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repo
   - Click "Deploy"

3. **Add Environment Variables**
   In Vercel Dashboard ? Settings ? Environment Variables, add:
   ```
   DATABASE_URL=<from-supabase>
   REDIS_URL=<from-upstash>
   NEXTAUTH_SECRET=<generate-random-32-chars>
   NEXTAUTH_URL=https://your-app.vercel.app
   JWT_SECRET=<generate-random-32-chars>
   STRIPE_SECRET_KEY=<from-stripe>
   STRIPE_PUBLISHABLE_KEY=<from-stripe>
   STRIPE_WEBHOOK_SECRET=<from-stripe-webhook>
   OPENAI_API_KEY=<from-openai>
   ```

### Step 3: Set Up Database (1 min)

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Pull environment
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy

# Seed database
npm run db:seed
```

### Step 4: Verify (1 min)

1. Visit your Vercel URL
2. Sign up a new account
3. Login as admin: `admin@hybridtradeai.com` / `admin123`
4. **CHANGE ADMIN PASSWORD IMMEDIATELY**

## ? Done!

Your platform is now live! ??

**Next Steps:**
- Configure Stripe webhook
- Set up cron job for profit distribution
- Customize branding
- Add your domain

## ?? Generate Secrets

```bash
# Generate NEXTAUTH_SECRET and JWT_SECRET
openssl rand -base64 32
```

## ?? Full Documentation

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Complete deployment guide
- [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) - Deployment checklist
- [README.md](./README.md) - Full documentation
