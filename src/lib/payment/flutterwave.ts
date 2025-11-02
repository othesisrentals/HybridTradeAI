/**
 * Flutterwave Payment Gateway Integration
 * Supports payments across Africa and globally
 */

import axios from 'axios';
import { logger } from '@/lib/utils/logger';

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
const FLUTTERWAVE_PUBLIC_KEY = process.env.FLUTTERWAVE_PUBLIC_KEY;
const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';

export interface FlutterwaveInitializePayload {
  tx_ref: string;
  amount: number;
  currency: string;
  redirect_url: string;
  customer: {
    email: string;
    phonenumber?: string;
    name?: string;
  };
  customizations?: {
    title?: string;
    description?: string;
    logo?: string;
  };
  meta?: Record<string, any>;
  payment_options?: string; // e.g., 'card,mobilemoney,ussd,banktransfer'
}

export interface FlutterwaveInitializeResponse {
  status: 'success' | 'error';
  message: string;
  data: {
    link: string;
  };
}

export interface FlutterwaveVerifyResponse {
  status: 'success' | 'error';
  message: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    device_fingerprint: string;
    amount: number;
    currency: string;
    charged_amount: number;
    app_fee: number;
    merchant_fee: number;
    processor_response: string;
    auth_model: string;
    ip: string;
    narration: string;
    status: 'successful' | 'failed' | 'pending';
    payment_type: string;
    created_at: string;
    account_id: number;
    customer: {
      id: number;
      name: string;
      phone_number: string;
      email: string;
      created_at: string;
    };
    card?: {
      first_6digits: string;
      last_4digits: string;
      issuer: string;
      country: string;
      type: string;
      expiry: string;
    };
  };
}

/**
 * Get Flutterwave API headers
 */
function getHeaders() {
  if (!FLUTTERWAVE_SECRET_KEY) {
    throw new Error('FLUTTERWAVE_SECRET_KEY not configured');
  }

  return {
    Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Initialize a payment transaction
 */
export async function initializeTransaction(
  payload: FlutterwaveInitializePayload
): Promise<FlutterwaveInitializeResponse> {
  try {
    const response = await axios.post(
      `${FLUTTERWAVE_BASE_URL}/payments`,
      payload,
      { headers: getHeaders() }
    );

    logger.info('Flutterwave transaction initialized', {
      tx_ref: payload.tx_ref,
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to initialize Flutterwave transaction', {
      error: error.response?.data || error.message,
    });
    throw new Error(
      error.response?.data?.message || 'Failed to initialize payment'
    );
  }
}

/**
 * Verify a transaction
 */
export async function verifyTransaction(
  transactionId: string
): Promise<FlutterwaveVerifyResponse> {
  try {
    const response = await axios.get(
      `${FLUTTERWAVE_BASE_URL}/transactions/${transactionId}/verify`,
      { headers: getHeaders() }
    );

    logger.info('Flutterwave transaction verified', {
      transactionId,
      status: response.data.data.status,
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to verify Flutterwave transaction', {
      transactionId,
      error: error.response?.data || error.message,
    });
    throw new Error(
      error.response?.data?.message || 'Failed to verify payment'
    );
  }
}

/**
 * Get list of banks for a country
 */
export async function listBanks(country: string): Promise<any> {
  try {
    const response = await axios.get(`${FLUTTERWAVE_BASE_URL}/banks/${country}`, {
      headers: getHeaders(),
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to fetch banks', error);
    throw new Error('Failed to fetch banks');
  }
}

/**
 * Create a transfer
 */
export async function createTransfer(
  accountBank: string,
  accountNumber: string,
  amount: number,
  narration: string,
  currency: string = 'NGN',
  reference?: string
): Promise<any> {
  try {
    const response = await axios.post(
      `${FLUTTERWAVE_BASE_URL}/transfers`,
      {
        account_bank: accountBank,
        account_number: accountNumber,
        amount,
        narration,
        currency,
        reference,
        callback_url: `${process.env.NEXTAUTH_URL}/api/payment/flutterwave/webhook`,
        debit_currency: currency,
      },
      { headers: getHeaders() }
    );

    logger.info('Flutterwave transfer created', {
      reference: response.data.data.reference,
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to create transfer', error);
    throw new Error(
      error.response?.data?.message || 'Failed to create transfer'
    );
  }
}

/**
 * Get transfer details
 */
export async function getTransfer(transferId: string): Promise<any> {
  try {
    const response = await axios.get(
      `${FLUTTERWAVE_BASE_URL}/transfers/${transferId}`,
      { headers: getHeaders() }
    );

    return response.data;
  } catch (error: any) {
    logger.error('Failed to get transfer', error);
    throw new Error('Failed to get transfer');
  }
}

/**
 * Get all transfers
 */
export async function listTransfers(status?: 'pending' | 'successful' | 'failed'): Promise<any> {
  try {
    const params: any = {};
    if (status) {
      params.status = status;
    }

    const response = await axios.get(`${FLUTTERWAVE_BASE_URL}/transfers`, {
      params,
      headers: getHeaders(),
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to list transfers', error);
    throw new Error('Failed to list transfers');
  }
}

/**
 * Get balance
 */
export async function getBalance(currency: string = 'NGN'): Promise<any> {
  try {
    const response = await axios.get(
      `${FLUTTERWAVE_BASE_URL}/balances/${currency}`,
      { headers: getHeaders() }
    );

    return response.data;
  } catch (error: any) {
    logger.error('Failed to get balance', error);
    throw new Error('Failed to get balance');
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  signature: string,
  payload: string
): boolean {
  if (!FLUTTERWAVE_SECRET_KEY) {
    return false;
  }

  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha256', FLUTTERWAVE_SECRET_KEY)
    .update(payload)
    .digest('hex');

  return hash === signature;
}

export const flutterwavePublicKey = FLUTTERWAVE_PUBLIC_KEY;
