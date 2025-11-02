/**
 * Coinbase Commerce integration
 * For cryptocurrency payments
 */

import { Client, Charge, Resource } from 'coinbase-commerce-node';
import { logger } from '@/lib/utils/logger';

const COINBASE_API_KEY = process.env.COINBASE_API_KEY;
const COINBASE_WEBHOOK_SECRET = process.env.COINBASE_WEBHOOK_SECRET;

// Initialize Coinbase Commerce client
if (COINBASE_API_KEY) {
  Client.init(COINBASE_API_KEY);
}

export interface CoinbaseChargeParams {
  name: string;
  description?: string;
  amount: number; // in USD
  currency?: string; // USD, BTC, ETH, etc.
  metadata?: Record<string, string>;
  pricing_type?: 'fixed_price' | 'no_price';
}

export interface CoinbaseChargeResponse {
  id: string;
  resource: 'charge';
  code: string;
  name: string;
  description: string;
  logo_url?: string;
  hosted_url: string;
  created_at: string;
  expires_at: string;
  confirmed_at?: string;
  checkout?: {
    id: string;
  };
  timeline: Array<{
    time: string;
    status: string;
  }>;
  metadata: Record<string, string>;
  pricing: {
    local: {
      amount: string;
      currency: string;
    };
    bitcoin?: {
      amount: string;
      currency: string;
    };
    ethereum?: {
      amount: string;
      currency: string;
    };
  };
  payments: Array<{
    network: string;
    transaction_id: string;
    status: string;
    value: {
      local: {
        amount: string;
        currency: string;
      };
      crypto?: {
        amount: string;
        currency: string;
      };
    };
  }>;
}

/**
 * Create a Coinbase Commerce charge
 */
export async function createCoinbaseCharge(
  params: CoinbaseChargeParams
): Promise<CoinbaseChargeResponse> {
  if (!COINBASE_API_KEY) {
    throw new Error('COINBASE_API_KEY is not configured');
  }

  try {
    const chargeData: any = {
      name: params.name,
      description: params.description,
      pricing_type: params.pricing_type || 'fixed_price',
      local_price: {
        amount: params.amount.toFixed(2),
        currency: params.currency || 'USD',
      },
      metadata: params.metadata || {},
    };

    const charge = await Charge.create(chargeData);

    logger.info('Coinbase charge created', {
      chargeId: charge.id,
      code: charge.code,
    });

    return charge as unknown as CoinbaseChargeResponse;
  } catch (error: any) {
    logger.error('Failed to create Coinbase charge', error);
    throw new Error(
      error.message || 'Failed to create Coinbase charge'
    );
  }
}

/**
 * Retrieve a Coinbase Commerce charge
 */
export async function retrieveCoinbaseCharge(
  chargeId: string
): Promise<CoinbaseChargeResponse> {
  if (!COINBASE_API_KEY) {
    throw new Error('COINBASE_API_KEY is not configured');
  }

  try {
    const charge = await Charge.retrieve(chargeId);

    logger.info('Coinbase charge retrieved', {
      chargeId,
      status: charge.timeline[charge.timeline.length - 1]?.status,
    });

    return charge as unknown as CoinbaseChargeResponse;
  } catch (error: any) {
    logger.error('Failed to retrieve Coinbase charge', error);
    throw new Error(
      error.message || 'Failed to retrieve Coinbase charge'
    );
  }
}

/**
 * Verify Coinbase webhook signature
 */
export function verifyCoinbaseWebhook(
  payload: string,
  signature: string
): boolean {
  if (!COINBASE_WEBHOOK_SECRET) {
    logger.warn('COINBASE_WEBHOOK_SECRET not configured, skipping verification');
    return true; // Allow in development
  }

  try {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', COINBASE_WEBHOOK_SECRET);
    const digest = hmac.update(payload).digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  } catch (error) {
    logger.error('Failed to verify Coinbase webhook', error);
    return false;
  }
}

export { COINBASE_WEBHOOK_SECRET };
