import OpenAI from 'openai'
import { prisma } from '@/lib/db/prisma'
import type { AIMessageRole } from '@prisma/client'

const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not defined')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

const COMPANY_KNOWLEDGE_BASE = `
HybridTradeAI Investment Platform Knowledge Base:

INVESTMENT PLANS:
1. Starter Plan:
   - Minimum: $100
   - Maximum: $5,000
   - ROI Range: 5-12% per week
   - Duration: 12 weeks
   - Management Fee: 10% of profits

2. Pro Plan:
   - Minimum: $5,000
   - Maximum: $50,000
   - ROI Range: 8-18% per week
   - Duration: 12 weeks
   - Management Fee: 10% of profits
   - Premium ad tasks available

3. Elite Plan:
   - Minimum: $50,000
   - Maximum: $500,000
   - ROI Range: 12-25% per week
   - Duration: 12 weeks
   - Management Fee: 10% of profits
   - Premium ad tasks and priority support

REVENUE STREAMS:
- Algorithmic Trading: 40% allocation
- Crypto Staking: 25% allocation
- Copy Trading: 15% allocation
- Advertising & Tasks: 20% allocation
- Management Fees: 10% of all profits

AD TASK SYSTEM:
- Users earn 70% of ad revenue
- Platform keeps 30% commission
- Daily limits apply per user
- Elite plan users get access to premium tasks
- Tasks include: video ads, surveys, app installs, offer walls

WITHDRAWAL:
- KYC verification required
- Minimum withdrawal: $10
- Withdrawals from profit balance only
- Admin approval required
- Processing time: 1-3 business days

PROFIT DISTRIBUTION:
- Weekly automated distribution (Sundays)
- Random ROI within plan ranges
- 10% management fee deducted
- Profits go to withdrawal balance

KYC REQUIREMENTS:
- Valid government ID (passport, driver's license, national ID)
- Proof of address (utility bill, bank statement)
- Selfie photo
- Admin approval required

SUPPORT:
- Email: support@hybridtradeai.com
- Response time: 24-48 hours
- Priority support for Elite plan users
`

/**
 * Get AI response for user query
 */
export async function getAIResponse(
  conversationId: string,
  userMessage: string,
  userId: string
) {
  // Get conversation history
  const conversation = await prisma.aIConversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!conversation || conversation.userId !== userId) {
    throw new Error('Conversation not found')
  }

  // Get user context
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      investments: {
        where: { status: 'ACTIVE' },
        include: { plan: true },
      },
    },
  })

  // Build context
  const userContext = user
    ? `
User Profile:
- Current Plan: ${user.investments[0]?.plan?.name || 'None'}
- Invested Balance: $${user.investedBalance}
- Withdrawal Balance: $${user.withdrawalBalance}
- Total Earnings: $${user.totalEarnings}
- KYC Status: ${user.kycStatus}
`
    : ''

  // Build messages array
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are a helpful AI assistant for HybridTradeAI investment platform. 
Use the following knowledge base to answer questions accurately:
${COMPANY_KNOWLEDGE_BASE}

${userContext}

Be friendly, professional, and helpful. If you don't know something, say so. 
For technical issues or account problems, suggest contacting support.`,
    },
  ]

  // Add conversation history
  for (const msg of conversation.messages) {
    messages.push({
      role: msg.role.toLowerCase() as 'user' | 'assistant' | 'system',
      content: msg.content,
    })
  }

  // Add current user message
  messages.push({
    role: 'user',
    content: userMessage,
  })

  const startTime = Date.now()

  // Get AI response
  const openai = getOpenAI()
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages,
    temperature: 0.7,
    max_tokens: 500,
  })

  const responseTime = Date.now() - startTime
  const assistantMessage = completion.choices[0]?.message?.content || ''

  // Save messages to database
  await prisma.aIMessage.createMany({
    data: [
      {
        conversationId,
        role: 'USER',
        content: userMessage,
      },
      {
        conversationId,
        role: 'ASSISTANT',
        content: assistantMessage,
        model: 'gpt-4-turbo-preview',
        tokensUsed: completion.usage?.total_tokens,
        responseTime,
      },
    ],
  })

  // Update conversation
  await prisma.aIConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  })

  return {
    message: assistantMessage,
    tokensUsed: completion.usage?.total_tokens,
    responseTime,
  }
}

/**
 * Create new AI conversation
 */
export async function createAIConversation(userId: string) {
  const conversation = await prisma.aIConversation.create({
    data: {
      userId,
      title: 'New Conversation',
    },
  })

  return conversation
}

/**
 * Get user conversations
 */
export async function getUserConversations(userId: string) {
  return await prisma.aIConversation.findMany({
    where: { userId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 1, // Just get first message for preview
      },
      _count: {
        select: { messages: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })
}

/**
 * Get conversation with messages
 */
export async function getConversation(conversationId: string, userId: string) {
  return await prisma.aIConversation.findFirst({
    where: {
      id: conversationId,
      userId,
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })
}

