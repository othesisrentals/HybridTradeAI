import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { notificationService } from '@/lib/notifications/service';

/**
 * Mark all notifications as read
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await notificationService.markAllAsRead(user.id);

    return NextResponse.json({ count, message: `${count} notifications marked as read` });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
