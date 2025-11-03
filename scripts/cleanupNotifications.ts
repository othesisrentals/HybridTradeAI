/**
 * Cleanup old notifications script
 * Removes read notifications older than 30 days
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupNotifications() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    // Delete read notifications older than 30 days
    const result = await prisma.notification.deleteMany({
      where: {
        read: true,
        readAt: {
          lte: thirtyDaysAgo,
        },
      },
    });

    console.log(`? Cleaned up ${result.count} old notifications`);
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupNotifications();
