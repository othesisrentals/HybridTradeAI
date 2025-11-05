import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * Health check endpoint for monitoring
 */
export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`

    // Check Redis connection (lazy import to avoid build-time issues)
    let redisStatus = 'skipped'
    try {
      const { redis } = await import('@/lib/redis/client')
      await redis.ping()
      redisStatus = 'connected'
    } catch (error) {
      redisStatus = 'disconnected'
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: redisStatus,
      },
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

