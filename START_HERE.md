# ? START HERE - Get Running in 2 Minutes!

## ?? Step-by-Step (FASTEST WAY)

### 1. Get Free Database (1 minute)

Go to **https://neon.tech** and:
- Click "Sign Up" (or sign in with GitHub)
- Create a new project
- Copy the connection string
- It looks like: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb`

### 2. Update .env (30 seconds)

Open `/workspace/.env` and find this line:
```bash
DATABASE_URL="file:./dev.db"
```

Replace it with your Neon connection string:
```bash
DATABASE_URL="postgresql://your-connection-string-here"
```

### 3. Run Setup (1 minute)

```bash
cd /workspace
./setup.sh
```

This will:
- Install dependencies
- Set up database
- Create admin account
- Seed investment plans

### 4. Start the App! ??

```bash
npm run dev
```

Visit: **http://localhost:3000**

---

## ?? Default Login

**Admin Account:**
- Email: `admin@hybridtradeai.local`
- Password: `Admin123!Change`

---

## ? What You Can Do

Once running, you can:

1. **View landing page** - Beautiful investment platform UI
2. **Register new users** - Test user registration
3. **Create investments** - Test the investment flow
4. **Admin panel** - Approve deposits, view stats
5. **View dashboard** - See user investments and balances

---

## ?? Features Available

? **User Features:**
- Registration & Login
- Investment Plans (Starter, Pro, Elite)
- Dashboard with balances
- Transaction history
- Investment overview

? **Admin Features:**
- Admin dashboard
- Deposit approvals
- Platform statistics
- Manual profit distribution
- User management

? **Backend Features:**
- Automated profit distribution (weekly)
- Transaction tracking
- Audit logging
- Role-based access
- Secure authentication

---

## ?? Optional: Add API Keys

For full functionality, you can add these later:

```bash
# Stripe (for payments)
STRIPE_SECRET_KEY="sk_test_..." # Get from stripe.com
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# OpenAI (for AI chat)
OPENAI_API_KEY="sk-..." # Get from platform.openai.com

# Resend (for emails)
RESEND_API_KEY="re_..." # Get from resend.com
```

---

## ?? Need Help?

**Database Issues?**
- Make sure you copied the full connection string
- Check it starts with `postgresql://`
- Try the connection string in a browser to verify it works

**Port 3000 in use?**
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

**Dependencies issues?**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## ?? Next Steps

1. **Test the platform** - Try all features
2. **Customize** - Edit investment plans, colors, etc.
3. **Deploy** - Follow DEPLOYMENT.md when ready
4. **Add features** - Check FEATURES.md for what's included

---

## ?? Documentation

- **QUICK_START.md** - Detailed setup options
- **README.md** - Complete project overview  
- **FEATURES.md** - All 100+ features listed
- **DEPLOYMENT.md** - Production deployment guide

---

**You're minutes away from having a complete investment platform running!** ??
