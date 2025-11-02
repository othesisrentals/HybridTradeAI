import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const querySchema = z.object({
  page: z.string().optional().transform((v) => (v ? parseInt(v) : 1)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v) : 20)),
  type: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = querySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      type: searchParams.get('type'),
    });

    const skip = (query.page - 1) * query.limit;

    const where: any = { userId: user.id };
    if (query.type) {
      where.type = query.type;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          investment: {
            include: {
              plan: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
