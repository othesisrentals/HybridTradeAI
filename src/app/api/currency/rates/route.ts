/**
 * Currency exchange rates API
 * GET /api/currency/rates?base=USD
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchExchangeRates } from '@/lib/currency/fixer';
import { BASE_CURRENCY } from '@/config/constants';

export async function GET(request: NextRequest) {
  try {
    const baseCurrency =
      request.nextUrl.searchParams.get('base') || BASE_CURRENCY;

    const rates = await fetchExchangeRates(baseCurrency);

    return NextResponse.json({
      success: true,
      base: rates.base,
      date: rates.date,
      rates: rates.rates,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch exchange rates' },
      { status: 500 }
    );
  }
}
