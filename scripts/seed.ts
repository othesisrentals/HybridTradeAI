import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('?? Starting database seed...')

  // Create revenue streams
  console.log('Creating revenue streams...')
  const revenueStreams = await Promise.all([
    prisma.revenueStream.upsert({
      where: { type: 'ALGORITHMIC_TRADING' },
      update: {},
      create: {
        name: 'Algorithmic Trading',
        type: 'ALGORITHMIC_TRADING',
        targetAllocation: 40.0,
        currentROI: 12.5,
        isActive: true,
      },
    }),
    prisma.revenueStream.upsert({
      where: { type: 'CRYPTO_STAKING' },
      update: {},
      create: {
        name: 'Crypto Staking',
        type: 'CRYPTO_STAKING',
        targetAllocation: 25.0,
        currentROI: 8.5,
        isActive: true,
      },
    }),
    prisma.revenueStream.upsert({
      where: { type: 'COPY_TRADING' },
      update: {},
      create: {
        name: 'Copy Trading',
        type: 'COPY_TRADING',
        targetAllocation: 15.0,
        currentROI: 10.0,
        isActive: true,
      },
    }),
    prisma.revenueStream.upsert({
      where: { type: 'ADVERTISING' },
      update: {},
      create: {
        name: 'Advertising & Tasks',
        type: 'ADVERTISING',
        targetAllocation: 20.0,
        currentROI: 15.0,
        isActive: true,
      },
    }),
    prisma.revenueStream.upsert({
      where: { type: 'MANAGEMENT_FEES' },
      update: {},
      create: {
        name: 'Management Fees',
        type: 'MANAGEMENT_FEES',
        targetAllocation: 0.0, // Not allocated, deducted from profits
        currentROI: 0.0,
        isActive: true,
      },
    }),
  ])

  // Create investment plans
  console.log('Creating investment plans...')
  const starterPlan = await prisma.plan.upsert({
    where: { type: 'STARTER' },
    update: {},
    create: {
      name: 'Starter Plan',
      type: 'STARTER',
      minAmount: 100,
      maxAmount: 5000,
      roiMin: 5.0,
      roiMax: 12.0,
      durationWeeks: 12,
      managementFee: 10.0,
      hasPremiumAds: false,
      prioritySupport: false,
      isActive: true,
    },
  })

  const proPlan = await prisma.plan.upsert({
    where: { type: 'PRO' },
    update: {},
    create: {
      name: 'Pro Plan',
      type: 'PRO',
      minAmount: 5000,
      maxAmount: 50000,
      roiMin: 8.0,
      roiMax: 18.0,
      durationWeeks: 12,
      managementFee: 10.0,
      hasPremiumAds: true,
      prioritySupport: false,
      isActive: true,
    },
  })

  const elitePlan = await prisma.plan.upsert({
    where: { type: 'ELITE' },
    update: {},
    create: {
      name: 'Elite Plan',
      type: 'ELITE',
      minAmount: 50000,
      maxAmount: 500000,
      roiMin: 12.0,
      roiMax: 25.0,
      durationWeeks: 12,
      managementFee: 10.0,
      hasPremiumAds: true,
      prioritySupport: true,
      isActive: true,
    },
  })

  // Create plan allocations
  console.log('Creating plan allocations...')
  const plans = [starterPlan, proPlan, elitePlan]
  const allocations = [
    { planType: 'STARTER' as const, streamType: 'ALGORITHMIC_TRADING' as const, allocation: 40.0 },
    { planType: 'STARTER' as const, streamType: 'CRYPTO_STAKING' as const, allocation: 25.0 },
    { planType: 'STARTER' as const, streamType: 'COPY_TRADING' as const, allocation: 15.0 },
    { planType: 'STARTER' as const, streamType: 'ADVERTISING' as const, allocation: 20.0 },
    { planType: 'PRO' as const, streamType: 'ALGORITHMIC_TRADING' as const, allocation: 40.0 },
    { planType: 'PRO' as const, streamType: 'CRYPTO_STAKING' as const, allocation: 25.0 },
    { planType: 'PRO' as const, streamType: 'COPY_TRADING' as const, allocation: 15.0 },
    { planType: 'PRO' as const, streamType: 'ADVERTISING' as const, allocation: 20.0 },
    { planType: 'ELITE' as const, streamType: 'ALGORITHMIC_TRADING' as const, allocation: 40.0 },
    { planType: 'ELITE' as const, streamType: 'CRYPTO_STAKING' as const, allocation: 25.0 },
    { planType: 'ELITE' as const, streamType: 'COPY_TRADING' as const, allocation: 15.0 },
    { planType: 'ELITE' as const, streamType: 'ADVERTISING' as const, allocation: 20.0 },
  ]

  for (const alloc of allocations) {
    const plan = plans.find((p) => p.type === alloc.planType)
    const stream = revenueStreams.find((s) => s.type === alloc.streamType)

    if (plan && stream) {
      await prisma.planAllocation.upsert({
        where: {
          planId_revenueStreamId: {
            planId: plan.id,
            revenueStreamId: stream.id,
          },
        },
        update: { allocation: alloc.allocation },
        create: {
          planId: plan.id,
          revenueStreamId: stream.id,
          allocation: alloc.allocation,
        },
      })
    }
  }

  // Create admin user
  console.log('Creating admin user...')
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@hybridtradeai.com' },
    update: {},
    create: {
      email: 'admin@hybridtradeai.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      kycStatus: 'APPROVED',
      kycVerifiedAt: new Date(),
      referralCode: 'ADMIN',
      investedBalance: 0,
      withdrawalBalance: 0,
      totalEarnings: 0,
    },
  })

  // Create reserve buffer
  console.log('Creating reserve buffer...')
  const existingBuffer = await prisma.reserveBuffer.findFirst()
  if (!existingBuffer) {
    await prisma.reserveBuffer.create({
      data: {
        currentAmount: 0,
        targetPercentage: 10.0,
        totalAUM: 0,
      },
    })
  }

  // Create sample ad tasks
  console.log('Creating sample ad tasks...')
  await prisma.adTask.createMany({
    data: [
      {
        title: 'Watch Video Ad',
        description: 'Watch a 30-second video advertisement',
        type: 'VIDEO_AD',
        status: 'ACTIVE',
        rewardAmount: 0.50,
        platformCommission: 30.0,
        totalEarning: 0.71,
        allowedPlans: ['STARTER', 'PRO', 'ELITE'],
        dailyLimit: 10,
        cooldownHours: 1,
        requiresVerification: false,
        adNetwork: 'admob',
      },
      {
        title: 'Complete Survey',
        description: 'Complete a 5-minute survey about products',
        type: 'SURVEY',
        status: 'ACTIVE',
        rewardAmount: 2.00,
        platformCommission: 30.0,
        totalEarning: 2.86,
        allowedPlans: ['STARTER', 'PRO', 'ELITE'],
        dailyLimit: 5,
        cooldownHours: 24,
        requiresVerification: true,
        verificationInstructions: 'Screenshot completion screen',
        adNetwork: 'admob',
      },
      {
        title: 'Install App - Premium',
        description: 'Install and open the recommended app',
        type: 'APP_INSTALL',
        status: 'ACTIVE',
        rewardAmount: 5.00,
        platformCommission: 30.0,
        totalEarning: 7.14,
        allowedPlans: ['PRO', 'ELITE'],
        requiredPlan: 'PRO',
        dailyLimit: 3,
        cooldownHours: 48,
        requiresVerification: true,
        verificationInstructions: 'Screenshot app installed',
        adNetwork: 'unity',
      },
      {
        title: 'Elite Offer Wall',
        description: 'Complete premium offers from our partners',
        type: 'OFFER_WALL',
        status: 'ACTIVE',
        rewardAmount: 10.00,
        platformCommission: 30.0,
        totalEarning: 14.29,
        allowedPlans: ['ELITE'],
        requiredPlan: 'ELITE',
        dailyLimit: 2,
        cooldownHours: 72,
        requiresVerification: true,
        verificationInstructions: 'Screenshot completion proof',
        adNetwork: 'ironsource',
      },
    ],
    skipDuplicates: true,
  })

  console.log('? Database seed completed!')
  console.log(`\nAdmin credentials:`)
  console.log(`Email: admin@hybridtradeai.com`)
  console.log(`Password: admin123`)
  console.log(`\n??  Please change the admin password after first login!`)
}

main()
  .catch((e) => {
    console.error('? Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
