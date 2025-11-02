/**
 * 2FA Setup API
 * POST /api/auth/2fa/setup - Generate 2FA secret and QR code
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import {
  generateSecret,
  generateQRCode,
  generateBackupCodes,
  hashBackupCode,
} from '@/lib/auth/2fa';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if 2FA is already enabled
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorEnabled: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { success: false, error: '2FA is already enabled' },
        { status: 400 }
      );
    }

    // Generate secret and QR code
    const secret = generateSecret();
    const qrCode = await generateQRCode(user.email, secret);

    // Generate backup codes
    const backupCodes = generateBackupCodes(10);
    const hashedBackupCodes = backupCodes.map(hashBackupCode);

    // Store secret temporarily (not enabled yet)
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorSecret: secret,
        twoFactorBackupCodes: hashedBackupCodes,
      },
    });

    logger.info(`2FA setup initiated for user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      data: {
        secret,
        qrCode,
        backupCodes, // Return plain codes for user to save
      },
    });
  } catch (error) {
    logger.error('Failed to setup 2FA', error);

    return NextResponse.json(
      { success: false, error: 'Failed to setup 2FA' },
      { status: 500 }
    );
  }
}
