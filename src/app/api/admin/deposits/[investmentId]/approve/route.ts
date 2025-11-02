import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { investmentService } from '@/lib/investment/service';

export async function POST(
  req: NextRequest,
  { params }: { params: { investmentId: string } }
) {
  try {
    const admin = await requireAdmin();

    const investment = await investmentService.approveDeposit(
      params.investmentId,
      admin.id
    );

    return NextResponse.json(investment);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to approve deposit' },
      { status: error.statusCode || 500 }
    );
  }
}
