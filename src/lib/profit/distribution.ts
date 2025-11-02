import { prisma } from '@/lib/db/prisma'
import { profitEngine } from '@/lib/profit/engine'
import { investmentService } from '@/lib/investment/service'
import {
  InvestmentStatus,
  TransactionStatus,
  TransactionType,
} from '@prisma/client'
import { logger } from '@/lib/utils/logger'

export async function distributeWeeklyProfits() {
  return profitEngine.distributeWeeklyProfits()
}

export async function autoInvestApprovedDeposits() {
  const pendingInvestments = await prisma.investment.findMany({
    where: {
      status: InvestmentStatus.PENDING,
      transactions: {
        some: {
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.APPROVED,
        },
      },
    },
    include: {
      transactions: {
        where: {
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.APPROVED,
        },
        orderBy: { approvedAt: 'asc' },
        take: 1,
      },
    },
  })

  const summary = {
    processed: 0,
    skipped: 0,
    errors: 0,
  }

  for (const investment of pendingInvestments) {
    const depositTx = investment.transactions[0]

    if (!depositTx) {
      summary.skipped += 1
      continue
    }

    try {
      await investmentService.approveDeposit(
        investment.id,
        depositTx.approvedBy ?? 'system-auto',
        depositTx.adminNotes || undefined
      )

      summary.processed += 1
    } catch (error) {
      summary.errors += 1
      logger.error('Auto-invest deposit failed', error as Error, {
        investmentId: investment.id,
        transactionId: depositTx.id,
      })
    }
  }

  return summary
}
