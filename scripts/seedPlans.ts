import { PrismaClient, PlanType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPlans() {
  console.log('Seeding investment plans...');

  const plans = [
    {
      name: 'Starter Plan',
      type: PlanType.STARTER,
      minAmount: 100,
      maxAmount: 1000,
      roiMin: 5.0,
      roiMax: 8.0,
      durationWeeks: 12,
      managementFee: 10.0,
      hasPremiumAds: false,
      prioritySupport: false,
      isActive: true,
    },
    {
      name: 'Professional Plan',
      type: PlanType.PRO,
      minAmount: 1001,
      maxAmount: 10000,
      roiMin: 8.0,
      roiMax: 12.0,
      durationWeeks: 12,
      managementFee: 10.0,
      hasPremiumAds: true,
      prioritySupport: true,
      isActive: true,
    },
    {
      name: 'Elite Plan',
      type: PlanType.ELITE,
      minAmount: 10001,
      maxAmount: 100000,
      roiMin: 12.0,
      roiMax: 15.0,
      durationWeeks: 12,
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
