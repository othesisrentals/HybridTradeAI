# HybridTradeAI

A lawful hybrid investment platform built with Next.js, TypeScript, Tailwind CSS, and Supabase. This platform offers low-risk trading investments with real revenue streams from HFT, staking, copy trading, and ad monetization. Users can invest and generate returns based on configurable allocations and performance.

## Features

- User registration and authentication via Supabase Auth
- Investment plans with configurable allocations and ROIs
- Profit distribution engine with weekly credits
- Referral system with commissions
- KYC upload and verification for withdrawals
- AI-powered chat assistant
- Admin dashboard for approvals and oversight
- Payment integrations (Flutterwave, Paystack, NowPayments)
- Proof-of-reserves for transparency
- Ad monetization for Starter plan users via CPC/CPA with Google AdMobs

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/othesisrentals/HybridTradeAI.git
   cd HybridTradeAI
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in the required values (see below)

4. Set up Supabase:
   - Create a new project on [Supabase](https://supabase.com)
   - Run the SQL scripts in `/backend/schema.sql` and `/backend/seed.sql` in your Supabase SQL editor
   - Note the project URL and anon key for `.env.local`

## Environment Variables

Create a `.env.local` file with the following:

```
SUPABASE_URL=https://aepisnnzhigpbbpoaice.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlcGlzbm56aGlncGJicG9haWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTIwNjksImV4cCI6MjA3NjU2ODA2OX0.rg4hLtA1DSzwvUhdIrc3IJvQKsbRoIU8-c-wEWwSoaA
NEXT_PUBLIC_SUPABASE_URL=https://aepisnnzhigpbbpoaice.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlcGlzbm56aGlncGJicG9haWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTIwNjksImV4cCI6MjA3NjU2ODA2OX0.rg4hLtA1DSzwvUhdIrc3IJvQKsbRoIU8-c-wEWwSoaA
OPENAI_API_KEY=your_openai_api_key_here
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxx-X
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOWPAYMENTS_API_KEY=your_nowpayments_api_key_here
ADMOB_PUBLISHER_ID=ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy
ADMIN_EMAIL=admin@hybridtradeai.com
PLATFORM_FEE_PERCENT=7
RAINY_DAY_RESERVE=10
WITHDRAWAL_THRESHOLD=1000
COMPANY_PHONE=1234567890
SUPPORT_EMAIL=support@hybridtradeai.com
NEXT_PUBLIC_APP_NAME=HybridTradeAI
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development
```

## Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

3. Register a new user or log in

## Database Schema

The database schema is defined in `/backend/schema.sql`. It includes tables for users, plans, investments, transactions, profit_logs, support_tickets, and referrals.

Run the seed data in `/backend/seed.sql` to populate initial plans and an admin user.

## Profit Distribution

The profit engine (`/lib/profitEngine.ts`) runs weekly to credit profits based on plan allocations and current stream ROIs. Admins can input weekly ROIs via the admin dashboard.

To run the profit engine manually:
```bash
node backend/profit-engine.ts --dry-run  # For testing
node backend/profit-engine.ts  # For production
```

## Admin Checklist

- [ ] Review and approve KYC documents
- [ ] Verify deposits and withdrawals
- [ ] Input weekly stream ROIs
- [ ] Monitor profit distributions
- [ ] Download proof-of-reserves snapshots
- [ ] Handle support tickets

## Payment Integrations

- **Flutterwave**: For fiat payments in supported regions
- **Paystack**: For Nigerian fiat payments
- **NowPayments**: For crypto payments

Obtain sandbox keys from their respective dashboards for testing. Webhooks are handled at `/api/webhook/payment-webhook.ts`.

## Ad Monetization

Starter plan users can earn additional revenue through CPC/CPA ads and rewarded video ads via Google AdMobs. Ad interactions are tracked and credited to user balances.

## AI Assistant

The chat widget uses OpenAI for responses. If issues like "withdraw", "lost", or "fraud" are mentioned, a support ticket is created automatically.

## Testing

Run tests with:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT
