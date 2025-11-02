import { randomUUID } from "crypto";

import {
  InvestmentStatus,
  Plan,
  PlanAllocation,
  Prisma,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";

import { prisma } from "../db/client";

const MANAGEMENT_FEE_RATE = new Prisma.Decimal("0.10");
const RESERVE_BUFFER_RATE = new Prisma.Decimal("0.10");

export interface ApproveDepositAndActivateInvestmentParams {
  transactionId: string;
  planId: string;
  adminUserId: string;
  autoReinvest?: boolean;
  activationDate?: Date;
}

export interface WeeklyProfitDistributionOptions {
  runAt?: Date;
  batchId?: string;
  dryRun?: boolean;
}

interface PlanWithAllocations extends Plan {
  planAllocations: Array<PlanAllocation & { revenueStream: { id: string } }>;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function getNextDistributionDate(baseDate: Date = new Date()): Date {
  const next = new Date(baseDate);
  next.setMinutes(0, 0, 0);
  next.setHours(2); // 2 AM local time

  if (next <= baseDate) {
    next.setDate(next.getDate() + 1);
  }

  while (next.getDay() !== 0) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

function pickRoi(min: number, max: number): number {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

function calculateLockEnd(start: Date, durationWeeks: number): Date {
  const lockEnd = new Date(start);
  lockEnd.setDate(lockEnd.getDate() + durationWeeks * 7);
  return lockEnd;
}

export async function approveDepositAndActivateInvestment(
  params: ApproveDepositAndActivateInvestmentParams,
) {
  const { transactionId, planId, adminUserId, autoReinvest = false, activationDate } = params;

  const depositTransaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      user: true,
      investment: true,
    },
  });

  assert(depositTransaction, "Deposit transaction not found");
  assert(
    depositTransaction.type === TransactionType.DEPOSIT,
    "Transaction is not a deposit",
  );
  assert(
    depositTransaction.status === TransactionStatus.PENDING,
    "Deposit transaction is not pending",
  );

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
  });

  assert(plan, "Investment plan not found");

  const activationTimestamp = activationDate ?? new Date();
  const nextDistribution = getNextDistributionDate(activationTimestamp);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: depositTransaction.userId },
      select: {
        investedBalance: true,
      },
    });

    const amount = new Prisma.Decimal(depositTransaction.amount);
    const investedBefore = new Prisma.Decimal(user.investedBalance);
    const investedAfter = investedBefore.add(amount);

    const reference =
      depositTransaction.reference ?? `DEP-${activationTimestamp.getTime()}`;

    const updatedTransaction = await tx.transaction.update({
      where: { id: depositTransaction.id },
      data: {
        status: TransactionStatus.SETTLED,
        reference,
        performedById: adminUserId,
        balanceBefore: investedBefore,
        balanceAfter: investedAfter,
        metadata: {
          ...(depositTransaction.metadata ?? {}),
          approvedAt: activationTimestamp.toISOString(),
          approvedBy: adminUserId,
        },
      },
    });

    await tx.user.update({
      where: { id: depositTransaction.userId },
      data: {
        investedBalance: investedAfter,
        currentPlanId: plan.id,
        planJoinedAt: activationTimestamp,
      },
    });

    const investment = depositTransaction.investmentId
      ? await tx.investment.update({
          where: { id: depositTransaction.investmentId },
          data: {
            amount,
            status: InvestmentStatus.ACTIVE,
            approvedAt: activationTimestamp,
            activatedAt: activationTimestamp,
            lockedUntil: calculateLockEnd(activationTimestamp, plan.durationWeeks),
            nextPayoutAt: nextDistribution,
            autoReinvest,
          },
        })
      : await tx.investment.create({
          data: {
            userId: depositTransaction.userId,
            planId: plan.id,
            amount,
            status: InvestmentStatus.ACTIVE,
            initiatedAt: depositTransaction.createdAt,
            approvedAt: activationTimestamp,
            activatedAt: activationTimestamp,
            lockedUntil: calculateLockEnd(activationTimestamp, plan.durationWeeks),
            nextPayoutAt: nextDistribution,
            autoReinvest,
            transactions: {
              connect: [{ id: updatedTransaction.id }],
            },
          },
        });

    await tx.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "DEPOSIT_APPROVED",
        entityType: "Investment",
        entityId: investment.id,
        metadata: {
          transactionId: updatedTransaction.id,
          planId: plan.id,
          amount: amount.toString(),
        },
      },
    });

    return {
      transaction: updatedTransaction,
      investment,
    };
  });
}

