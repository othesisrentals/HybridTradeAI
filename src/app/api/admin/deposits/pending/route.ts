import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { investmentService } from '@/lib/investment/service';
import { z } from 'zod';

const querySchema = z.object({
  page: z.string().optional().transform((v) => (v ? parseInt(v) : 1)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v) : 20)),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const query = querySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });

    const result = await investmentService.getPendingDeposits(
      query.page,
      query.limit
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pending deposits' },
      { status: error.statusCode || 500 }
    );
  }
}

