import { Prisma, AdTaskStatus, AdTaskType } from "@prisma/client";

import { prisma } from "../src/lib/db";

const taskDefinitions = [
  {
    slug: "watch-video-ad",
    title: "Watch Sponsored Video",
    description: "Watch a 30 second sponsored video to earn rewards.",
    type: AdTaskType.VIDEO,
    rewardAmount: new Prisma.Decimal(0.25),
    commissionRate: new Prisma.Decimal(0.3),
    dailyLimit: 5,
    cooldownHours: 1,
    planSlugs: ["starter", "pro", "elite"],
    metadata: { category: "video", adUnitId: "demo-video-unit" },
  },
  {
    slug: "quick-opinion-survey",
    title: "Quick Opinion Survey",
    description: "Share your opinion in a short 8-question survey.",
    type: AdTaskType.SURVEY,
    rewardAmount: new Prisma.Decimal(0.5),
    commissionRate: new Prisma.Decimal(0.3),
    dailyLimit: 3,
    cooldownHours: 2,
    planSlugs: ["starter", "pro", "elite"],
    metadata: { category: "survey" },
  },
  {
    slug: "install-partner-app",
    title: "Install Partner App",
    description: "Install and open our partner's mobile application.",
    type: AdTaskType.INSTALL,
    rewardAmount: new Prisma.Decimal(2),
    commissionRate: new Prisma.Decimal(0.3),
    dailyLimit: 1,
    cooldownHours: 24,
    planSlugs: ["pro", "elite"],
    metadata: { category: "app-install" },
  },
  {
    slug: "elite-offer-wall",
    title: "Premium Offer Wall",
    description: "Complete premium offers curated for elite partners.",
    type: AdTaskType.OFFERWALL,
    rewardAmount: new Prisma.Decimal(5),
    commissionRate: new Prisma.Decimal(0.3),
    dailyLimit: 2,
    cooldownHours: 4,
    isPremium: true,
    planSlugs: ["elite"],
    metadata: { category: "offerwall" },
  },
];

async function seedAdTasks() {
  console.info("?? Seeding Ad tasks...");

  const plans = await prisma.plan.findMany({
    select: { id: true, slug: true },
  });

  const planLookup = new Map(plans.map((plan) => [plan.slug, plan.id]));

  for (const definition of taskDefinitions) {
    const planIds = (definition.planSlugs ?? [])
      .map((slug) => planLookup.get(slug))
      .filter((value): value is string => Boolean(value));

    const task = await prisma.adTask.upsert({
      where: { slug: definition.slug },
      update: {
        title: definition.title,
        description: definition.description,
        type: definition.type,
        status: AdTaskStatus.ACTIVE,
        rewardAmount: definition.rewardAmount,
        commissionRate: definition.commissionRate,
        dailyLimit: definition.dailyLimit,
        cooldownHours: definition.cooldownHours,
        isPremium: Boolean(definition.isPremium),
        metadata: definition.metadata,
      },
      create: {
        slug: definition.slug,
        title: definition.title,
        description: definition.description,
        type: definition.type,
        status: AdTaskStatus.ACTIVE,
        rewardAmount: definition.rewardAmount,
        commissionRate: definition.commissionRate,
        dailyLimit: definition.dailyLimit,
        cooldownHours: definition.cooldownHours,
        isPremium: Boolean(definition.isPremium),
        metadata: definition.metadata,
        planAccess: planIds.length
          ? {
              createMany: {
                data: planIds.map((planId) => ({ planId })),
                skipDuplicates: true,
              },
            }
          : undefined,
      },
    });

    if (planIds.length) {
      await prisma.adTaskPlanAccess.createMany({
        data: planIds.map((planId) => ({ adTaskId: task.id, planId })),
        skipDuplicates: true,
      });
    }
  }

  console.info("? Ad tasks seeded successfully");
}

seedAdTasks()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
