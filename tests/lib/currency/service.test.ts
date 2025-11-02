/**
 * Currency Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { formatCurrency } from '@/lib/currency/service';

describe('Currency Service', () => {
  describe('formatCurrency', () => {
    it('should format USD correctly', () => {
      const result = formatCurrency(1000, 'USD', 'en-US');
      expect(result).toBe('$1,000.00');
    });

    it('should format EUR correctly', () => {
      const result = formatCurrency(1234.56, 'EUR', 'en-US');
      expect(result).toBe('?1,234.56');
    });

    it('should format NGN correctly', () => {
      const result = formatCurrency(50000, 'NGN', 'en-US');
      expect(result).toBe('?50,000.00');
    });

    it('should handle zero amount', () => {
      const result = formatCurrency(0, 'USD', 'en-US');
      expect(result).toBe('$0.00');
    });

    it('should handle negative amounts', () => {
      const result = formatCurrency(-100, 'USD', 'en-US');
      expect(result).toBe('-$100.00');
    });

    it('should format with correct decimal places', () => {
      const result = formatCurrency(99.99, 'USD', 'en-US');
      expect(result).toBe('$99.99');
    });

    it('should round to 2 decimal places', () => {
      const result = formatCurrency(99.999, 'USD', 'en-US');
      expect(result).toBe('$100.00');
    });
  });
});
