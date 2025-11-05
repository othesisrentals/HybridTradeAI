import { PrismaClient, RevenueStreamType } from '@prisma/client';

const prisma = new PrismaClient();

async function initRevenueStreams() {
  console.log('Initializing revenue streams...');

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
    {
      name: 'Management Fees',
      type: RevenueStreamType.MANAGEMENT_FEES,
      targetAllocation: 10.0,
    },
  ];

  for (const stream of streams) {
    await prisma.revenueStream.upsert({
      where: { type: stream.type },
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
