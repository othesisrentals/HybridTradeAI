# ?? How to Start and View Your HybridTradeAI Project

## Quick Start (3 Steps)

### Step 1: Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your database URL
# DATABASE_URL="postgresql://user:password@localhost:5432/hybridtradeai"
```

### Step 2: Setup Database
```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed with sample data
npm run prisma:seed
```

### Step 3: Start Development Server
```bash
npm run dev
```

**Open in browser:** http://localhost:3000

---

## ?? Pages You Can Visit

### Public Pages
- **Homepage:** http://localhost:3000
- **Sign In:** http://localhost:3000/auth/signin
- **Sign Up:** http://localhost:3000/auth/signup

### Dashboard (Requires Login)
- **Main Dashboard:** http://localhost:3000/dashboard
- **Investments:** http://localhost:3000/dashboard/investments
- **Transactions:** http://localhost:3000/dashboard/transactions
- **Deposit Funds:** http://localhost:3000/dashboard/deposit
- **Withdraw Funds:** http://localhost:3000/dashboard/withdraw
- **Ads & Tasks:** http://localhost:3000/dashboard/ads
- **KYC Verification:** http://localhost:3000/dashboard/kyc

### Admin Panel (Requires Admin Role)
- **Admin Dashboard:** http://localhost:3000/admin
- **Manage Transactions:** http://localhost:3000/admin/transactions
- **KYC Requests:** http://localhost:3000/admin/kyc
- **Broadcast Notifications:** http://localhost:3000/admin/broadcast

### Multi-Language Support
Access any page in different languages by adding language prefix:
- **French:** http://localhost:3000/fr/dashboard
- **Spanish:** http://localhost:3000/es/dashboard
- **Arabic:** http://localhost:3000/ar/dashboard
- **Chinese:** http://localhost:3000/zh/dashboard
- **Hindi:** http://localhost:3000/hi/dashboard
- **Yoruba:** http://localhost:3000/yo/dashboard
- **Hausa:** http://localhost:3000/ha/dashboard

---

## ?? Testing New Features

### 1. Test Internationalization (i18n)
1. Open any page
2. Look for the language switcher in the navbar
3. Click and select different languages (FR, ES, AR, ZH, HI, YO, HA)
4. Watch the entire UI translate in real-time

### 2. Test Multi-Currency
1. Find the currency switcher (usually in navbar or settings)
2. Select different currencies (USD, EUR, GBP, NGN, etc.)
3. Watch all amounts convert to the selected currency
4. Note: Exchange rates are cached for 1 hour

### 3. Test 2FA (Two-Factor Authentication)
1. Sign up for a new account or sign in
2. Go to **Settings ? Security**
3. Click **"Enable 2FA"**
4. Scan the QR code with Google Authenticator or Authy
5. Enter the 6-digit code to verify
6. Save your backup codes (important!)
7. Log out and log back in to test 2FA login

### 4. Test Payment Gateways

#### Paystack (African Payments)
1. Go to **Dashboard ? Deposit**
2. Select **"Paystack"** as payment method
3. Enter amount in NGN
4. Use test card: `4084084084084081`
5. Expiry: Any future date
6. CVV: `408`
7. OTP: `123456`

#### Flutterwave
1. Select **"Flutterwave"** as payment method
2. Enter amount
3. Use test cards from [Flutterwave docs](https://developer.flutterwave.com/docs/integration-guides/testing-helpers/)

#### Coinbase Commerce (Crypto)
1. Select **"Cryptocurrency"** as payment method
2. Choose crypto (BTC, ETH, USDC, etc.)
3. You'll see a payment address
4. Send test crypto to the address
5. Watch for real-time confirmation

---

## ?? Useful Commands

### Development
```bash
# Start dev server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Database
```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name your_migration_name

# Apply migrations
npx prisma migrate deploy

# Open Prisma Studio (visual database editor)
npx prisma studio

# Seed database
npm run prisma:seed

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Other
```bash
# Check TypeScript types
npx tsc --noEmit

