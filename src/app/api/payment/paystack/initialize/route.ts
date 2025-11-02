/**
 * Paystack Initialize Payment API
 * POST /api/payment/paystack/initialize
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { initializeTransaction, toKobo } from '@/lib/payment/paystack';
import { logger } from '@/lib/utils/logger';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, currency } = body;

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate reference
    const reference = `PAYSTACK_DEP_${randomUUID()}`;

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: 'DEPOSIT',
        status: 'PENDING',
        amount,
        currency: currency || 'NGN',
        paymentMethod: 'paystack',
        paymentReference: reference,
        paymentGateway: 'paystack',
        description: 'Deposit via Paystack',
      },
    });

    // Initialize Paystack transaction
    const paystackResponse = await initializeTransaction({
      email: user.email,
      amount: toKobo(amount),
      currency: currency || 'NGN',
      reference,
      callback_url: `${process.env.NEXTAUTH_URL}/dashboard/deposit?status=success`,
      metadata: {
        userId: session.user.id,
        transactionId: transaction.id,
      },
      channels: ['card', 'bank', 'ussd', 'bank_transfer'],
    });

    logger.info('Paystack payment initialized', {
      userId: session.user.id,
      transactionId: transaction.id,
      reference,
    });

    return NextResponse.json({
      success: true,
      data: {
        authorizationUrl: paystackResponse.data.authorization_url,
        reference: paystackResponse.data.reference,
        transactionId: transaction.id,
      },
    });
  } catch (error: any) {
    logger.error('Failed to initialize Paystack payment', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to initialize payment',
      },
      { status: 500 }
    );
  }
}
