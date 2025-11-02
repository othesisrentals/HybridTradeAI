/**
 * Flutterwave Initialize Payment API
 * POST /api/payment/flutterwave/initialize
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { initializeTransaction } from '@/lib/payment/flutterwave';
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
      select: { email: true, name: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate reference
    const tx_ref = `FLW_DEP_${randomUUID()}`;

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: 'DEPOSIT',
        status: 'PENDING',
        amount,
        currency: currency || 'NGN',
        paymentMethod: 'flutterwave',
        paymentReference: tx_ref,
        paymentGateway: 'flutterwave',
        description: 'Deposit via Flutterwave',
      },
    });

    // Initialize Flutterwave transaction
    const flutterwaveResponse = await initializeTransaction({
      tx_ref,
      amount,
      currency: currency || 'NGN',
      redirect_url: `${process.env.NEXTAUTH_URL}/dashboard/deposit?status=success`,
      customer: {
        email: user.email,
        name: user.name || undefined,
      },
      customizations: {
        title: 'Deposit to HybridTradeAI',
        description: 'Fund your investment account',
      },
      meta: {
        userId: session.user.id,
        transactionId: transaction.id,
      },
      payment_options: 'card,mobilemoney,ussd,banktransfer',
    });

    logger.info('Flutterwave payment initialized', {
      userId: session.user.id,
      transactionId: transaction.id,
      tx_ref,
    });

    return NextResponse.json({
      success: true,
      data: {
        paymentLink: flutterwaveResponse.data.link,
        reference: tx_ref,
        transactionId: transaction.id,
      },
    });
  } catch (error: any) {
    logger.error('Failed to initialize Flutterwave payment', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to initialize payment',
      },
      { status: 500 }
    );
  }
}
