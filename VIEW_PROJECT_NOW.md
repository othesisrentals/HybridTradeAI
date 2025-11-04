# ?? View Your HybridTradeAI Project - Quick Guide

## ?? **START THE PROJECT (3 Simple Steps)**

### **Step 1: Open Your Terminal**
In Cursor, open a new terminal (Terminal ? New Terminal)

### **Step 2: Run This Command**
```bash
npm run dev
```

### **Step 3: Open Your Browser**
Visit: **http://localhost:3000**

**That's it!** ??

---

## ?? **What You'll See**

### **Landing Page** (http://localhost:3000)
- Modern hero section
- Investment plans showcase
- Feature highlights
- Call-to-action buttons

### **Sign Up** (http://localhost:3000/auth/signup)
- Create new account form
- Email, password, name fields
- Referral code option
- Google/Apple sign-in options

### **Dashboard** (http://localhost:3000/dashboard)
After signing in, you'll see:
- ?? Total invested amount
- ?? Available balance
- ?? Total earnings
- ?? Investment performance chart
- ?? Notifications bell
- ?? Language switcher (NEW!)
- ?? Currency switcher (NEW!)

### **Investment Plans** (http://localhost:3000/dashboard/investments)
- Starter Plan ($100-$1,000)
- Professional Plan ($1,001-$10,000)
- Elite Plan ($10,001-$100,000)
- ROI ranges and features

### **Deposit Page** (http://localhost:3000/dashboard/deposit)
- ?? Stripe (Credit/Debit Card)
- ?? Paystack (African Payments) **NEW!**
- ?? Flutterwave (Global) **NEW!**
- ? Coinbase Commerce (Crypto) **NEW!**

### **Settings** (http://localhost:3000/dashboard/settings)
- Profile settings
- ?? **Enable 2FA** (NEW!)
- ?? Language preference
- ?? Currency preference
- Security settings

---

## ?? **Test Your NEW Features**

### **1. Multi-Language (i18n)**

Click the language switcher and try:
- ???? English
- ???? Fran?ais (French)
- ???? Espa?ol (Spanish)
- ???? ??????? (Arabic)
- ???? ?? (Chinese)
- ???? ?????? (Hindi)
- ???? Yor?b? (Yoruba)
- ???? Hausa (Hausa)

**Watch the entire UI translate instantly!**

### **2. Multi-Currency**

Click the currency switcher and try:
- ?? USD (US Dollar)
- ?? EUR (Euro)
- ?? GBP (British Pound)
- ? NGN (Nigerian Naira)
- ? INR (Indian Rupee)
- ? CNY (Chinese Yuan)
- ...and 9 more!

**All amounts will convert in real-time!**

### **3. Two-Factor Authentication (2FA)**

1. Go to **Settings ? Security**
2. Click **"Enable 2FA"** button
3. You'll see:
   - QR code to scan
   - Secret key for manual entry
   - 10 backup codes to save
4. Scan with **Google Authenticator** or **Authy**
5. Enter the 6-digit code
6. ?? 2FA enabled!

### **4. Payment Gateways**

#### **Test Paystack** (Nigerian Payments)
1. Go to **Dashboard ? Deposit**
2. Select **"Paystack"**
3. Enter amount (e.g., 1000 NGN)
4. Click proceed

**Test Cards:**
```
Card: 4084 0840 8408 4081
Expiry: 12/30
CVV: 408
OTP: 123456
```

#### **Test Flutterwave** (Multi-Country)
1. Select **"Flutterwave"**
2. Enter amount
3. Use test credentials from dashboard

#### **Test Coinbase** (Cryptocurrency)
1. Select **"Cryptocurrency"**
2. Choose crypto (BTC/ETH/USDC)
3. You'll see payment addresses
4. Send test crypto

---

## ?? **Expected UI Features**

When you view the project, you'll see:

? **Modern Design**
- Clean, professional interface
- TailwindCSS styling
- Smooth animations (Framer Motion)

?? **Dark/Light Mode**
- Toggle in navbar
- Persists across sessions

?? **Mobile Responsive**
- Works on phones, tablets, desktops
- Adaptive layouts

