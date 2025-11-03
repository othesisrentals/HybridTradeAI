/**
 * Paystack Service Tests
 */

import { describe, it, expect } from 'vitest';
import { toKobo, fromKobo } from '@/lib/payment/paystack';

describe('Paystack Service', () => {
  describe('toKobo', () => {
    it('should convert Naira to kobo', () => {
      expect(toKobo(100)).toBe(10000);
      expect(toKobo(1)).toBe(100);
      expect(toKobo(0.5)).toBe(50);
    });

    it('should handle zero', () => {
      expect(toKobo(0)).toBe(0);
    });

    it('should handle decimal amounts', () => {
      expect(toKobo(99.99)).toBe(9999);
      expect(toKobo(1.01)).toBe(101);
    });

    it('should round to nearest kobo', () => {
      expect(toKobo(1.005)).toBe(100); // JavaScript rounding
      expect(toKobo(1.004)).toBe(100);
      expect(toKobo(1.01)).toBe(101);
    });
  });

  describe('fromKobo', () => {
    it('should convert kobo to Naira', () => {
      expect(fromKobo(10000)).toBe(100);
      expect(fromKobo(100)).toBe(1);
      expect(fromKobo(50)).toBe(0.5);
    });

    it('should handle zero', () => {
      expect(fromKobo(0)).toBe(0);
    });

    it('should handle odd amounts', () => {
      expect(fromKobo(9999)).toBe(99.99);
      expect(fromKobo(101)).toBe(1.01);
    });
  });

  describe('conversion consistency', () => {
    it('should maintain consistency in round-trip conversion', () => {
      const amounts = [100, 500, 1000, 5000, 10000];
      
      amounts.forEach((amount) => {
        const kobo = toKobo(amount);
        const naira = fromKobo(kobo);
        expect(naira).toBe(amount);
      });
    });
  });
});
