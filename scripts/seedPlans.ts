import { PrismaClient, PlanType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPlans() {
  console.log('Seeding investment plans...');

  const plans = [
    {
      name: 'Starter Plan',
      type: PlanType.STARTER,
      minAmount: 10000, // $100 in cents
      maxAmount: 500000, // $5,000 in cents
      minRoiPercent: 5.0,
      maxRoiPercent: 12.0,
      features: [
        'Weekly profit distribution',
        'Basic ad task access',
        'Email support',
        'Portfolio dashboard',
      ],
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
      minAmount: 500000, // $5,000 in cents
      maxAmount: 5000000, // $50,000 in cents
      minRoiPercent: 8.0,
      maxRoiPercent: 18.0,
      features: [
        'Higher ROI range (8-18%)',
        'Premium ad tasks',
        'Priority email support',
        'Advanced analytics',
        'Dedicated account manager',
      ],
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
      minAmount: 5000000, // $50,000 in cents
      maxAmount: null, // Unlimited
      minRoiPercent: 12.0,
      maxRoiPercent: 25.0,
      features: [
        'Maximum ROI range (12-25%)',
        'Exclusive ad tasks',
        '24/7 priority support',
        'Personal investment advisor',
        'Early access to new features',
        'Custom investment strategies',
      ],
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
    console.log(`? ${plan.name} created/updated`);
  }

  console.log('Investment plans seeded successfully!');
}

seedPlans()
  .catch((error) => {
    console.error('Error seeding plans:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
