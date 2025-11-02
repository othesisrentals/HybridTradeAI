import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db/prisma'
import { dbTransaction } from '@/lib/db/transactions'
import { createNotification } from '@/lib/notifications/notifications'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        // Find transaction by payment reference
        const transaction = await prisma.transaction.findUnique({
          where: { paymentReference: paymentIntent.id },
          include: { user: true },
        })

        if (transaction && transaction.status === 'PENDING') {
          await dbTransaction(async (tx) => {
            // Update transaction status
            await tx.transaction.update({
              where: { id: transaction.id },
              data: {
                status: 'APPROVED',
                approvedAt: new Date(),
              },
            })

            // Credit user account
            await tx.user.update({
              where: { id: transaction.userId },
              data: {
                withdrawalBalance: {
                  increment: Number(transaction.amount),
                },
              },
            })

            // Create notification
            await createNotification({
              userId: transaction.userId,
              type: 'DEPOSIT_APPROVED',
              priority: 'HIGH',
              title: 'Payment Successful',
              message: `Your deposit of $${transaction.amount} has been processed successfully.`,
              link: '/dashboard/transactions',
            })
          })
        }

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        const transaction = await prisma.transaction.findUnique({
          where: { paymentReference: paymentIntent.id },
        })

        if (transaction) {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'FAILED',
            },
          })

          await createNotification({
            userId: transaction.userId,
            type: 'DEPOSIT_REJECTED',
            priority: 'HIGH',
            title: 'Payment Failed',
            message: `Your deposit payment failed. Please try again.`,
            link: '/dashboard/transactions',
          })
        }

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
