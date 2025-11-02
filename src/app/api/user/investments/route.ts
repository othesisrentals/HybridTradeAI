import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { investmentService } from '@/lib/investment/service';
import { z } from 'zod';

const createInvestmentSchema = z.object({
  planId: z.string(),
  amount: z.number().positive(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const investments = await investmentService.getUserInvestments(user.id);

    return NextResponse.json(investments);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch investments' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { planId, amount } = createInvestmentSchema.parse(body);

    const investment = await investmentService.createDepositRequest(
      user.id,
      planId,
      amount
    );

    return NextResponse.json(investment, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create investment' },
      { status: error.statusCode || 500 }
    );
  }
}
