# Payment Gateway Integration Guide

This guide covers how to integrate and use the various payment gateways supported by HybridTradeAI.

## Supported Payment Gateways

1. **Stripe** - International payments (USD, EUR, GBP, etc.)
2. **Paystack** - Nigerian Naira and African currencies
3. **Flutterwave** - African markets (NGN, GHS, ZAR, KES, etc.)
4. **Coinbase Commerce** - Cryptocurrency payments

## Stripe Integration

### Setup

1. Create Stripe account at https://stripe.com
2. Get API keys from Stripe Dashboard
3. Add to `.env`:
   ```bash
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

### Usage

```typescript
// Create payment intent
const response = await fetch('/api/payment/create-intent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 10000, // in cents
    currency: 'usd',
  }),
});
```

### Webhook Setup

Configure webhook endpoint: `/api/webhooks/stripe`

Events to listen for:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

## Paystack Integration

### Setup

1. Create Paystack account at https://paystack.com
2. Get API keys from Paystack Dashboard
3. Add to `.env`:
   ```bash
   PAYSTACK_SECRET_KEY="sk_test_..."
   PAYSTACK_PUBLIC_KEY="pk_test_..."
   ```

### Usage

```typescript
// Initialize payment
const response = await fetch('/api/payment/paystack', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 10000, // in kobo (for NGN)
    currency: 'NGN',
  }),
});

const { authorizationUrl } = await response.json();
// Redirect user to authorizationUrl
```

### Verification

After payment, verify transaction:

```typescript
const verifyResponse = await fetch(
  `/api/payment/paystack/verify?reference=${reference}`
);
```

## Flutterwave Integration

### Setup

1. Create Flutterwave account at https://flutterwave.com
2. Get API keys from Flutterwave Dashboard
3. Add to `.env`:
   ```bash
   FLUTTERWAVE_SECRET_KEY="FLWSECK_TEST-..."
   FLUTTERWAVE_PUBLIC_KEY="FLWPUBK_TEST-..."
   ```

### Usage

```typescript
// Initialize payment
const response = await fetch('/api/payment/flutterwave', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 100,
    currency: 'NGN',
  }),
});

const { paymentLink } = await response.json();
// Redirect user to paymentLink
```

## Coinbase Commerce Integration

### Setup

1. Create Coinbase Commerce account at https://commerce.coinbase.com
2. Get API key from Commerce Dashboard
3. Add to `.env`:
   ```bash
   COINBASE_API_KEY="..."
   COINBASE_WEBHOOK_SECRET="..."
   ```

### Usage

```typescript
// Create charge
const response = await fetch('/api/payment/coinbase', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 100,
    currency: 'USD',
  }),
});

const { hostedUrl } = await response.json();
// Redirect user to hostedUrl
```

## Currency Conversion

All payment amounts should be in the smallest unit of the currency:

- **USD/EUR/GBP**: cents (divide by 100)
- **NGN**: kobo (divide by 100)
- **GHS**: pesewas (divide by 100)
- **ZAR/KES**: cents (divide by 100)

Use the conversion utilities:

```typescript
import { convertToSmallestUnit } from '@/lib/payment/paystack';

const amountInKobo = convertToSmallestUnit(100, 'NGN'); // 10000
```

## Payment Flow

1. User initiates deposit
2. Select payment gateway
3. Create payment request via API
4. Redirect user to payment gateway
5. User completes payment
6. Webhook/callback verifies payment
7. Update transaction status
8. Update user balance
9. Send notification

## Testing

### Stripe Test Cards

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

### Paystack Test Cards

- Success: `4084 0840 8408 4081`
- Decline: `5060 6666 6666 6666 6666`

## Security Best Practices

1. Never expose secret keys in frontend
2. Always verify webhook signatures
3. Use HTTPS for all payment endpoints
4. Validate amounts server-side
5. Implement rate limiting
6. Log all payment attempts
7. Use idempotency keys for retries

## Error Handling

All payment APIs return consistent error format:

```json
{
  "error": "Error message",
  "details": {} // Optional additional details
}
```

Handle errors appropriately:
- Network errors: Retry with exponential backoff
- Invalid card: Show user-friendly message
- Insufficient funds: Suggest alternative payment method
- Gateway errors: Log and notify admin
