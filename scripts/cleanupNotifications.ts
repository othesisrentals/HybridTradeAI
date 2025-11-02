import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupNotifications() {
  console.log('Starting notification cleanup...');

  // Delete expired notifications
  const expiredResult = await prisma.notification.deleteMany({
    where: {
      expiresAt: {
        lte: new Date(),
      },
    },
  });
  console.log(`? Deleted ${expiredResult.count} expired notifications`);

  // Delete read notifications older than 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const oldResult = await prisma.notification.deleteMany({
    where: {
      isRead: true,
      readAt: {
        lte: thirtyDaysAgo,
      },
    },
  });
  console.log(`? Deleted ${oldResult.count} old read notifications`);

  console.log('Notification cleanup completed!');
}

cleanupNotifications()
  .catch((error) => {
    console.error('Error cleaning up notifications:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
