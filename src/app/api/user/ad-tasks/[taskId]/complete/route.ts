import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { adTaskService } from '@/lib/ads/service';

export async function POST(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = await adTaskService.completeTask(
      user.id,
      params.taskId,
      body.verificationData
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to complete task' },
      { status: error.statusCode || 500 }
    );
  }
}
