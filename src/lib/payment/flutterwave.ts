/**
 * Flutterwave payment gateway integration
 * For African markets
 */

import axios from 'axios';
import { logger } from '@/lib/utils/logger';

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
const FLUTTERWAVE_PUBLIC_KEY = process.env.FLUTTERWAVE_PUBLIC_KEY;
const FLUTTERWAVE_API_URL = 'https://api.flutterwave.com/v3';

export interface FlutterwaveInitializeParams {
  amount: number;
  email: string;
  currency?: string; // NGN, GHS, ZAR, KES, etc.
  tx_ref: string; // Unique transaction reference
  customer?: {
    email: string;
    name?: string;
    phone_number?: string;
  };
  metadata?: Record<string, any>;
  redirect_url?: string;
  payment_options?: string; // card, banktransfer, ussd, etc.
}

export interface FlutterwaveInitializeResponse {
  status: string;
  message: string;
  data: {
    link: string;
    tx_ref: string;
  };
}

export interface FlutterwaveVerifyResponse {
  status: string;
  message: string;
  data: {
    amount: number;
    currency: string;
    created_at: string;
    status: string;
    tx_ref: string;
    customer: {
      email: string;
      name: string;
    };
    meta?: Record<string, any>;
  };
}

/**
 * Initialize Flutterwave payment
 */
export async function initializeFlutterwavePayment(
  params: FlutterwaveInitializeParams
): Promise<FlutterwaveInitializeResponse> {
  if (!FLUTTERWAVE_SECRET_KEY) {
    throw new Error('FLUTTERWAVE_SECRET_KEY is not configured');
  }

  try {
    const response = await axios.post(
      `${FLUTTERWAVE_API_URL}/payments`,
      {
        tx_ref: params.tx_ref,
        amount: params.amount,
        currency: params.currency || 'NGN',
        redirect_url: params.redirect_url,
        payment_options: params.payment_options || 'card,banktransfer,ussd',
        customer: params.customer || {
          email: params.email,
        },
        meta: params.metadata,
      },
      {
        headers: {
          Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    logger.info('Flutterwave payment initialized', {
      tx_ref: params.tx_ref,
      email: params.email,
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to initialize Flutterwave payment', error);
    throw new Error(
      error.response?.data?.message || 'Failed to initialize Flutterwave payment'
    );
  }
}

/**
 * Verify Flutterwave transaction
 */
export async function verifyFlutterwaveTransaction(
  transactionId: string
): Promise<FlutterwaveVerifyResponse> {
  if (!FLUTTERWAVE_SECRET_KEY) {
    throw new Error('FLUTTERWAVE_SECRET_KEY is not configured');
  }

  try {
    const response = await axios.get(
      `${FLUTTERWAVE_API_URL}/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        },
      }
    );

    logger.info('Flutterwave transaction verified', {
      transactionId,
      status: response.data.data.status,
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to verify Flutterwave transaction', error);
    throw new Error(
      error.response?.data?.message || 'Failed to verify Flutterwave transaction'
    );
  }
}

export { FLUTTERWAVE_PUBLIC_KEY };
