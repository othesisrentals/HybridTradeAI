/**
 * 2FA Service Tests
 */

import { describe, it, expect } from 'vitest';
import {
  generateSecret,
  verifyToken,
  generateBackupCodes,
  isValidTokenFormat,
  formatBackupCode,
} from '@/lib/auth/2fa';

describe('2FA Service', () => {
  describe('generateSecret', () => {
    it('should generate a secret', () => {
      const secret = generateSecret();
      expect(secret).toBeDefined();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThan(0);
    });

    it('should generate different secrets', () => {
      const secret1 = generateSecret();
      const secret2 = generateSecret();
      expect(secret1).not.toBe(secret2);
    });
  });

  describe('isValidTokenFormat', () => {
    it('should validate 6-digit tokens', () => {
      expect(isValidTokenFormat('123456')).toBe(true);
      expect(isValidTokenFormat('000000')).toBe(true);
      expect(isValidTokenFormat('999999')).toBe(true);
    });

    it('should reject invalid tokens', () => {
      expect(isValidTokenFormat('12345')).toBe(false); // Too short
      expect(isValidTokenFormat('1234567')).toBe(false); // Too long
      expect(isValidTokenFormat('12345a')).toBe(false); // Contains letter
      expect(isValidTokenFormat('12-456')).toBe(false); // Contains hyphen
      expect(isValidTokenFormat('')).toBe(false); // Empty
    });
  });

  describe('generateBackupCodes', () => {
    it('should generate default 10 codes', () => {
      const codes = generateBackupCodes();
      expect(codes).toHaveLength(10);
    });

    it('should generate specified number of codes', () => {
      const codes = generateBackupCodes(5);
      expect(codes).toHaveLength(5);
    });

    it('should generate unique codes', () => {
      const codes = generateBackupCodes(10);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(10);
    });

    it('should generate 8-character codes', () => {
      const codes = generateBackupCodes(5);
      codes.forEach((code) => {
        expect(code.length).toBe(8);
      });
    });

    it('should generate uppercase hex codes', () => {
      const codes = generateBackupCodes(5);
      codes.forEach((code) => {
        expect(code).toMatch(/^[0-9A-F]{8}$/);
      });
    });
  });

  describe('formatBackupCode', () => {
    it('should format code with hyphen', () => {
      const formatted = formatBackupCode('12345678');
      expect(formatted).toBe('1234-5678');
    });

    it('should handle 8-character codes', () => {
      const formatted = formatBackupCode('12345678');
      expect(formatted).toMatch(/\d{4}-\d{4}/);
      expect(formatted).toBe('1234-5678');
    });
  });

  describe('verifyToken', () => {
    it('should verify correct token', () => {
      const secret = generateSecret();
      const { authenticator } = require('otplib');
      const token = authenticator.generate(secret);
      
      const isValid = verifyToken(token, secret);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect token', () => {
      const secret = generateSecret();
      const isValid = verifyToken('000000', secret);
      expect(isValid).toBe(false);
    });

    it('should reject malformed token', () => {
      const secret = generateSecret();
      const isValid = verifyToken('invalid', secret);
      expect(isValid).toBe(false);
    });
  });
});
