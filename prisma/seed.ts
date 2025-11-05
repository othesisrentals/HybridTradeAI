import { PrismaClient, PlanType, RevenueStreamType } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('?? Seeding database...');

  // Create investment plans
  console.log('Creating investment plans...');
  const plans = [
    {
      name: 'Starter Plan',
      type: PlanType.STARTER,
      minAmount: 10000,
      maxAmount: 500000,
      roiMin: 5.0,
      roiMax: 12.0,
      durationWeeks: 52,
      managementFee: 10.0,
      hasPremiumAds: false,
      prioritySupport: false,
      isActive: true,
    },
    {
      name: 'Pro Plan',
      type: PlanType.PRO,
      minAmount: 500000,
      maxAmount: 5000000,
      roiMin: 8.0,
      roiMax: 18.0,
      durationWeeks: 52,
      managementFee: 10.0,
      hasPremiumAds: false,
      prioritySupport: true,
      isActive: true,
    },
    {
      name: 'Elite Plan',
      type: PlanType.ELITE,
      minAmount: 5000000,
      maxAmount: 50000000,
      roiMin: 12.0,
      roiMax: 25.0,
      durationWeeks: 52,
      managementFee: 10.0,
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
    },
    {
      name: 'Crypto Staking',
      type: RevenueStreamType.CRYPTO_STAKING,
      targetAllocation: 25.0,
    },
    {
      name: 'Copy Trading',
      type: RevenueStreamType.COPY_TRADING,
      targetAllocation: 15.0,
    },
    {
      name: 'Advertising & Tasks',
      type: RevenueStreamType.ADVERTISING,
      targetAllocation: 20.0,
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

  // Create admin user
  console.log('\nCreating admin user...');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@hybridtradeai.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  
  const hashedPassword = await hash(adminPassword, 12);
  
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: 'Admin User',
      role: 'SUPER_ADMIN',
      kycStatus: 'APPROVED',
      status: 'ACTIVE',
      referralCode: 'ADMIN001',
    },
    update: {},
  });
  
  console.log(`? Admin user created: ${adminEmail}`);
  console.log(`  Password: ${adminPassword}`);

  // Create reserve buffer
  console.log('\nCreating reserve buffer...');
  await prisma.reserveBuffer.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      targetPercentage: 10.0,
      currentAmount: 0,
      totalAUM: 0,
    },
    update: {},
  });
  console.log('? Reserve buffer created');

  console.log('\n? Seeding completed successfully!');
}

main()
  .catch((error) => {
    console.error('? Error seeding database:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
