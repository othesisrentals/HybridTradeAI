import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { notificationService } from '@/lib/notifications/service';

/**
 * Mark a notification as read
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notification = await notificationService.markAsRead(
      params.notificationId,
      user.id
    );

    return NextResponse.json(notification);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}
