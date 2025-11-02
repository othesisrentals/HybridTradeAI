# HybridTradeAI Quick Reference Guide

## ?? Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your keys

# Setup database
npm run db:generate
npm run db:migrate
npm run db:seed

# Start development
npm run dev
```

## ?? Key Directories

- `/src/app` - Next.js App Router pages and API routes
- `/src/components` - React components
- `/src/lib` - Utility libraries and services
- `/src/hooks` - React hooks
- `/config` - Application constants
- `/messages` - i18n translation files
- `/docs` - Documentation
- `/scripts` - Database seeding and automation scripts

## ?? Environment Variables

See `.env.example` for complete list. Essential variables:

```bash
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
NEXTAUTH_SECRET="..."
STRIPE_SECRET_KEY="..."
PAYSTACK_SECRET_KEY="..."
FLUTTERWAVE_SECRET_KEY="..."
COINBASE_API_KEY="..."
FIXER_API_KEY="..."
OPENAI_API_KEY="..."
```

## ?? Payment Gateways

### Stripe
```typescript
POST /api/payment/create-intent
Body: { amount: number, currency: string }
```

### Paystack
```typescript
POST /api/payment/paystack
Body: { amount: number, currency: 'NGN' }
GET /api/payment/paystack/verify?reference=xxx
```

### Flutterwave
```typescript
POST /api/payment/flutterwave
Body: { amount: number, currency: 'NGN' }
```

### Coinbase Commerce
```typescript
POST /api/payment/coinbase
Body: { amount: number, currency: 'USD' }
```

## ?? Currency Conversion

```typescript
import { useCurrency } from '@/hooks/useCurrency';

const { currency, setCurrency, format, convert } = useCurrency();

// Format amount
const formatted = format(1000, 'USD'); // "$1,000.00"

// Convert currency
const converted = await convert(100, 'USD', 'NGN');
```

API endpoints:
- `GET /api/currency/rates?base=USD` - Get exchange rates
- `POST /api/currency/convert` - Convert currency

## ?? Internationalization

```typescript
import { useLocale } from '@/hooks/useLocale';

const { locale, setLocale, t } = useLocale();

// Get translation
const welcome = t('dashboard.welcome');

// Change language
setLocale('fr');
```

Supported languages: en, fr, es, ar, zh, hi, yo, ha

## ?? Investment Plans

- **Starter**: $100 - $5,000 | 5-12% weekly ROI
- **Pro**: $5,000 - $50,000 | 8-18% weekly ROI
- **Elite**: $50,000 - $500,000 | 12-25% weekly ROI

## ?? Authentication

Uses NextAuth.js with JWT strategy:

```typescript
import { useSession } from 'next-auth/react';

const { data: session } = useSession();
// session.user.id, session.user.email, session.user.role
```

## ?? API Endpoints

### User
- `POST /api/user/deposit` - Create deposit
- `POST /api/user/withdraw` - Create withdrawal
- `GET /api/user/investments` - Get investments
- `GET /api/user/transactions` - Get transactions
- `GET /api/user/stats` - Get user stats

### Admin
- `GET /api/admin/stats` - Platform stats
- `POST /api/admin/transactions/approve` - Approve transaction
- `POST /api/admin/broadcast` - Broadcast notification
- `POST /api/admin/profit/distribute` - Distribute profits

### Notifications
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/sse` - SSE stream
- `PATCH /api/notifications/[id]/read` - Mark as read

## ??? Utilities

```typescript
import { formatCurrency, getCurrencySymbol } from '@/lib/utils';

formatCurrency(1000, 'USD', 'en-US'); // "$1,000.00"
getCurrencySymbol('NGN'); // "?"
```

## ?? Documentation

- `IMPLEMENTATION_SUMMARY.md` - Complete feature summary
- `docs/IMPLEMENTATION_GUIDE.md` - Detailed implementation guide
- `docs/PAYMENT_GUIDE.md` - Payment gateway guide
- `README.md` - Project overview

## ?? Troubleshooting

### Database Connection
```bash
# Check DATABASE_URL format
# Verify database is running
npm run db:studio # Open Prisma Studio
```

### Redis Connection
```bash
# Check REDIS_URL format
# Verify Redis server is running
```

### Payment Issues
- Verify API keys are correct
- Check webhook endpoints are configured
- Review payment gateway logs

### Currency Conversion
- Verify FIXER_API_KEY or FX_API_KEY is set
- Check Redis is accessible for caching
- Fallback to ExchangeRate-API if Fixer fails

## ?? Common Tasks

### Add New Language
1. Create `/messages/{locale}.json`
2. Add translations
3. Update `src/i18n/config.ts` locales array

### Add New Currency
1. Update `config/constants.ts` CURRENCIES
2. Add symbol to `getCurrencySymbol()` in `src/lib/utils.ts`
3. Test conversion with Fixer API

### Add Payment Gateway
1. Create integration in `/src/lib/payment/`
2. Create API route in `/src/app/api/payment/`
3. Update `.env.example`
4. Add documentation

## ?? Support

For issues:
1. Check application logs
2. Review API response times
3. Check database query logs
4. Monitor Redis connections
