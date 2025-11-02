import { randomUUID } from "node:crypto";

import type { Investment, Plan, Prisma, PrismaClient } from "@prisma/client";
import {
  InvestmentStatus,
  NotificationType,
  ProfitStatus,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";

import { NotificationService } from "@/lib/notifications/notificationService";

type Decimal = Prisma.Decimal;

const MANAGEMENT_FEE_RATE = new Prisma.Decimal(0.1); // 10%
const RESERVE_TARGET_FALLBACK = new Prisma.Decimal(0.1); // 10% if no record exists

export interface ProfitDistributionDetail {
  investmentId: string;
  userId: string;
  planId: string;
  roiPercentage: Decimal;
  grossProfit: Decimal;
  managementFee: Decimal;
  reserveAllocation: Decimal;
  netProfit: Decimal;
  transactionId?: string;
  profitHistoryId?: string;
  reference: string;
  dryRun: boolean;
}

export interface ProfitDistributionResult {
  asOf: Date;
  dryRun: boolean;
  totalInvestments: number;
  totalProcessed: number;
  totalGrossProfit: Decimal;
  totalNetProfit: Decimal;
  totalManagementFees: Decimal;
  totalReserveAllocation: Decimal;
  details: ProfitDistributionDetail[];
}

export interface ProfitDistributionOptions {
  asOf?: Date;
  dryRun?: boolean;
  actorId?: string;
  limit?: number;
}

export interface ApproveDepositOptions {
  transactionId: string;
  planId: string;
  adminId: string;
  autoInvest?: boolean;
  metadata?: Record<string, unknown>;
}

interface ReserveBufferSnapshot {
  id?: string;
  targetPercentage: Decimal;
}

export class InvestmentEngine {
  constructor(private readonly prisma: PrismaClient) {}

  async approveDepositAndActivateInvestment(options: ApproveDepositOptions) {
    const { transactionId, planId, adminId, autoInvest = true, metadata } = options;
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const depositTx = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: {
          user: true,
        },
      });

      if (!depositTx) {
        throw new Error("Deposit transaction not found");
      }

      if (depositTx.type !== TransactionType.DEPOSIT) {
        throw new Error("Transaction is not a deposit");
      }

      if (depositTx.status !== TransactionStatus.PENDING) {
        throw new Error("Deposit transaction already processed");
      }

      const plan = await tx.plan.findUnique({
        where: { id: planId },
      });

      if (!plan || !plan.isActive) {
        throw new Error("Plan is not available for investment");
      }

      const amount = depositTx.amount;

      if (amount.lessThan(plan.minDeposit)) {
        throw new Error("Deposit amount is below the plan minimum");
      }

      if (plan.maxDeposit && amount.greaterThan(plan.maxDeposit)) {
        throw new Error("Deposit amount exceeds the plan maximum");
      }

      const nextProfitDate = this.calculateNextProfitDate(now);
      const lockedUntil = this.calculateLockupEnd(now, plan.lockupPeriodDays ?? 7);
      const reference = this.generateReference("INV");

      const investment = await tx.investment.create({
        data: {
          userId: depositTx.userId,
          planId: plan.id,
          amount,
          status: autoInvest ? InvestmentStatus.ACTIVE : InvestmentStatus.PENDING,
          approvedById: adminId,
          approvedAt: now,
          activatedAt: autoInvest ? now : null,
          autoInvested: autoInvest,
          lockedUntil,
          nextProfitDate: autoInvest ? nextProfitDate : null,
          metadata,
        },
      });

      await tx.user.update({
        where: { id: depositTx.userId },
        data: {
          planId: plan.id,
          investedBalance: autoInvest
            ? {
                increment: amount,
              }
            : undefined,
          lifetimeDeposits: {
            increment: amount,
          },
        },
      });

      const updatedTransaction = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: TransactionStatus.COMPLETED,
          processedAt: now,
          investmentId: investment.id,
          reference,
          metadata: {
            ...depositTx.metadata,
            approvedBy: adminId,
            autoInvest,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          action: "DEPOSIT_APPROVED",
          entity: "Investment",
          entityId: investment.id,
          actorId: adminId,
          userId: depositTx.userId,
          description: `Deposit approved and ${autoInvest ? "activated" : "queued"} for plan ${plan.name}`,
          before: depositTx.metadata,
          after: {
            investmentId: investment.id,
            transactionId: depositTx.id,
            amount: amount.toString(),
            planId: plan.id,
            autoInvest,
          },
        },
      });

      return {
        investment,
        transaction: updatedTransaction,
      };
    });
  }

  async runWeeklyProfitDistribution(options: ProfitDistributionOptions = {}): Promise<ProfitDistributionResult> {
    const { asOf = new Date(), dryRun = false, actorId, limit } = options;

    const investments = await this.prisma.investment.findMany({
      where: {
        status: InvestmentStatus.ACTIVE,
        OR: [
          { nextProfitDate: null },
          { nextProfitDate: { lte: asOf } },
        ],
        lockedUntil: {
          lte: asOf,
        },
        maturedAt: {
          equals: null,
        },
      },
      include: {
        plan: true,
        user: true,
      },
      take: limit ?? undefined,
      orderBy: {
        nextProfitDate: "asc",
      },
    });

    const reserveBuffer = await this.prisma.reserveBuffer.findFirst({
      orderBy: { createdAt: "desc" },
    });

    const reserveSnapshot: ReserveBufferSnapshot = reserveBuffer
      ? {
          id: reserveBuffer.id,
          targetPercentage: reserveBuffer.targetPercentage,
        }
      : {
          targetPercentage: RESERVE_TARGET_FALLBACK,
        };

    const summary: ProfitDistributionResult = {
      asOf,
      dryRun,
      totalInvestments: investments.length,
      totalProcessed: 0,
      totalGrossProfit: new Prisma.Decimal(0),
      totalNetProfit: new Prisma.Decimal(0),
      totalManagementFees: new Prisma.Decimal(0),
      totalReserveAllocation: new Prisma.Decimal(0),
      details: [],
    };

    for (const investment of investments) {
      const plan = investment.plan as Plan;
      const shouldProcess = this.shouldDistribute(investment, asOf);

      if (!shouldProcess) {
        continue;
      }

      const distribution = this.calculateDistribution(investment, plan, reserveSnapshot.targetPercentage);

      summary.details.push({
        investmentId: investment.id,
        userId: investment.userId,
        planId: plan.id,
        roiPercentage: distribution.roiPercentage,
        grossProfit: distribution.grossProfit,
        managementFee: distribution.managementFee,
        reserveAllocation: distribution.reserveAllocation,
        netProfit: distribution.netProfit,
        reference: distribution.reference,
        dryRun,
      });

      summary.totalGrossProfit = summary.totalGrossProfit.add(distribution.grossProfit);
      summary.totalNetProfit = summary.totalNetProfit.add(distribution.netProfit);
      summary.totalManagementFees = summary.totalManagementFees.add(distribution.managementFee);
      summary.totalReserveAllocation = summary.totalReserveAllocation.add(distribution.reserveAllocation);

      if (dryRun) {
        continue;
      }

      const result = await this.prisma.$transaction(async (tx) => {
        const nextProfitDate = this.calculateNextProfitDate(asOf);

        const updatedInvestment = await tx.investment.update({
          where: { id: investment.id },
          data: {
            lastProfitDate: asOf,
            nextProfitDate,
          },
        });

        const transaction = await tx.transaction.create({
          data: {
            userId: investment.userId,
            investmentId: investment.id,
            type: TransactionType.PROFIT_DISTRIBUTION,
            status: TransactionStatus.COMPLETED,
            amount: distribution.grossProfit,
            fee: distribution.managementFee.add(distribution.reserveAllocation),
            platformShare: distribution.managementFee.add(distribution.reserveAllocation),
            userShare: distribution.netProfit,
            reference: distribution.reference,
            metadata: {
              roiPercentage: distribution.roiPercentage.toString(),
              managementFeeRate: MANAGEMENT_FEE_RATE.toString(),
              reserveRate: reserveSnapshot.targetPercentage.toString(),
            },
            initiatedAt: asOf,
            processedAt: asOf,
          },
        });

        const profitHistory = await tx.profitHistory.create({
          data: {
            userId: investment.userId,
            investmentId: investment.id,
            planId: plan.id,
            distributionDate: asOf,
            roiPercentage: distribution.roiPercentage,
            grossProfit: distribution.grossProfit,
            managementFee: distribution.managementFee,
            reserveAllocation: distribution.reserveAllocation,
            netProfit: distribution.netProfit,
            status: ProfitStatus.DISTRIBUTED,
            reference: distribution.reference,
            metadata: {
              actorId,
              transactionId: transaction.id,
            },
          },
        });

        await tx.user.update({
          where: { id: investment.userId },
          data: {
            withdrawalBalance: {
              increment: distribution.netProfit,
            },
            totalEarnings: {
              increment: distribution.grossProfit,
            },
          },
        });

        if (distribution.reserveAllocation.greaterThan(0)) {
          if (reserveSnapshot.id) {
            await tx.reserveBuffer.update({
              where: { id: reserveSnapshot.id },
              data: {
                currentBalance: {
                  increment: distribution.reserveAllocation,
                },
                lastRebalancedAt: asOf,
              },
            });
          } else {
            const created = await tx.reserveBuffer.create({
              data: {
                currentBalance: distribution.reserveAllocation,
                targetPercentage: reserveSnapshot.targetPercentage,
                lastRebalancedAt: asOf,
              },
            });

            reserveSnapshot.id = created.id;
          }
        }

        await tx.auditLog.create({
          data: {
            action: "PROFIT_DISTRIBUTED",
            entity: "Investment",
            entityId: investment.id,
            actorId: actorId ?? null,
            userId: investment.userId,
            description: `Weekly profit distribution for plan ${plan.name}`,
            after: {
              investmentId: investment.id,
              transactionId: transaction.id,
              profitHistoryId: profitHistory.id,
              roiPercentage: distribution.roiPercentage.toString(),
              grossProfit: distribution.grossProfit.toString(),
              netProfit: distribution.netProfit.toString(),
              managementFee: distribution.managementFee.toString(),
              reserveAllocation: distribution.reserveAllocation.toString(),
              nextProfitDate: nextProfitDate.toISOString(),
            },
          },
        });

        return {
          transactionId: transaction.id,
          profitHistoryId: profitHistory.id,
          investment: updatedInvestment,
        };
      });

      const lastDetail = summary.details[summary.details.length - 1];
      lastDetail.transactionId = result.transactionId;
      lastDetail.profitHistoryId = result.profitHistoryId;

      summary.totalProcessed += 1;

      await NotificationService.createNotification({
        userId: investment.userId,
        type: NotificationType.PROFIT,
        title: "Weekly Profit Distributed",
        message: `You received $${distribution.netProfit.toFixed(2)} in profit (${distribution.roiPercentage.toFixed(2)}% ROI).`,
        link: "/dashboard",
        data: {
          investmentId: investment.id,
          planId: plan.id,
          grossProfit: distribution.grossProfit.toString(),
          netProfit: distribution.netProfit.toString(),
          roiPercentage: distribution.roiPercentage.toString(),
        },
      });
    }

    return summary;
  }

  private calculateDistribution(
    investment: Investment,
    plan: Plan,
    reserveTarget: Decimal,
  ) {
    const roiPercentage = this.randomRoi(plan);
    const grossProfit = investment.amount.mul(roiPercentage).div(new Prisma.Decimal(100));
    const managementFee = grossProfit.mul(MANAGEMENT_FEE_RATE);
    const reserveAllocation = grossProfit.mul(reserveTarget);
    const netProfit = grossProfit
      .minus(managementFee)
      .minus(reserveAllocation);

    return {
      roiPercentage,
      grossProfit,
      managementFee,
      reserveAllocation,
      netProfit: netProfit.lessThan(0) ? new Prisma.Decimal(0) : netProfit,
      reference: this.generateReference("PFT"),
    };
  }

  private shouldDistribute(investment: Investment, asOf: Date) {
    if (investment.status !== InvestmentStatus.ACTIVE) {
      return false;
    }

    if (investment.lockedUntil && investment.lockedUntil > asOf) {
      return false;
    }

    if (investment.nextProfitDate && investment.nextProfitDate > asOf) {
      return false;
    }

    if (investment.maturedAt && investment.maturedAt <= asOf) {
      return false;
    }

    return true;
  }

  private randomRoi(plan: Plan): Decimal {
    const min = Number(plan.roiMin);
    const max = Number(plan.roiMax ?? plan.roiMin);

    const random = min + Math.random() * (max - min);
    return new Prisma.Decimal(random.toFixed(2));
  }

  private calculateNextProfitDate(reference: Date): Date {
    const next = new Date(reference);
    next.setUTCHours(2, 0, 0, 0);

    const day = next.getUTCDay();
    const diff = (7 - day) % 7;
    next.setUTCDate(next.getUTCDate() + diff);

    if (diff === 0 && reference.getUTCHours() >= 2) {
      next.setUTCDate(next.getUTCDate() + 7);
    }

    return next;
  }

  private calculateLockupEnd(start: Date, lockupDays: number) {
    const result = new Date(start);
    result.setUTCDate(result.getUTCDate() + lockupDays);
    result.setUTCHours(0, 0, 0, 0);
    return result;
  }

  private generateReference(prefix: string) {
    return `${prefix}-${new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)}-${randomUUID()
      .split("-")[0]
      .toUpperCase()}`;
  }
}

export type { InvestmentEngine as CoreInvestmentEngine };
