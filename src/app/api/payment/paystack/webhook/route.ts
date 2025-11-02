/**
 * Paystack Webhook Handler
 * POST /api/payment/paystack/webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyTransaction } from '@/lib/payment/paystack';
import { logger } from '@/lib/utils/logger';
import crypto from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

/**
 * Verify Paystack webhook signature
 */
function verifySignature(body: string, signature: string): boolean {
  if (!PAYSTACK_SECRET_KEY) {
    return false;
  }

  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(body)
    .digest('hex');

  return hash === signature;
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Missing signature' },
        { status: 400 }
      );
    }

    const body = await request.text();

    // Verify signature
    if (!verifySignature(body, signature)) {
      logger.warn('Invalid Paystack webhook signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);

    logger.info('Paystack webhook received', {
      event: event.event,
      reference: event.data.reference,
    });

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event.data);
        break;

      case 'transfer.success':
        await handleTransferSuccess(event.data);
        break;

      case 'transfer.failed':
        await handleTransferFailed(event.data);
        break;

      default:
        logger.info('Unhandled Paystack event', { event: event.event });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to process Paystack webhook', error);

    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful charge (deposit)
 */
async function handleChargeSuccess(data: any) {
  try {
    const reference = data.reference;

    // Find transaction
    const transaction = await prisma.transaction.findUnique({
      where: { paymentReference: reference },
    });

    if (!transaction) {
      logger.warn('Transaction not found', { reference });
      return;
    }

    if (transaction.status === 'COMPLETED') {
      logger.info('Transaction already processed', { reference });
      return;
    }

    // Verify with Paystack API
    const verification = await verifyTransaction(reference);

    if (verification.data.status === 'success') {
      // Update transaction status
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'COMPLETED',
        },
      });

      // Add to user's withdrawal balance
      await prisma.user.update({
        where: { id: transaction.userId },
        data: {
          withdrawalBalance: {
            increment: transaction.amount,
          },
        },
      });

      logger.info('Deposit processed successfully', {
        transactionId: transaction.id,
        userId: transaction.userId,
        amount: transaction.amount,
      });
    }
  } catch (error) {
    logger.error('Failed to handle charge success', error);
  }
}

/**
 * Handle successful transfer (withdrawal)
 */
async function handleTransferSuccess(data: any) {
  try {
    const reference = data.reference;

    const transaction = await prisma.transaction.findUnique({
      where: { paymentReference: reference },
    });

    if (!transaction) {
      logger.warn('Transaction not found', { reference });
      return;
    }

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'COMPLETED',
      },
    });

    logger.info('Withdrawal processed successfully', {
      transactionId: transaction.id,
      reference,
    });
  } catch (error) {
    logger.error('Failed to handle transfer success', error);
  }
}

/**
 * Handle failed transfer
 */
async function handleTransferFailed(data: any) {
  try {
    const reference = data.reference;

    const transaction = await prisma.transaction.findUnique({
      where: { paymentReference: reference },
    });

    if (!transaction) {
      return;
    }

    // Update transaction status to failed
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'FAILED',
      },
    });

    // Refund user's balance
    await prisma.user.update({
      where: { id: transaction.userId },
      data: {
        withdrawalBalance: {
          increment: transaction.amount,
        },
      },
    });

    logger.info('Withdrawal failed, balance refunded', {
      transactionId: transaction.id,
      reference,
    });
  } catch (error) {
    logger.error('Failed to handle transfer failure', error);
  }
}
