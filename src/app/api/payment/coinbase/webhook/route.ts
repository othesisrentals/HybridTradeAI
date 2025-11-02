/**
 * Coinbase Commerce Webhook Handler
 * POST /api/payment/coinbase/webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyWebhookSignature } from '@/lib/payment/coinbase';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-cc-webhook-signature');

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Missing signature' },
        { status: 400 }
      );
    }

    const body = await request.text();

    // Verify signature
    if (!verifyWebhookSignature(signature, body)) {
      logger.warn('Invalid Coinbase Commerce webhook signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);

    logger.info('Coinbase Commerce webhook received', {
      event: event.event.type,
      chargeCode: event.event.data.code,
    });

    const eventType = event.event.type;
    const charge = event.event.data;

    // Handle different event types
    switch (eventType) {
      case 'charge:confirmed':
        await handleChargeConfirmed(charge);
        break;

      case 'charge:failed':
        await handleChargeFailed(charge);
        break;

      case 'charge:delayed':
        await handleChargeDelayed(charge);
        break;

      case 'charge:pending':
        await handleChargePending(charge);
        break;

      case 'charge:resolved':
        await handleChargeResolved(charge);
        break;

      default:
        logger.info('Unhandled Coinbase Commerce event', { eventType });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to process Coinbase Commerce webhook', error);

    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle confirmed charge (payment completed)
 */
async function handleChargeConfirmed(charge: any) {
  try {
    const metadata = charge.metadata;
    const transactionId = metadata.transactionId;

    if (!transactionId) {
      logger.warn('Transaction ID not found in metadata', {
        chargeCode: charge.code,
      });
      return;
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      logger.warn('Transaction not found', { transactionId });
      return;
    }

    if (transaction.status === 'COMPLETED') {
      logger.info('Transaction already processed', { transactionId });
      return;
    }

    // Update transaction status
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'COMPLETED',
        data: {
          ...((transaction.data as any) || {}),
          confirmedAt: charge.confirmed_at,
          payments: charge.payments,
        },
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

    logger.info('Crypto deposit processed successfully', {
      transactionId: transaction.id,
      userId: transaction.userId,
      amount: transaction.amount,
      chargeCode: charge.code,
    });
  } catch (error) {
    logger.error('Failed to handle charge confirmed', error);
  }
}

/**
 * Handle failed charge
 */
async function handleChargeFailed(charge: any) {
  try {
    const metadata = charge.metadata;
    const transactionId = metadata.transactionId;

    if (!transactionId) {
      return;
    }

    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'FAILED',
        data: {
          ...((await prisma.transaction.findUnique({ where: { id: transactionId } }))?.data as any || {}),
          failureReason: 'Charge failed',
        },
      },
    });

    logger.info('Crypto deposit failed', {
      transactionId,
      chargeCode: charge.code,
    });
  } catch (error) {
    logger.error('Failed to handle charge failed', error);
  }
}

/**
 * Handle delayed charge (payment detected but unconfirmed)
 */
async function handleChargeDelayed(charge: any) {
  try {
    const metadata = charge.metadata;
    const transactionId = metadata.transactionId;

    if (!transactionId) {
      return;
    }

    // Update transaction with delay information
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        data: {
          ...((await prisma.transaction.findUnique({ where: { id: transactionId } }))?.data as any || {}),
          delayed: true,
          delayedAt: new Date().toISOString(),
        },
      },
    });

    logger.info('Crypto deposit delayed', {
      transactionId,
      chargeCode: charge.code,
    });
  } catch (error) {
    logger.error('Failed to handle charge delayed', error);
  }
}

/**
 * Handle pending charge
 */
async function handleChargePending(charge: any) {
  try {
    const metadata = charge.metadata;
    const transactionId = metadata.transactionId;

    if (!transactionId) {
      return;
    }

    logger.info('Crypto deposit pending', {
      transactionId,
      chargeCode: charge.code,
    });
  } catch (error) {
    logger.error('Failed to handle charge pending', error);
  }
}

/**
 * Handle resolved charge
 */
async function handleChargeResolved(charge: any) {
  try {
    const metadata = charge.metadata;
    const transactionId = metadata.transactionId;

    if (!transactionId) {
      return;
    }

    logger.info('Crypto deposit resolved', {
      transactionId,
      chargeCode: charge.code,
    });
  } catch (error) {
    logger.error('Failed to handle charge resolved', error);
  }
}
