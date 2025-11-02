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
      minRoiPercent: 5.0,
      maxRoiPercent: 12.0,
      features: ['Weekly profit distribution', 'Basic ad task access', 'Email support', 'Portfolio dashboard'],
      adTaskAccess: true,
      prioritySupport: false,
      description: 'Perfect for beginners looking to start their investment journey',
      color: '#3B82F6',
      icon: '??',
      isActive: true,
      displayOrder: 1,
    },
    {
      name: 'Pro Plan',
      type: PlanType.PRO,
      minAmount: 500000,
      maxAmount: 5000000,
      minRoiPercent: 8.0,
      maxRoiPercent: 18.0,
      features: ['Higher ROI range (8-18%)', 'Premium ad tasks', 'Priority email support', 'Advanced analytics', 'Dedicated account manager'],
      adTaskAccess: true,
      prioritySupport: true,
      description: 'For experienced investors seeking higher returns',
      color: '#8B5CF6',
      icon: '??',
      isActive: true,
      displayOrder: 2,
    },
    {
      name: 'Elite Plan',
      type: PlanType.ELITE,
      minAmount: 5000000,
      maxAmount: null,
      minRoiPercent: 12.0,
      maxRoiPercent: 25.0,
      features: ['Maximum ROI range (12-25%)', 'Exclusive ad tasks', '24/7 priority support', 'Personal investment advisor', 'Early access to new features', 'Custom investment strategies'],
      adTaskAccess: true,
      prioritySupport: true,
      description: 'Elite package for high-net-worth individuals',
      color: '#F59E0B',
      icon: '??',
      isActive: true,
      displayOrder: 3,
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
      targetPercent: 40.0,
      description: 'Automated trading strategies using advanced algorithms',
    },
    {
      name: 'Crypto Staking',
      type: RevenueStreamType.CRYPTO_STAKING,
      targetPercent: 25.0,
      description: 'Earning rewards through cryptocurrency staking',
    },
    {
      name: 'Copy Trading',
      type: RevenueStreamType.COPY_TRADING,
      targetPercent: 15.0,
      description: 'Following successful traders and copying their strategies',
    },
    {
      name: 'Advertising & Tasks',
      type: RevenueStreamType.ADVERTISING,
      targetPercent: 20.0,
      description: 'Revenue from ad networks and user task completions',
    },
  ];

  for (const stream of streams) {
    await prisma.revenueStream.upsert({
      where: { name: stream.name },
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
      hashedPassword,
      name: 'Admin User',
      role: 'SUPER_ADMIN',
      kycStatus: 'APPROVED',
      isActive: true,
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
      targetPercent: 10.0,
      currentAmount: 0,
      totalAUM: 0,
      requiredAmount: 0,
      surplus: 0,
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
