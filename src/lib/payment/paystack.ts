/**
 * Paystack payment gateway integration
 * For Nigerian and African markets
 */

import axios from 'axios';
import { logger } from '@/lib/utils/logger';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;
const PAYSTACK_API_URL = 'https://api.paystack.co';

export interface PaystackInitializeParams {
  amount: number; // in kobo (smallest currency unit)
  email: string;
  reference?: string;
  currency?: string; // NGN, GHS, ZAR, etc.
  metadata?: Record<string, any>;
  callback_url?: string;
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    amount: number;
    currency: string;
    transaction_date: string;
    status: string;
    reference: string;
    customer: {
      email: string;
    };
    metadata?: Record<string, any>;
  };
}

/**
 * Initialize Paystack payment
 */
export async function initializePaystackPayment(
  params: PaystackInitializeParams
): Promise<PaystackInitializeResponse> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured');
  }

  try {
    const response = await axios.post(
      `${PAYSTACK_API_URL}/transaction/initialize`,
      {
        amount: params.amount,
        email: params.email,
        reference: params.reference,
        currency: params.currency || 'NGN',
        metadata: params.metadata,
        callback_url: params.callback_url,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    logger.info('Paystack payment initialized', {
      reference: response.data.data.reference,
      email: params.email,
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to initialize Paystack payment', error);
    throw new Error(
      error.response?.data?.message || 'Failed to initialize Paystack payment'
    );
  }
}

/**
 * Verify Paystack transaction
 */
export async function verifyPaystackTransaction(
  reference: string
): Promise<PaystackVerifyResponse> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured');
  }

  try {
    const response = await axios.get(
      `${PAYSTACK_API_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    logger.info('Paystack transaction verified', {
      reference,
      status: response.data.data.status,
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to verify Paystack transaction', error);
    throw new Error(
      error.response?.data?.message || 'Failed to verify Paystack transaction'
    );
  }
}

/**
 * Convert amount to kobo (smallest currency unit for NGN)
 */
export function convertToSmallestUnit(amount: number, currency: string): number {
  const multipliers: Record<string, number> = {
    NGN: 100, // 1 NGN = 100 kobo
    GHS: 100, // 1 GHS = 100 pesewas
    ZAR: 100, // 1 ZAR = 100 cents
    KES: 100, // 1 KES = 100 cents
  };

  return Math.round(amount * (multipliers[currency] || 100));
}

export { PAYSTACK_PUBLIC_KEY };
