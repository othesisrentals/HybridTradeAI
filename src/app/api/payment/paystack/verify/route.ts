/**
 * Verify Paystack payment
 * GET /api/payment/paystack/verify?reference=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { verifyPaystackTransaction } from '@/lib/payment/paystack';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reference = request.nextUrl.searchParams.get('reference');
    if (!reference) {
      return NextResponse.json(
        { error: 'Reference is required' },
        { status: 400 }
      );
    }

    // Verify with Paystack
    const verification = await verifyPaystackTransaction(reference);

    if (verification.data.status !== 'success') {
      return NextResponse.json(
        { error: 'Payment not successful', status: verification.data.status },
        { status: 400 }
      );
    }

    // Find transaction by reference
    const transaction = await prisma.transaction.findUnique({
      where: { paymentReference: reference },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Update transaction status
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'COMPLETED',
      },
    });

    // Update user balance if this is a deposit
    if (transaction.type === 'DEPOSIT') {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          withdrawalBalance: {
            increment: parseFloat(verification.data.amount.toString()) / 100, // Convert from kobo
          },
        },
      });
    }

    logger.info('Paystack payment verified', {
      transactionId: transaction.id,
      reference,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        status: 'COMPLETED',
        amount: verification.data.amount,
        currency: verification.data.currency,
      },
    });
  } catch (error: any) {
    logger.error('Failed to verify Paystack payment', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