export async function runWeeklyProfitDistribution(
  options: WeeklyProfitDistributionOptions = {},
) {
  const runAt = options.runAt ?? new Date();
  const batchId = options.batchId ?? randomUUID();

  const investments = await prisma.investment.findMany({
    where: {
      status: InvestmentStatus.ACTIVE,
      nextPayoutAt: {
        lte: runAt,
      },
    },
    include: {
      plan: {
        include: {
          planAllocations: {
            include: {
              revenueStream: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          withdrawalBalance: true,
          totalEarnings: true,
        },
      },
    },
  });

  if (options.dryRun) {
    return { investmentsProcessed: investments.length, batchId, dryRun: true };
  }

  for (const investment of investments) {
    const plan = investment.plan as PlanWithAllocations;
    const roiPercentage = pickRoi(plan.minROI, plan.maxROI);

    const amount = new Prisma.Decimal(investment.amount);
    const grossProfit = amount.mul(new Prisma.Decimal(roiPercentage)).div(100);
    const managementFee = grossProfit.mul(MANAGEMENT_FEE_RATE);
    const reserveContribution = managementFee.mul(RESERVE_BUFFER_RATE);
    const netProfit = grossProfit.sub(managementFee);

    const userId = investment.userId;

    await prisma.$transaction(async (tx) => {
      const userSnapshot = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          withdrawalBalance: true,
          totalEarnings: true,
        },
      });

      const withdrawalBefore = new Prisma.Decimal(userSnapshot.withdrawalBalance);
      const withdrawalAfter = withdrawalBefore.add(netProfit);

      await tx.user.update({
        where: { id: userId },
        data: {
          withdrawalBalance: withdrawalAfter,
          totalEarnings: new Prisma.Decimal(userSnapshot.totalEarnings).add(netProfit),
        },
      });

      const profitTransaction = await tx.transaction.create({
        data: {
          userId,
          investmentId: investment.id,
          type: TransactionType.PROFIT_SHARE,
          status: TransactionStatus.SETTLED,
          amount: netProfit,
          balanceBefore: withdrawalBefore,
          balanceAfter: withdrawalAfter,
          metadata: {
            batchId,
            roiPercentage,
            grossProfit: grossProfit.toString(),
            managementFee: managementFee.toString(),
          },
        },
      });

      await tx.transaction.create({
        data: {
          userId,
          investmentId: investment.id,
          type: TransactionType.MANAGEMENT_FEE,
          status: TransactionStatus.SETTLED,
          amount: managementFee,
          balanceBefore: withdrawalAfter,
          balanceAfter: withdrawalAfter,
          metadata: {
            batchId,
            roiPercentage,
            appliedOn: profitTransaction.id,
          },
        },
      });

      if (reserveContribution.greaterThan(0)) {
        const reserveTx = await tx.transaction.create({
          data: {
            userId,
            investmentId: investment.id,
            type: TransactionType.RESERVE_CONTRIBUTION,
            status: TransactionStatus.SETTLED,
            amount: reserveContribution,
            balanceBefore: withdrawalAfter,
            balanceAfter: withdrawalAfter,
            metadata: {
              batchId,
              sourceTransactionId: profitTransaction.id,
            },
          },
        });

        await tx.reserveBuffer.create({
          data: {
            transactionId: reserveTx.id,
            amount: reserveContribution,
          },
        });
      }

      await tx.profitHistory.create({
        data: {
          userId,
          investmentId: investment.id,
          planId: plan.id,
          grossAmount: grossProfit,
          netAmount: netProfit,
          managementFee,
          roiPercentage,
          payoutBatchId: batchId,
        },
      });

      if (plan.planAllocations.length > 0) {
        for (const allocation of plan.planAllocations) {
          const allocationRatio = new Prisma.Decimal(allocation.allocationPct);
          const streamAmount = grossProfit.mul(allocationRatio);

          await tx.revenueStream.update({
            where: { id: allocation.revenueStream.id },
            data: {
              totalRevenue: {
                increment: streamAmount,
              },
            },
          });

          await tx.profitHistory.create({
            data: {
              userId,
              investmentId: investment.id,
              planId: plan.id,
              revenueStreamId: allocation.revenueStream.id,
              grossAmount: streamAmount,
              netAmount: netProfit.mul(allocationRatio),
              managementFee: managementFee.mul(allocationRatio),
              roiPercentage,
              payoutBatchId: batchId,
              notes: "Allocation split",
            },
          });
        }
      }

      const nextPayout = getNextDistributionDate(runAt);

      const currentMetadata =
        (investment.metadata as Record<string, unknown> | null | undefined) ?? {};

      await tx.investment.update({
        where: { id: investment.id },
        data: {
          nextPayoutAt: nextPayout,
          metadata: {
            ...currentMetadata,
            lastDistribution: {
              batchId,
              roiPercentage,
              runAt: runAt.toISOString(),
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: null,
          action: "PROFIT_DISTRIBUTED",
          entityType: "Investment",
          entityId: investment.id,
          metadata: {
            batchId,
            roiPercentage,
            grossProfit: grossProfit.toString(),
            netProfit: netProfit.toString(),
            managementFee: managementFee.toString(),
          },
        },
      });
    });
  }

  return {
    investmentsProcessed: investments.length,
    batchId,
    runAt,
  };
}
