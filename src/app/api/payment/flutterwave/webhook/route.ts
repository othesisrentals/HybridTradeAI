/**
 * Flutterwave Webhook Handler
 * POST /api/payment/flutterwave/webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyTransaction, verifyWebhookSignature } from '@/lib/payment/flutterwave';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('verif-hash');

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Missing signature' },
        { status: 400 }
      );
    }

    const body = await request.text();

    // Verify signature
    if (!verifyWebhookSignature(signature, body)) {
      logger.warn('Invalid Flutterwave webhook signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);

    logger.info('Flutterwave webhook received', {
      event: event.event,
      tx_ref: event.data?.tx_ref,
    });

    // Handle charge completed event
    if (event.event === 'charge.completed') {
      await handleChargeCompleted(event.data);
    }

    // Handle transfer completed event
    if (event.event === 'transfer.completed') {
      await handleTransferCompleted(event.data);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to process Flutterwave webhook', error);

    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle completed charge (deposit)
 */
async function handleChargeCompleted(data: any) {
  try {
    const tx_ref = data.tx_ref;
    const transactionId = data.id;

    // Find transaction
    const transaction = await prisma.transaction.findUnique({
      where: { paymentReference: tx_ref },
    });

    if (!transaction) {
      logger.warn('Transaction not found', { tx_ref });
      return;
    }

    if (transaction.status === 'COMPLETED') {
      logger.info('Transaction already processed', { tx_ref });
      return;
    }

    // Verify with Flutterwave API
    const verification = await verifyTransaction(transactionId.toString());

    if (
      verification.data.status === 'successful' &&
      verification.data.amount === transaction.amount.toNumber() &&
      verification.data.currency === transaction.currency
    ) {
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
    } else {
      logger.warn('Transaction verification failed', {
        tx_ref,
        verification: verification.data,
      });
    }
  } catch (error) {
    logger.error('Failed to handle charge completed', error);
  }
}

/**
 * Handle completed transfer (withdrawal)
 */
async function handleTransferCompleted(data: any) {
  try {
    const reference = data.reference;
    const status = data.status;

    const transaction = await prisma.transaction.findUnique({
      where: { paymentReference: reference },
    });

    if (!transaction) {
      logger.warn('Transaction not found', { reference });
      return;
    }

    if (status === 'SUCCESSFUL') {
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
    } else if (status === 'FAILED') {
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
    }
  } catch (error) {
    logger.error('Failed to handle transfer completed', error);
  }
}
