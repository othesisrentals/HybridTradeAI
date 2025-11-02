/**
 * Coinbase Commerce Payment Gateway Integration
 * Supports cryptocurrency payments (BTC, ETH, USDC, etc.)
 */

import axios from 'axios';
import { logger } from '@/lib/utils/logger';

const COINBASE_API_KEY = process.env.COINBASE_COMMERCE_API_KEY;
const COINBASE_WEBHOOK_SECRET = process.env.COINBASE_WEBHOOK_SECRET;
const COINBASE_BASE_URL = 'https://api.commerce.coinbase.com';

export interface CoinbaseCreateChargePayload {
  name: string;
  description: string;
  pricing_type: 'fixed_price' | 'no_price';
  local_price: {
    amount: string;
    currency: string;
  };
  metadata?: Record<string, any>;
  redirect_url?: string;
  cancel_url?: string;
}

export interface CoinbaseCharge {
  id: string;
  resource: 'charge';
  code: string;
  name: string;
  description: string;
  logo_url: string;
  hosted_url: string;
  created_at: string;
  expires_at: string;
  confirmed_at: string | null;
  checkout: {
    id: string;
  };
  timeline: Array<{
    time: string;
    status: string;
    context?: string;
  }>;
  metadata: Record<string, any>;
  pricing_type: string;
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
      crypto: {
        amount: string;
        currency: string;
      };
      local: {
        amount: string;
        currency: string;
      };
    };
  }>;
  addresses: {
    bitcoin?: string;
    ethereum?: string;
    usdc?: string;
    litecoin?: string;
  };
}

export interface CoinbaseChargeResponse {
  data: CoinbaseCharge;
}

/**
 * Get Coinbase Commerce API headers
 */
function getHeaders() {
  if (!COINBASE_API_KEY) {
    throw new Error('COINBASE_COMMERCE_API_KEY not configured');
  }

  return {
    'X-CC-Api-Key': COINBASE_API_KEY,
    'X-CC-Version': '2018-03-22',
    'Content-Type': 'application/json',
  };
}

/**
 * Create a charge
 */
export async function createCharge(
  payload: CoinbaseCreateChargePayload
): Promise<CoinbaseChargeResponse> {
  try {
    const response = await axios.post(
      `${COINBASE_BASE_URL}/charges`,
      payload,
      { headers: getHeaders() }
    );

    logger.info('Coinbase Commerce charge created', {
      chargeId: response.data.data.id,
      code: response.data.data.code,
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to create Coinbase Commerce charge', {
      error: error.response?.data || error.message,
    });
    throw new Error(
      error.response?.data?.error?.message || 'Failed to create charge'
    );
  }
}

/**
 * Get charge details
 */
export async function getCharge(chargeCode: string): Promise<CoinbaseChargeResponse> {
  try {
    const response = await axios.get(
      `${COINBASE_BASE_URL}/charges/${chargeCode}`,
      { headers: getHeaders() }
    );

    return response.data;
  } catch (error: any) {
    logger.error('Failed to get Coinbase Commerce charge', {
      chargeCode,
      error: error.response?.data || error.message,
    });
    throw new Error(
      error.response?.data?.error?.message || 'Failed to get charge'
    );
  }
}

/**
 * List all charges
 */
export async function listCharges(limit: number = 25): Promise<any> {
  try {
    const response = await axios.get(`${COINBASE_BASE_URL}/charges`, {
      params: { limit },
      headers: getHeaders(),
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to list charges', error);
    throw new Error('Failed to list charges');
  }
}

/**
 * Cancel a charge
 */
export async function cancelCharge(chargeCode: string): Promise<any> {
  try {
    const response = await axios.post(
      `${COINBASE_BASE_URL}/charges/${chargeCode}/cancel`,
      {},
      { headers: getHeaders() }
    );

    logger.info('Coinbase Commerce charge cancelled', { chargeCode });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to cancel charge', error);
    throw new Error('Failed to cancel charge');
  }
}

/**
 * Resolve a charge
 */
export async function resolveCharge(chargeCode: string): Promise<any> {
  try {
    const response = await axios.post(
      `${COINBASE_BASE_URL}/charges/${chargeCode}/resolve`,
      {},
      { headers: getHeaders() }
    );

    logger.info('Coinbase Commerce charge resolved', { chargeCode });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to resolve charge', error);
    throw new Error('Failed to resolve charge');
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  signature: string,
  payload: string
): boolean {
  if (!COINBASE_WEBHOOK_SECRET) {
    return false;
  }

  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha256', COINBASE_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return hash === signature;
}

/**
 * Get supported cryptocurrencies
 */
export const supportedCryptos = [
  'BTC',  // Bitcoin
  'ETH',  // Ethereum
  'USDC', // USD Coin
  'DAI',  // Dai Stablecoin
  'LTC',  // Litecoin
  'BCH',  // Bitcoin Cash
  'DOGE', // Dogecoin
] as const;

export type SupportedCrypto = (typeof supportedCryptos)[number];
