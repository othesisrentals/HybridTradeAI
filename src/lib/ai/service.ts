import OpenAI from 'openai';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';
import { formatCurrency } from '@/lib/utils/currency';

const COMPANY_KNOWLEDGE = `
You are a helpful AI assistant for HybridTradeAI, an investment platform. Here's what you need to know:

COMPANY OVERVIEW:
HybridTradeAI is an AI-powered investment platform that helps users grow their wealth through automated trading strategies.

INVESTMENT PLANS:
1. Starter Plan: $100 - $5,000 investment, 5-12% weekly ROI
2. Pro Plan: $5,000 - $50,000 investment, 8-18% weekly ROI
3. Elite Plan: $50,000+ investment, 12-25% weekly ROI

REVENUE STREAMS:
- Algorithmic trading (40%)
- Crypto staking (25%)
- Copy-trading (15%)
- Advertising & tasks (20%)
- Management fees (10% of profits)

HOW IT WORKS:
1. User deposits funds (requires admin approval)
2. Investment becomes active after approval
3. Weekly profit distribution every Sunday at 2 AM
4. Profits are added to withdrawal balance (can be withdrawn)
5. Principal remains invested until user withdraws

ADDITIONAL FEATURES:
- Ad tasks for extra income (30% platform fee)
- Real-time notifications
- KYC verification required for withdrawals
- Reserve buffer system for security

IMPORTANT POLICIES:
- 10% management fee on all profits
- Profits distributed weekly
- KYC required for large withdrawals
- Principal can be withdrawn with notice

Always be helpful, professional, and provide accurate information based on this knowledge.
`;

export class AIService {
  private openai: OpenAI | null = null;

  private getOpenAIClient(): OpenAI {
    if (!this.openai) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is required');
      }
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return this.openai;
  }

  /**
   * Send a message to the AI assistant
   */
  /**
   * Send a message to the AI assistant
   */
  async chat(userId: string, message: string, conversationId?: string) {
    try {
      // Get or create conversation
      let conversation;
      if (conversationId) {
        conversation = await prisma.aIConversation.findUnique({
          where: { id: conversationId, userId },
        });
      }

      if (!conversation) {
        conversation = await prisma.aIConversation.create({
          data: {
            userId,
            title: message.slice(0, 50),
          },
        });
      }

      // Build messages array for OpenAI
      const messages: any[] = [
        { role: 'system', content: COMPANY_KNOWLEDGE },
      ];

      // Add conversation history
      const history = await prisma.aIMessage.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'asc' },
      });

      // Convert history to OpenAI format
      messages.push(...history.map(h => ({
        role: h.role.toLowerCase(),
        content: h.content,
      })));

      // Add user context
      const context = await this.getUserContext(userId);
      if (context) {
        messages.push({
          role: 'system',
          content: `User Context: ${JSON.stringify(context, null, 2)}`,
        });
      }

      // Add current message
      messages.push({ role: 'user', content: message });

      // Get AI response
      const completion = await this.getOpenAIClient().chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      const aiResponse = completion.choices[0].message.content || 'Sorry, I could not generate a response.';

      // Save messages to database
      await prisma.aIMessage.createMany({
        data: [
          {
            conversationId: conversation.id,
            role: 'USER',
            content: message,
          },
          {
            conversationId: conversation.id,
            role: 'ASSISTANT',
            content: aiResponse,
            model: 'gpt-4-turbo-preview',
            tokensUsed: completion.usage?.total_tokens,
            responseTime: completion.usage ? Math.round((completion.usage.total_tokens / 1000) * 1000) : null,
          },
        ],
      });

      logger.info('AI chat message processed', {
        userId,
        conversationId: conversation.id,
      });

      logger.info('AI chat message processed', {
        userId,
        conversationId: conversation.id,
      });

      return {
        conversationId: conversation.id,
        message: aiResponse,
      };
    } catch (error) {
      logger.error('AI chat error', error);
      throw new Error('Failed to process AI request');
    }
  }

  /**
   * Get user context for personalized responses
   */
  private async getUserContext(userId: string) {
    const [user, investments, stats] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          investedBalance: true,
          withdrawalBalance: true,
          kycStatus: true,
        },
      }),
      prisma.investment.findMany({
        where: { userId, status: 'ACTIVE' },
        include: { plan: true },
      }),
      prisma.profitHistory.aggregate({
        where: { userId },
        _sum: { netProfit: true },
        _avg: { roiPercentage: true },
      }),
    ]);

    if (!user) return null;

    return {
      totalInvested: formatCurrency(Number(user.investedBalance)),
      availableBalance: formatCurrency(Number(user.withdrawalBalance)),
      activeInvestments: investments.length,
      investments: investments.map((inv) => ({
        plan: inv.plan.name,
        amount: formatCurrency(Number(inv.amount)),
        earned: formatCurrency(Number(inv.totalProfitEarned)),
      })),
      totalEarned: formatCurrency(Number(stats._sum.netProfit || 0)),
      averageROI: stats._avg.roiPercentage?.toFixed(2) + '%' || '0%',
      kycStatus: user.kycStatus,
    };
  }

  /**
   * Get conversation history
   */
  async getConversations(userId: string, limit: number = 10) {
    return prisma.aIConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get latest message for preview
        },
      },
    });
  }

  /**
   * Get specific conversation
   */
  async getConversation(conversationId: string, userId: string) {
    return prisma.aIConversation.findUnique({
      where: { id: conversationId, userId },
    });
  }

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: string, userId: string) {
    // Soft delete by marking as resolved
    return prisma.aIConversation.update({
      where: { id: conversationId, userId },
      data: { isResolved: true, resolvedAt: new Date() },
    });
  }

  /**
   * Estimate investment profits
   */
  async estimateProfits(planId: string, amount: number, weeks: number = 4) {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Plan not found');

    const managementFee = parseFloat(process.env.MANAGEMENT_FEE_PERCENT || '10');

    // Calculate min and max scenarios
    const minWeeklyProfit = (amount * Number(plan.roiMin)) / 100;
    const maxWeeklyProfit = (amount * Number(plan.roiMax)) / 100;

    const minWeeklyNet = minWeeklyProfit * (1 - managementFee / 100);
    const maxWeeklyNet = maxWeeklyProfit * (1 - managementFee / 100);

    return {
      plan: plan.name,
      amount: formatCurrency(amount),
      weeks,
      estimates: {
        weekly: {
          min: formatCurrency(Math.round(minWeeklyNet)),
          max: formatCurrency(Math.round(maxWeeklyNet)),
        },
        total: {
          min: formatCurrency(Math.round(minWeeklyNet * weeks)),
          max: formatCurrency(Math.round(maxWeeklyNet * weeks)),
        },
        finalValue: {
          min: formatCurrency(amount + Math.round(minWeeklyNet * weeks)),
          max: formatCurrency(amount + Math.round(maxWeeklyNet * weeks)),
        },
      },
      roiRange: `${Number(plan.roiMin)}% - ${Number(plan.roiMax)}%`,
      managementFee: `${managementFee}%`,
    };
  }
}

export const aiService = new AIService();

