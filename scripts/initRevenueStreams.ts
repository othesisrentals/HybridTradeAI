import { PrismaClient, RevenueStreamType } from '@prisma/client';

const prisma = new PrismaClient();

async function initRevenueStreams() {
  console.log('Initializing revenue streams...');

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
    {
      name: 'Management Fees',
      type: RevenueStreamType.MANAGEMENT_FEES,
      targetPercent: 10.0,
      description: '10% fee on all profits distributed to users',
    },
  ];

  for (const stream of streams) {
    await prisma.revenueStream.upsert({
      where: { name: stream.name },
      create: stream,
      update: stream,
    });
    console.log(`? ${stream.name} created/updated`);
  }

  console.log('Revenue streams initialized successfully!');
}

initRevenueStreams()
  .catch((error) => {
    console.error('Error initializing revenue streams:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