# Format code
npm run format

# View environment variables needed
cat .env.example
```

---

## ?? Environment Variables Needed

### Essential (Required to run)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/hybridtradeai"
NEXTAUTH_SECRET="your-32-character-secret-key"
NEXTAUTH_URL="http://localhost:3000"
JWT_SECRET="your-32-character-jwt-secret"
REDIS_URL="redis://localhost:6379"
```

### Optional (For full functionality)
```env
# Currency Conversion
FX_API_KEY="your_fixer_api_key"

# Payment Gateways
PAYSTACK_SECRET_KEY="sk_test_..."
FLUTTERWAVE_SECRET_KEY="FLWSECK-..."
FLUTTERWAVE_PUBLIC_KEY="FLWPUBK-..."
COINBASE_COMMERCE_API_KEY="..."
COINBASE_WEBHOOK_SECRET="..."

# Stripe (existing)
STRIPE_SECRET_KEY="sk_test_..."

# AI Features
OPENAI_API_KEY="sk-..."
# or
ANTHROPIC_API_KEY="sk-ant-..."

# Email
RESEND_API_KEY="re_..."

# AdMob
ADMOB_API_KEY="..."
```

---

## ?? What You'll See

When you run the project, you'll experience:

### ? Modern UI/UX
- **TailwindCSS** - Beautiful, responsive design
- **Dark/Light Mode** - Toggle between themes
- **Framer Motion** - Smooth animations
- **Mobile Responsive** - Works on all devices

### ?? Global Features
- **8 Languages** - Switch languages instantly
- **15 Currencies** - Real-time conversion
- **Multi-timezone** - Automatic time adjustments

### ?? Security Features
- **2FA Authentication** - TOTP with QR codes
- **Secure Sessions** - JWT + NextAuth
- **Rate Limiting** - API protection
- **Webhook Verification** - Payment security

### ?? Business Features
- **Investment Plans** - Starter, Pro, Elite
- **Profit Distribution** - Automated weekly payouts
- **Ad Tasks** - AdMob integration for extra earnings
- **Referral System** - Earn from referrals
- **KYC Verification** - Document upload and approval
- **AI Chat Support** - OpenAI/Anthropic powered

### ?? Admin Features
- **User Management** - CRUD operations
- **Transaction Monitoring** - Real-time tracking
- **KYC Approval** - Document review system
- **Broadcast Notifications** - Send to all users
- **Revenue Analytics** - Performance metrics

---

## ?? Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Database Connection Error
```bash
# Check PostgreSQL is running
pg_isready

# Verify DATABASE_URL in .env
echo $DATABASE_URL

# Reset database
npx prisma migrate reset
```

### Prisma Client Not Generated
```bash
# Generate client
npx prisma generate

# If still issues, clear node_modules
rm -rf node_modules
npm install
npx prisma generate
```

### Dependencies Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## ?? Additional Resources

- **API Documentation:** See `IMPLEMENTATION_COMPLETE.md`
- **Deployment Guide:** See `NEXT_STEPS_COMPLETE.md`
- **Test Report:** See `VERIFICATION_REPORT.md`
- **Full Summary:** See `IMPLEMENTATION_SUMMARY.md`

---

## ?? Test Accounts

After seeding database (`npm run prisma:seed`), use:

**Admin Account:**
- Email: `admin@hybridtradeai.com`
- Password: `admin123`

**Note:** Change these credentials in production!

---

## ?? Need Help?

1. Check the error message carefully
2. Verify all environment variables are set
3. Make sure database is running
4. Check Redis is accessible (optional for dev)
5. Review the documentation files

---

## ?? You're Ready!

Your HybridTradeAI platform is now ready to use. Simply run:

```bash
npm run dev
```

And visit **http://localhost:3000** in your browser!

Enjoy exploring all the features! ??
