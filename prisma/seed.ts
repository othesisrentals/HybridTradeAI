import { PrismaClient, PlanType, RevenueStreamType, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('?? Seeding database...\n');

  // Create admin user
  console.log('Creating admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hybridtradeai.com' },
    update: {},
    create: {
      email: 'admin@hybridtradeai.com',
      name: 'Admin User',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      status: 'ACTIVE',
      referralCode: 'ADMIN001',
      emailVerified: new Date(),
    },
  });
  console.log(`? Admin created: ${admin.email}`);

  // Create investment plans
  console.log('\nCreating investment plans...');
  const plans = [
    {
      name: 'Starter Plan',
      type: PlanType.STARTER,
      minAmount: 100,
      maxAmount: 1000,
      roiMin: 5,
      roiMax: 8,
      durationWeeks: 12,
      managementFee: 10,
      hasPremiumAds: false,
      prioritySupport: false,
      isActive: true,
    },
    {
      name: 'Professional Plan',
      type: PlanType.PRO,
      minAmount: 1001,
      maxAmount: 10000,
      roiMin: 8,
      roiMax: 12,
      durationWeeks: 12,
      managementFee: 10,
      hasPremiumAds: true,
      prioritySupport: true,
      isActive: true,
    },
    {
      name: 'Elite Plan',
      type: PlanType.ELITE,
      minAmount: 10001,
      maxAmount: 100000,
      roiMin: 12,
      roiMax: 15,
      durationWeeks: 12,
      managementFee: 10,
      hasPremiumAds: true,
      prioritySupport: true,
      isActive: true,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { type: plan.type },
      create: plan,
      update: plan,
    });
    console.log(`? ${plan.name} created`);
  }

  // Create revenue streams
  console.log('\nCreating revenue streams...');
  const streams = [
    {
      name: 'Algorithmic Trading',
      type: RevenueStreamType.ALGORITHMIC_TRADING,
      targetAllocation: 40.0,
      currentROI: 12.5,
      isActive: true,
    },
    {
      name: 'Crypto Staking',
      type: RevenueStreamType.CRYPTO_STAKING,
      targetAllocation: 25.0,
      currentROI: 8.2,
      isActive: true,
    },
    {
      name: 'Copy Trading',
      type: RevenueStreamType.COPY_TRADING,
      targetAllocation: 20.0,
      currentROI: 15.8,
      isActive: true,
    },
    {
      name: 'Advertising Revenue',
      type: RevenueStreamType.ADVERTISING,
      targetAllocation: 10.0,
      currentROI: 5.5,
      isActive: true,
    },
    {
      name: 'Management Fees',
      type: RevenueStreamType.MANAGEMENT_FEES,
      targetAllocation: 5.0,
      currentROI: 10.0,
      isActive: true,
    },
  ];

  for (const stream of streams) {
    await prisma.revenueStream.upsert({
      where: { type: stream.type },
      create: stream,
      update: stream,
    });
    console.log(`? ${stream.name} created`);
  }

  console.log('\n? Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
