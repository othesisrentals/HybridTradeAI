import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { adTaskService } from '@/lib/ads/service';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tasks = await adTaskService.getAvailableTasks(user.id);

    return NextResponse.json(tasks);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ad tasks' },
      { status: 500 }
    );
  }
}
