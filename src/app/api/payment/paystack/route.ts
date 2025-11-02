/**
 * Paystack payment API endpoint
 * POST /api/payment/paystack
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { initializePaystackPayment, convertToSmallestUnit } from '@/lib/payment/paystack';
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

    // Convert amount to smallest unit (kobo for NGN)
    const amountInSmallestUnit = convertToSmallestUnit(amount, currency);

    // Initialize Paystack payment
    const payment = await initializePaystackPayment({
      amount: amountInSmallestUnit,
      email: session.user.email!,
      currency,
      metadata: {
        userId: session.user.id,
        investmentId: investmentId || '',
        type: 'deposit',
      },
      callback_url: `${process.env.NEXTAUTH_URL}/dashboard/deposit?status=success`,
    });

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        investmentId: investmentId || null,
        type: 'DEPOSIT',
        status: 'PENDING',
        amount: amount,
        currency,
        paymentMethod: 'paystack',
        paymentReference: payment.data.reference,
        paymentGateway: 'paystack',
        description: `Deposit via Paystack - ${currency} ${amount}`,
      },
    });

    logger.info('Paystack payment initialized', {
      transactionId: transaction.id,
      reference: payment.data.reference,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      authorizationUrl: payment.data.authorization_url,
      reference: payment.data.reference,
      transactionId: transaction.id,
    });
  } catch (error: any) {
    logger.error('Failed to initialize Paystack payment', error);
    
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
