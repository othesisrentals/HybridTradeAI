import Stripe from 'stripe';
import { logger } from '@/lib/utils/logger';

let stripeInstance: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
      typescript: true,
    });
  }
  return stripeInstance;
}

export interface CreatePaymentIntentParams {
  amount: number; // in cents
  userId: string;
  investmentId?: string;
  metadata?: Record<string, string>;
}

export async function createPaymentIntent(params: CreatePaymentIntentParams) {
  try {
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: params.amount,
      currency: 'usd',
      metadata: {
        userId: params.userId,
        investmentId: params.investmentId || '',
        ...params.metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    logger.info('Payment intent created', {
      paymentIntentId: paymentIntent.id,
      userId: params.userId,
      amount: params.amount,
    });

    return paymentIntent;
  } catch (error) {
    logger.error('Failed to create payment intent', error);
    throw error;
  }
}

export async function retrievePaymentIntent(paymentIntentId: string) {
  try {
    const stripe = getStripeClient();
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    logger.error('Failed to retrieve payment intent', error);
    throw error;
  }
}

export async function refundPayment(paymentIntentId: string, amount?: number) {
  try {
    const stripe = getStripeClient();
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount,
    });

    logger.info('Refund created', {
      refundId: refund.id,
      paymentIntentId,
      amount: refund.amount,
    });

    return refund;
  } catch (error) {
    logger.error('Failed to create refund', error);
    throw error;
  }
}

export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
  }

  try {
    const stripe = getStripeClient();
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    logger.error('Failed to construct webhook event', error);
    throw error;
  }
}

