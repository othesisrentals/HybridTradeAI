/**
 * Coinbase Commerce payment API endpoint
 * POST /api/payment/coinbase
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createCoinbaseCharge } from '@/lib/payment/coinbase';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const paymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('USD'),
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

    // Create Coinbase charge
    const charge = await createCoinbaseCharge({
      name: `Deposit - ${session.user.email}`,
      description: `Deposit of ${currency} ${amount} to HybridTradeAI`,
      amount,
      currency,
      metadata: {
        userId: session.user.id,
        investmentId: investmentId || '',
        type: 'deposit',
      },
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
        paymentMethod: 'coinbase',
        paymentReference: charge.code,
        paymentGateway: 'coinbase',
        description: `Deposit via Coinbase Commerce - ${currency} ${amount}`,
        data: {
          chargeId: charge.id,
          hostedUrl: charge.hosted_url,
        },
      },
    });

    logger.info('Coinbase charge created', {
      transactionId: transaction.id,
      chargeId: charge.id,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      hostedUrl: charge.hosted_url,
      chargeId: charge.id,
      code: charge.code,
      transactionId: transaction.id,
    });
  } catch (error: any) {
    logger.error('Failed to create Coinbase charge', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create payment' },
      { status: 500 }
    );
  }
}
