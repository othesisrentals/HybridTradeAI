/**
 * Exchange Rates API
 * GET /api/currency/rates - Get current exchange rates
 */

import { NextRequest, NextResponse } from 'next/server';
import { getExchangeRates } from '@/lib/currency/service';
import { type Currency, defaultCurrency } from '@/lib/currency/config';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const base = (searchParams.get('base') as Currency) || defaultCurrency;

    const rates = await getExchangeRates(base);

    return NextResponse.json({
      success: true,
      data: rates,
    });
  } catch (error) {
    logger.error('Failed to fetch exchange rates', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch exchange rates',
      },
      { status: 500 }
    );
  }
}
