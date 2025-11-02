/**
 * Currency Conversion API
 * POST /api/currency/convert - Convert amount between currencies
 */

import { NextRequest, NextResponse } from 'next/server';
import { convertCurrency } from '@/lib/currency/service';
import { type Currency } from '@/lib/currency/config';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, from, to } = body;

    // Validate inputs
    if (!amount || !from || !to) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: amount, from, to',
        },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid amount',
        },
        { status: 400 }
      );
    }

    const convertedAmount = await convertCurrency(
      amount,
      from as Currency,
      to as Currency
    );

    return NextResponse.json({
      success: true,
      data: {
        amount,
        from,
        to,
        convertedAmount,
        rate: convertedAmount / amount,
      },
    });
  } catch (error) {
    logger.error('Failed to convert currency', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to convert currency',
      },
      { status: 500 }
    );
  }
}
