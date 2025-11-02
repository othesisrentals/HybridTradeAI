/**
 * Two-Factor Authentication (2FA) Service
 * Implements TOTP-based 2FA using otplib
 */

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { randomBytes } from 'crypto';
import { logger } from '@/lib/utils/logger';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'HybridTradeAI';

// Configure TOTP
authenticator.options = {
  step: 30, // 30 seconds time window
  window: 1, // Allow 1 step before and after current time
};

/**
 * Generate a new TOTP secret
 */
export function generateSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate QR code data URL for TOTP setup
 */
export async function generateQRCode(
  email: string,
  secret: string
): Promise<string> {
  try {
    const otpauth = authenticator.keyuri(email, APP_NAME, secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);
    return qrCodeDataUrl;
  } catch (error) {
    logger.error('Failed to generate QR code', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Verify TOTP token
 */
export function verifyToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    logger.error('Failed to verify TOTP token', error);
    return false;
  }
}

/**
 * Generate backup codes
 * Returns an array of 10 backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  
  return codes;
}

/**
 * Hash backup code for storage
 * In production, you should use bcrypt or similar
 */
export function hashBackupCode(code: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Verify backup code
 */
export function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): boolean {
  const hashedInput = hashBackupCode(code);
  return hashedCodes.includes(hashedInput);
}

/**
 * Remove used backup code from list
 */
export function removeBackupCode(
  code: string,
  hashedCodes: string[]
): string[] {
  const hashedInput = hashBackupCode(code);
  return hashedCodes.filter((c) => c !== hashedInput);
}

/**
 * Validate TOTP token format
 */
export function isValidTokenFormat(token: string): boolean {
  return /^\d{6}$/.test(token);
}

/**
 * Generate recovery codes in user-friendly format
 * Format: XXXX-XXXX
 */
export function formatBackupCode(code: string): string {
  return code.match(/.{1,4}/g)?.join('-') || code;
}
