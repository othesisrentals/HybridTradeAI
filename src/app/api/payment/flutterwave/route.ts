/**
 * Flutterwave payment API endpoint
 * POST /api/payment/flutterwave
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { initializeFlutterwavePayment } from '@/lib/payment/flutterwave';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const paymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('NGN'),
  investmentId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, currency, investmentId } = paymentSchema.parse(body);

    // Generate unique transaction reference
    const txRef = `FLW-${Date.now()}-${session.user.id}`;

    // Initialize Flutterwave payment
    const payment = await initializeFlutterwavePayment({
      amount,
      email: session.user.email!,
      currency,
      tx_ref: txRef,
      customer: {
        email: session.user.email!,
        name: session.user.name || undefined,
      },
      metadata: {
        userId: session.user.id,
        investmentId: investmentId || '',
        type: 'deposit',
      },
      redirect_url: `${process.env.NEXTAUTH_URL}/dashboard/deposit?status=success`,
    });

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        investmentId: investmentId || null,
        type: 'DEPOSIT',
        status: 'PENDING',
        amount,
        currency,
        paymentMethod: 'flutterwave',
        paymentReference: txRef,
        paymentGateway: 'flutterwave',
        description: `Deposit via Flutterwave - ${currency} ${amount}`,
      },
    });

    logger.info('Flutterwave payment initialized', {
      transactionId: transaction.id,
      txRef,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      paymentLink: payment.data.link,
      txRef: payment.data.tx_ref,
      transactionId: transaction.id,
    });
  } catch (error: any) {
    logger.error('Failed to initialize Flutterwave payment', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}
