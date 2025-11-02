# ?? Setup HybridTradeAI with Supabase (2 Minutes!)

## Step 1: Create Supabase Project (1 minute)

### Go to https://supabase.com

1. Click **"Start your project"** or **"New Project"**
2. Sign up/in (GitHub login works great)
3. Click **"New Project"**
4. Fill in:
   - **Name:** HybridTradeAI
   - **Database Password:** (generate a strong one - save it!)
   - **Region:** Choose closest to you
   - Click **"Create new project"**

### Get Your Connection String

Once your project is created (takes ~2 minutes):

1. Go to **Settings** (gear icon in left sidebar)
2. Click **"Database"**
3. Scroll down to **"Connection string"**
4. Select **"URI"** tab
5. Copy the connection string
6. Replace `[YOUR-PASSWORD]` with your database password

It will look like:
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
```

## Step 2: Update .env File (30 seconds)

Open `/workspace/.env` and update this line:

```bash
# Replace this:
DATABASE_URL="file:./dev.db"

# With your Supabase connection string:
DATABASE_URL="postgresql://postgres:your-password@db.xxx.supabase.co:5432/postgres"
```

**Important:** Make sure to replace `[YOUR-PASSWORD]` with your actual password!

## Step 3: Run Setup Script (1 minute)

```bash
cd /workspace

# Make setup script executable (if not already)
chmod +x setup.sh

# Run setup
./setup.sh
```

This will:
- ? Install all dependencies
- ? Create database tables
- ? Seed investment plans
- ? Create admin account
- ? Add revenue streams

## Step 4: Start the App! ??

```bash
npm run dev
```

**Visit:** http://localhost:3000

## ?? Default Login

**Admin Account:**
- **Email:** `admin@hybridtradeai.local`
- **Password:** `Admin123!Change`

---

## ?? What You Get with Supabase

### 1. **Database Dashboard**
- View all your tables in Supabase dashboard
- Run SQL queries directly
- See real-time data

### 2. **Free Tier Includes:**
- 500MB database storage
- 2GB bandwidth
- 50,000 monthly active users
- Automatic backups
- SSL connections

### 3. **View Your Data:**
Go to **Table Editor** in Supabase to see:
- Users table
- Investments table
- Transactions
- Profit history
- Everything in real-time!

---

## ?? Bonus: Use Supabase Features

### View Tables in Supabase Dashboard

After running setup, go to your Supabase project:
1. Click **"Table Editor"** (in left sidebar)
2. You'll see all your tables:
   - `users` - All registered users
   - `plans` - Investment plans (Starter, Pro, Elite)
   - `investments` - Active investments
   - `transactions` - All transactions
   - `profit_history` - Profit distributions
   - And 10 more tables!

### Run SQL Queries

1. Click **"SQL Editor"**
2. Try queries like:

```sql
-- View all users
SELECT * FROM users;

-- View investment plans
SELECT * FROM plans;

-- View active investments
SELECT * FROM investments WHERE status = 'ACTIVE';

-- View total invested amount
SELECT SUM(amount) as total_invested FROM investments WHERE status = 'ACTIVE';
```

### Monitor Performance

1. Go to **"Database"** ? **"Roles"**
2. See connection pool status
3. Monitor query performance

---

## ?? Troubleshooting

### "Connection refused" or "Could not connect"

1. **Check your password** - Make sure you replaced `[YOUR-PASSWORD]`
2. **Project still setting up** - Wait 2-3 minutes after creating project
3. **Firewall/Network** - Supabase needs internet access
4. **Connection string format** - Should start with `postgresql://`

### Verify Connection String Format

Should look like this (all one line):
```
postgresql://postgres:YourPassword123@db.abcdefghijk.supabase.co:5432/postgres
```

NOT like this:
```
postgresql://postgres.[project-ref].supabase.co
```

### Test Connection

In Supabase dashboard:
1. Go to **SQL Editor**
2. Run: `SELECT NOW();`
3. If it works, connection is good!

---

## ?? View Your Platform Data

Once running, check Supabase dashboard to see:

### After Setup (`./setup.sh`):
- **3 investment plans** in `plans` table
- **1 admin user** in `users` table  
- **5 revenue streams** in `revenue_streams` table

### After Testing:
- **New users** appear in `users` table
- **Investments** in `investments` table
- **Transactions** in `transactions` table
- **Profits** in `profit_history` table

---

## ?? Next Steps

### 1. Test the Platform
```bash
# Start the app
npm run dev

# Visit: http://localhost:3000
```

### 2. Create Test User
- Click "Get Started" or "Register"
- Create a user account
- See it appear in Supabase `users` table!

### 3. Test Investment Flow
- Login as user
- Go to dashboard
- Create investment
- Login as admin (separate browser/incognito)
- Approve the investment
- See changes in Supabase tables!

### 4. Trigger Profit Distribution
- Login as admin
- Go to `/admin` dashboard
- Trigger manual profit distribution
- Check `profit_history` table in Supabase

---

## ?? Supabase Advantages for This Project

? **Visual Database Management** - See all data in dashboard  
? **Real-time Subscriptions** - Can extend notifications  
? **Automatic Backups** - Daily backups on free tier  
? **Connection Pooling** - Handles many connections  
? **SSL by Default** - Secure connections  
? **Fast Performance** - Global CDN  
? **Easy Scaling** - Upgrade when needed  

---

## ?? Ready to Deploy to Production?

When ready for production:

1. **Use Supabase Pro** ($25/mo) for:
   - No project pausing
   - Point-in-time recovery
   - No read/write restrictions

2. **Update .env for production:**
   - Same DATABASE_URL
   - Add production API keys (Stripe, OpenAI)
   - Update NEXTAUTH_URL to your domain

3. **Deploy to Vercel:**
   - Push to GitHub
   - Connect to Vercel
   - Add environment variables
   - Deploy!

See **DEPLOYMENT.md** for complete production guide.

---

## ?? Documentation

- **README.md** - Complete project overview
- **FEATURES.md** - All 100+ features
- **DEPLOYMENT.md** - Production deployment
- **QUICK_START.md** - Other database options

---

**Supabase + HybridTradeAI = Perfect Match!** ??

You get a complete investment platform with a powerful database backend, all for FREE!
