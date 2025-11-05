import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { notificationService } from '@/lib/notifications/service';

/**
 * Get unread notification count
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await notificationService.getUnreadCount(user.id);

    return NextResponse.json({ count });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}

