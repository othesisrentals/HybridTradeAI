import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { constructWebhookEvent } from '@/lib/payment/stripe';
import { prisma } from '@/lib/db/prisma';
import { notificationService } from '@/lib/notifications/service';
import { logger } from '@/lib/utils/logger';
import { TransactionStatus, NotificationType } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    const event = constructWebhookEvent(body, signature);

    logger.info('Stripe webhook received', { type: event.type });

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const userId = paymentIntent.metadata.userId;
        const investmentId = paymentIntent.metadata.investmentId;

        if (userId && investmentId) {
          // Update transaction status
          await prisma.transaction.updateMany({
            where: {
              userId,
              investmentId,
              paymentId: paymentIntent.id,
            },
            data: {
              status: TransactionStatus.COMPLETED,
            },
          });

          // Notify user
          await notificationService.create({
            userId,
            type: NotificationType.DEPOSIT_APPROVED,
            priority: 'HIGH',
            title: 'Payment Successful',
            message: `Your payment of $${(paymentIntent.amount / 100).toFixed(2)} was successful.`,
            actionUrl: `/dashboard/investments/${investmentId}`,
          });

          logger.info('Payment succeeded', {
            userId,
            investmentId,
            amount: paymentIntent.amount,
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const userId = paymentIntent.metadata.userId;
        const investmentId = paymentIntent.metadata.investmentId;

        if (userId && investmentId) {
          // Update transaction status
          await prisma.transaction.updateMany({
            where: {
              userId,
              investmentId,
              paymentId: paymentIntent.id,
            },
            data: {
              status: TransactionStatus.FAILED,
              failureReason: paymentIntent.last_payment_error?.message,
            },
          });

          // Notify user
          await notificationService.create({
            userId,
            type: NotificationType.SYSTEM_ALERT,
            priority: 'HIGH',
            title: 'Payment Failed',
            message: `Your payment failed. Please try again or contact support.`,
            actionUrl: '/dashboard',
          });

          logger.warn('Payment failed', {
            userId,
            investmentId,
            error: paymentIntent.last_payment_error?.message,
          });
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        logger.info('Charge refunded', { chargeId: charge.id });
        // Handle refund logic here
        break;
      }

      default:
        logger.debug('Unhandled webhook event type', { type: event.type });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    logger.error('Webhook error', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 400 }
    );
  }
}
