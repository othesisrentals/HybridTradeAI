# ?? Deploy Now - Step by Step

## ? Fastest Deployment Path (Vercel)

### Step 1: Prepare Your Code (DONE ?)
Your codebase is ready. All files are in place.

### Step 2: Set Up Services

#### A. Database (PostgreSQL)
Choose one:
- **Supabase** (Recommended): https://supabase.com ? New Project ? Copy connection string
- **Railway**: https://railway.app ? New ? PostgreSQL ? Copy connection string
- **Neon**: https://neon.tech ? Create Project ? Copy connection string

#### B. Redis
Choose one:
- **Upstash** (Recommended): https://upstash.com ? Create Database ? Copy URL
- **Railway**: https://railway.app ? New ? Redis ? Copy connection string

#### C. Stripe
- Go to https://stripe.com ? Dashboard ? Developers ? API Keys
- Copy Secret Key and Publishable Key
- Set up webhook: Dashboard ? Developers ? Webhooks ? Add endpoint
  - URL: `https://your-app.vercel.app/api/webhooks/stripe`
  - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
- Copy webhook secret

#### D. OpenAI
- Go to https://platform.openai.com ? API Keys ? Create new secret key
- Copy the key

### Step 3: Push to GitHub

```bash
cd /workspace

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "HybridTradeAI - Production Ready"

# Add your GitHub remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/hybridtradeai.git

# Push
git push -u origin main
```

### Step 4: Deploy to Vercel

1. **Go to Vercel**
   - Visit https://vercel.com
   - Sign up/Login with GitHub

2. **Import Project**
   - Click "New Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Build**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `prisma generate && next build` (auto-set)
   - Output Directory: `.next` (auto-set)

4. **Add Environment Variables**
   Click "Environment Variables" and add:

   ```
   DATABASE_URL=postgresql://user:pass@host:5432/db
   REDIS_URL=redis://user:pass@host:6379
   NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
   NEXTAUTH_URL=https://your-app.vercel.app
   JWT_SECRET=<generate-with-openssl-rand-base64-32>
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   OPENAI_API_KEY=sk-...
   ```

   **Generate secrets:**
   ```bash
   openssl rand -base64 32  # Run twice for NEXTAUTH_SECRET and JWT_SECRET
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)

### Step 5: Set Up Database

After deployment, run migrations:

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy

# Seed database
npm run db:seed
```

Or use Vercel dashboard:
- Go to your project ? Settings ? Deployment
- Open deployment shell
- Run: `npx prisma migrate deploy && npm run db:seed`

### Step 6: Configure Cron Job

1. Go to Vercel Dashboard ? Your Project ? Settings ? Cron Jobs
2. Add new cron:
   - Path: `/api/admin/profit/distribute`
   - Schedule: `0 2 * * 0` (Sunday 2 AM UTC)
   - Timezone: UTC

### Step 7: Verify Deployment

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Test signup/signin
3. Login as admin:
   - Email: `admin@hybridtradeai.com`
   - Password: `admin123`
4. **CHANGE ADMIN PASSWORD IMMEDIATELY!**

### Step 8: Update Stripe Webhook

1. Go to Stripe Dashboard ? Webhooks
2. Update webhook URL to your Vercel domain
3. Copy webhook secret to Vercel environment variables

## ? Deployment Complete!

Your platform is now live! ??

## ?? Post-Deployment Tasks

- [ ] Change admin password
- [ ] Test all user flows
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring (Sentry)
- [ ] Configure email notifications
- [ ] Test payment flow
- [ ] Verify notifications work

## ?? Need Help?

- Check logs: `vercel logs`
- View deployment: Vercel Dashboard ? Deployments
- Database issues: Check DATABASE_URL format
- Redis issues: Check REDIS_URL format

---

**Ready to deploy? Follow the steps above!** ??
