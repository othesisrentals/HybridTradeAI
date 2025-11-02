/**
 * Coinbase Commerce Initialize Payment API
 * POST /api/payment/coinbase/initialize
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { createCharge } from '@/lib/payment/coinbase';
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
    const reference = `COINBASE_DEP_${randomUUID()}`;

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: 'DEPOSIT',
        status: 'PENDING',
        amount,
        currency: currency || 'USD',
        paymentMethod: 'coinbase',
        paymentReference: reference,
        paymentGateway: 'coinbase',
        description: 'Crypto Deposit via Coinbase Commerce',
      },
    });

    // Create Coinbase Commerce charge
    const chargeResponse = await createCharge({
      name: 'HybridTradeAI Deposit',
      description: `Deposit $${amount} to investment account`,
      pricing_type: 'fixed_price',
      local_price: {
        amount: amount.toString(),
        currency: currency || 'USD',
      },
      metadata: {
        userId: session.user.id,
        transactionId: transaction.id,
        reference,
        userEmail: user.email,
      },
      redirect_url: `${process.env.NEXTAUTH_URL}/dashboard/deposit?status=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/deposit?status=cancelled`,
    });

    const charge = chargeResponse.data;

    // Update transaction with charge code
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        data: {
          chargeId: charge.id,
          chargeCode: charge.code,
        },
      },
    });

    logger.info('Coinbase Commerce payment initialized', {
      userId: session.user.id,
      transactionId: transaction.id,
      chargeCode: charge.code,
    });

    return NextResponse.json({
      success: true,
      data: {
        hostedUrl: charge.hosted_url,
        chargeCode: charge.code,
        chargeId: charge.id,
        transactionId: transaction.id,
        expiresAt: charge.expires_at,
        addresses: charge.addresses,
      },
    });
  } catch (error: any) {
    logger.error('Failed to initialize Coinbase Commerce payment', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to initialize payment',
      },
      { status: 500 }
    );
  }
}
