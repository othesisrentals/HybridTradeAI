/**
 * Currency conversion API
 * POST /api/currency/convert
 * Body: { amount: number, from: string, to: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { convertCurrency } from '@/lib/currency/fixer';
import { z } from 'zod';

const convertSchema = z.object({
  amount: z.number().positive(),
  from: z.string().length(3),
  to: z.string().length(3),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, from, to } = convertSchema.parse(body);

    const result = await convertCurrency(amount, from, to);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to convert currency' },
      { status: 500 }
    );
  }
}
