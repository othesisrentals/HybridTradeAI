/**
 * Paystack Payment Gateway Integration
 * Supports payments in NGN, GHS, ZAR, and USD
 */

import axios from 'axios';
import { logger } from '@/lib/utils/logger';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export interface PaystackInitializePayload {
  email: string;
  amount: number; // in kobo (smallest currency unit)
  currency?: 'NGN' | 'GHS' | 'ZAR' | 'USD';
  reference?: string;
  callback_url?: string;
  metadata?: Record<string, any>;
  channels?: string[]; // ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']
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
    id: number;
    domain: string;
    status: 'success' | 'failed' | 'abandoned';
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: Record<string, any>;
    customer: {
      id: number;
      email: string;
      customer_code: string;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
    };
  };
}

/**
 * Get Paystack API headers
 */
function getHeaders() {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY not configured');
  }

  return {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Initialize a payment transaction
 */
export async function initializeTransaction(
  payload: PaystackInitializePayload
): Promise<PaystackInitializeResponse> {
  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      payload,
      { headers: getHeaders() }
    );

    logger.info('Paystack transaction initialized', {
      reference: response.data.data.reference,
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to initialize Paystack transaction', {
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
  reference: string
): Promise<PaystackVerifyResponse> {
  try {
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      { headers: getHeaders() }
    );

    logger.info('Paystack transaction verified', {
      reference,
      status: response.data.data.status,
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to verify Paystack transaction', {
      reference,
      error: error.response?.data || error.message,
    });
    throw new Error(
      error.response?.data?.message || 'Failed to verify payment'
    );
  }
}

/**
 * List all supported banks
 */
export async function listBanks(
  country: 'nigeria' | 'ghana' | 'south-africa' = 'nigeria'
): Promise<any> {
  try {
    const response = await axios.get(`${PAYSTACK_BASE_URL}/bank`, {
      params: { country },
      headers: getHeaders(),
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to fetch banks', error);
    throw new Error('Failed to fetch banks');
  }
}

/**
 * Resolve account number to account name
 */
export async function resolveAccountNumber(
  accountNumber: string,
  bankCode: string
): Promise<any> {
  try {
    const response = await axios.get(`${PAYSTACK_BASE_URL}/bank/resolve`, {
      params: {
        account_number: accountNumber,
        bank_code: bankCode,
      },
      headers: getHeaders(),
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to resolve account', error);
    throw new Error('Failed to resolve account');
  }
}

/**
 * Create a transfer recipient
 */
export async function createTransferRecipient(
  type: 'nuban' | 'mobile_money' | 'basa',
  name: string,
  accountNumber: string,
  bankCode: string,
  currency: string = 'NGN'
): Promise<any> {
  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transferrecipient`,
      {
        type,
        name,
        account_number: accountNumber,
        bank_code: bankCode,
        currency,
      },
      { headers: getHeaders() }
    );

    logger.info('Transfer recipient created', {
      recipientCode: response.data.data.recipient_code,
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to create transfer recipient', error);
    throw new Error('Failed to create transfer recipient');
  }
}

/**
 * Initiate a transfer
 */
export async function initiateTransfer(
  amount: number, // in kobo
  recipientCode: string,
  reason?: string,
  reference?: string
): Promise<any> {
  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transfer`,
      {
        source: 'balance',
        amount,
        recipient: recipientCode,
        reason: reason || 'Withdrawal',
        reference,
      },
      { headers: getHeaders() }
    );

    logger.info('Transfer initiated', {
      reference: response.data.data.reference,
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to initiate transfer', error);
    throw new Error('Failed to initiate transfer');
  }
}

/**
 * Verify transfer
 */
export async function verifyTransfer(reference: string): Promise<any> {
  try {
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transfer/verify/${reference}`,
      { headers: getHeaders() }
    );

    return response.data;
  } catch (error: any) {
    logger.error('Failed to verify transfer', error);
    throw new Error('Failed to verify transfer');
  }
}

/**
 * Convert amount to kobo (smallest unit)
 */
export function toKobo(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert kobo to main currency unit
 */
export function fromKobo(kobo: number): number {
  return kobo / 100;
}
