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
      minAmount: 500000, // $5,000 in cents
      maxAmount: 5000000, // $50,000 in cents
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
      minAmount: 5000000, // $50,000 in cents
      maxAmount: 50000000, // $500,000 in cents
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
