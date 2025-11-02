# ?? Quick Start Guide - Get Running in 5 Minutes!

## Option 1: Use Free Cloud Database (Recommended - Fastest!)

### Step 1: Get Free PostgreSQL Database (2 minutes)

Choose one of these free options:

#### **Option A: Neon (Recommended)**
1. Go to https://neon.tech
2. Sign up (GitHub login works)
3. Create a new project
4. Copy the connection string
5. It looks like: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb`

#### **Option B: Supabase**
1. Go to https://supabase.com
2. Sign up
3. Create new project
4. Go to Settings ? Database
5. Copy the connection string (use "Connection pooling" URL)

#### **Option C: Railway**
1. Go to https://railway.app
2. Sign up
3. New Project ? Add PostgreSQL
4. Copy the connection string

### Step 2: Update .env File

```bash
# Open /workspace/.env and update this line:
DATABASE_URL="your-connection-string-from-step-1"
```

### Step 3: Install & Run

```bash
cd /workspace

# Install dependencies
npm install

# Set up database
npx prisma db push

# Seed initial data (plans, admin user, etc.)
npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts

# Start the app
npm run dev
```

Visit: **http://localhost:3000**

### Default Admin Login:
- **Email**: admin@hybridtradeai.local
- **Password**: Admin123!Change

---

## Option 2: Use Docker PostgreSQL (If you prefer local)

### Step 1: Start PostgreSQL with Docker

```bash
# Start PostgreSQL
docker run --name hybridtradeai-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=hybridtradeai \
  -p 5432:5432 \
  -d postgres:15-alpine

# Your DATABASE_URL will be:
# postgresql://postgres:password@localhost:5432/hybridtradeai
```

### Step 2: Update .env

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/hybridtradeai"
```

### Step 3: Install & Run

```bash
npm install
npx prisma db push
npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts
npm run dev
```

---

## Option 3: Install PostgreSQL Locally

### macOS:
```bash
brew install postgresql@15
brew services start postgresql@15
createdb hybridtradeai
```

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb hybridtradeai
```

### Windows:
Download from: https://www.postgresql.org/download/windows/

---

## ?? You're Live!

Once running, you can:

1. **Visit the app**: http://localhost:3000
2. **Login as admin**: admin@hybridtradeai.local / Admin123!Change
3. **Create test user**: Register a new account
4. **Test investment flow**:
   - Register user
   - Login to dashboard
   - Create deposit
   - Login as admin
   - Approve deposit
   - See profit distribution

---

## Optional: Add API Keys

For full functionality, add these to `.env`:

```bash
# Stripe (for payments) - Get from https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# OpenAI (for AI chat) - Get from https://platform.openai.com/api-keys
OPENAI_API_KEY="sk-..."

# Resend (for emails) - Get from https://resend.com/api-keys
RESEND_API_KEY="re_..."
```

---

## Troubleshooting

### "Port 3000 already in use"
```bash
# Kill the process on port 3000
lsof -ti:3000 | xargs kill -9
```

### "Cannot connect to database"
- Make sure PostgreSQL is running
- Check DATABASE_URL in .env is correct
- Try running: `npx prisma db push` again

### "Module not found"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Redis warnings
- Redis is optional for local development
- Notifications will work locally without Redis
- For production, set up Redis from Upstash (free tier)

---

## ?? Next Steps

1. **Read the docs**: Check README.md, FEATURES.md, DEPLOYMENT.md
2. **Customize**: Edit investment plans in `scripts/seedPlans.ts`
3. **Deploy**: Follow DEPLOYMENT.md for production deployment
4. **Test features**: Try all the features listed in FEATURES.md

---

**Need help?** Check the full documentation or the troubleshooting section in README.md