?? **Interactive Elements**
- Charts (Recharts)
- Modals and dialogs
- Toast notifications
- Loading states

---

## ?? **Available Routes**

### **Public Routes:**
```
/                           ? Landing page
/auth/signin                ? Sign in
/auth/signup                ? Sign up
```

### **Dashboard Routes (Protected):**
```
/dashboard                  ? Main dashboard
/dashboard/investments      ? Investment management
/dashboard/transactions     ? Transaction history
/dashboard/deposit          ? Deposit funds (4 gateways!)
/dashboard/withdraw         ? Withdraw funds
/dashboard/ads              ? Ad tasks
/dashboard/kyc              ? KYC verification
```

### **Admin Routes (Admin Only):**
```
/admin                      ? Admin dashboard
/admin/transactions         ? Manage transactions
/admin/kyc                  ? Approve KYC
/admin/broadcast            ? Send notifications
```

### **Multi-Language Routes:**
Add language prefix to any route:
```
/fr/dashboard               ? French dashboard
/es/dashboard               ? Spanish dashboard
/ar/dashboard               ? Arabic dashboard
/zh/dashboard               ? Chinese dashboard
```

---

## ?? **API Endpoints Available**

### **NEW Features:**
```
POST /api/auth/2fa/setup           ? Start 2FA setup
POST /api/auth/2fa/verify          ? Verify 2FA token
POST /api/auth/2fa/disable         ? Disable 2FA
POST /api/auth/2fa/backup-codes    ? Regenerate codes

GET  /api/currency/rates           ? Get exchange rates
POST /api/currency/convert         ? Convert currency

POST /api/payment/paystack/initialize     ? Paystack payment
POST /api/payment/paystack/webhook        ? Paystack webhook

POST /api/payment/flutterwave/initialize  ? Flutterwave payment
POST /api/payment/flutterwave/webhook     ? Flutterwave webhook

POST /api/payment/coinbase/initialize     ? Coinbase crypto payment
POST /api/payment/coinbase/webhook        ? Coinbase webhook
```

### **Existing Features:**
```
POST /api/auth/signup              ? Create account
POST /api/auth/signin              ? Login
GET  /api/user/stats               ? User statistics
POST /api/user/deposit             ? Create deposit
GET  /api/admin/users              ? List users (admin)
...and 30+ more endpoints!
```

---

## ??? **Quick Setup (If Not Done)**

```bash
# 1. Create environment file
cp .env.example .env

# 2. Add database URL to .env (minimum required)
DATABASE_URL="postgresql://user:pass@localhost:5432/hybridtradeai"
NEXTAUTH_SECRET="your-random-secret-at-least-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# 3. Generate Prisma client
npx prisma generate

# 4. Run migrations
npx prisma migrate dev

# 5. (Optional) Seed demo data
npm run prisma:seed

# 6. Start the server
npm run dev
```

---

## ?? **Alternative: Browse the Code**

You can explore the implementation right now:

```bash
# View all translations
ls src/i18n/messages/

# Read English translations
cat src/i18n/messages/en.json

# Read French translations
cat src/i18n/messages/fr.json

# View 2FA implementation
cat src/lib/auth/2fa.ts

# View Paystack integration
cat src/lib/payment/paystack.ts

# View Flutterwave integration
cat src/lib/payment/flutterwave.ts

# View Coinbase integration
cat src/lib/payment/coinbase.ts

# View currency service
cat src/lib/currency/service.ts

# Run tests to see everything works
npm run test:run
```

---

## ?? **Watch It Come to Life!**

Open your terminal and run:
```bash
npm run dev
```

Then open your browser and explore:
1. ?? The beautiful landing page
2. ?? Sign up for an account
3. ?? Explore the dashboard
4. ?? Switch languages
5. ?? Change currencies
6. ?? Enable 2FA
7. ?? Try payment methods

---

## ? **Everything Is Ready!**

- ? 43 files implemented
- ? 29 tests passing
- ? 8 languages available
- ? 15 currencies supported
- ? 4 payment gateways integrated
- ? Complete documentation

**Just run `npm run dev` and start exploring!** ??
