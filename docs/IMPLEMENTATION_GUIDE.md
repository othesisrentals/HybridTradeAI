# HybridTradeAI Implementation Guide

This document provides a comprehensive guide to the HybridTradeAI platform implementation, covering all features, integrations, and setup procedures.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Environment Setup](#environment-setup)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Payment Gateways](#payment-gateways)
6. [Multi-Currency Support](#multi-currency-support)
7. [Internationalization (i18n)](#internationalization-i18n)
8. [Deployment](#deployment)

## Architecture Overview

HybridTradeAI is built as a Next.js 14 monorepo with the following key components:

- **Frontend**: Next.js 14 App Router, React, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Real-time**: Server-Sent Events (SSE), Redis pub/sub
- **Payments**: Stripe, Paystack, Flutterwave, Coinbase Commerce
- **Currency**: Fixer API with Redis caching
- **i18n**: next-intl with 8 language support
- **AI**: OpenAI GPT-4 for investment advisor

## Environment Setup

### Required Environment Variables

See `.env.example` for complete list. Key variables:

```bash
# Database
DATABASE_URL="postgresql://..."

# Redis
REDIS_URL="redis://..."

# Authentication
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="..."
JWT_SECRET="..."

# Payment Gateways
STRIPE_SECRET_KEY="..."
PAYSTACK_SECRET_KEY="..."
FLUTTERWAVE_SECRET_KEY="..."
COINBASE_API_KEY="..."

# Currency API
FIXER_API_KEY="..." # or use FX_API_KEY for free tier

# AI
OPENAI_API_KEY="..."
```

### Installation Steps

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Start development server
npm run dev
```

## Database Schema

The database uses Prisma with PostgreSQL. Key models:

- **User**: Authentication, balances, KYC status
- **Investment**: Investment plans and tracking
- **Transaction**: All financial transactions
- **Plan**: Investment plan configurations
- **ProfitHistory**: Profit distribution records
- **RevenueStream**: Revenue allocation tracking
- **AdTask**: Ad task system
- **Notification**: Real-time notifications
- **AIConversation**: AI support chats

See `prisma/schema.prisma` for complete schema.

## API Endpoints

### User Endpoints

- `POST /api/user/deposit` - Create deposit request
- `POST /api/user/withdraw` - Create withdrawal request
- `GET /api/user/investments` - Get user investments
- `GET /api/user/transactions` - Get user transactions
- `GET /api/user/stats` - Get user statistics

### Payment Endpoints

- `POST /api/payment/stripe` - Stripe payment
- `POST /api/payment/paystack` - Paystack payment
- `GET /api/payment/paystack/verify` - Verify Paystack payment
- `POST /api/payment/flutterwave` - Flutterwave payment
- `POST /api/payment/coinbase` - Coinbase Commerce payment

### Currency Endpoints

- `GET /api/currency/rates?base=USD` - Get exchange rates
- `POST /api/currency/convert` - Convert currency

### Admin Endpoints

- `GET /api/admin/stats` - Platform statistics
- `POST /api/admin/transactions/approve` - Approve transaction
- `POST /api/admin/broadcast` - Send broadcast notification
- `POST /api/admin/profit/distribute` - Trigger profit distribution

## Payment Gateways

### Stripe

For international payments, especially USD/EUR.

```typescript
import { createPaymentIntent } from '@/lib/payment/stripe';

const paymentIntent = await createPaymentIntent({
  amount: 10000, // in cents
  userId: 'user-id',
});
```

### Paystack

For Nigerian Naira (NGN) and other African currencies.

```typescript
import { initializePaystackPayment } from '@/lib/payment/paystack';

const payment = await initializePaystackPayment({
  amount: 10000, // in kobo
  email: 'user@example.com',
  currency: 'NGN',
});
```

### Flutterwave

For African markets (NGN, GHS, ZAR, KES, etc.).

```typescript
import { initializeFlutterwavePayment } from '@/lib/payment/flutterwave';

const payment = await initializeFlutterwavePayment({
  amount: 100,
  email: 'user@example.com',
  currency: 'NGN',
  tx_ref: 'unique-reference',
});
```

### Coinbase Commerce

For cryptocurrency payments.

```typescript
import { createCoinbaseCharge } from '@/lib/payment/coinbase';

const charge = await createCoinbaseCharge({
  name: 'Deposit',
  amount: 100,
  currency: 'USD',
});
```

## Multi-Currency Support

The platform supports multiple currencies with automatic conversion using Fixer API.

### Supported Currencies

- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- NGN (Nigerian Naira)
- GHS (Ghanaian Cedi)
- ZAR (South African Rand)
- KES (Kenyan Shilling)
- CNY (Chinese Yuan)
- INR (Indian Rupee)

### Usage

```typescript
import { useCurrency } from '@/hooks/useCurrency';

const { currency, setCurrency, format, convert } = useCurrency();

// Format amount
const formatted = format(1000, 'USD'); // "$1,000.00"

// Convert currency
const converted = await convert(100, 'USD', 'NGN');
```

Exchange rates are cached in Redis for 1 hour to minimize API calls.

## Internationalization (i18n)

The platform supports 8 languages:

- English (en)
- French (fr)
- Spanish (es)
- Arabic (ar)
- Chinese (zh)
- Hindi (hi)
- Yoruba (yo)
- Hausa (ha)

### Usage

```typescript
import { useLocale } from '@/hooks/useLocale';

const { locale, setLocale, t } = useLocale();

// Get translation
const welcome = t('dashboard.welcome'); // "Welcome back"

// Change language
setLocale('fr');
```

Translation files are located in `/messages/{locale}.json`.

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Railway Deployment

See `railway.json` for configuration. Set up:
- PostgreSQL database
- Redis instance
- Environment variables

### Cron Jobs

Weekly profit distribution (Sunday 2 AM UTC):

```json
{
  "crons": [{
    "path": "/api/admin/profit/distribute",
    "schedule": "0 2 * * 0"
  }]
}
```

## Security Features

- KYC/AML verification required
- 2FA support (TOTP)
- Rate limiting on API endpoints
- Input validation with Zod
- SQL injection prevention (Prisma)
- XSS protection
- CSRF protection (NextAuth)

## Performance Optimization

- Redis caching for exchange rates
- Database query optimization with indexes
- Image optimization with Next.js Image
- Code splitting and lazy loading
- CDN for static assets

## Monitoring

- Error tracking (Sentry - optional)
- Logging with custom logger
- Redis monitoring
- Database query logging
- API response time tracking

## Support

For issues or questions:
- Check application logs
- Review database query logs
- Monitor Redis pub/sub channels
- Check API response times
