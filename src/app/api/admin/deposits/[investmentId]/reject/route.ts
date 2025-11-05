import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { investmentService } from '@/lib/investment/service';
import { z } from 'zod';

const rejectSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { investmentId: string } }
) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { reason } = rejectSchema.parse(body);

    const investment = await investmentService.rejectDeposit(
      params.investmentId,
      admin.id,
      reason
    );

    return NextResponse.json(investment);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to reject deposit' },
      { status: error.statusCode || 500 }
    );
  }
}
