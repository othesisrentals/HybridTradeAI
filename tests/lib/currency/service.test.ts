/**
 * Currency Service Tests
 */

import { describe, it, expect } from 'vitest';
import { formatCurrency } from '@/lib/currency/service';

describe('Currency Service', () => {
  describe('formatCurrency', () => {
    it('should format USD correctly', () => {
      const result = formatCurrency(1000, 'USD', 'en-US');
      expect(result).toContain('1,000.00');
      expect(result).toContain('$');
    });

    it('should format EUR correctly', () => {
      const result = formatCurrency(1234.56, 'EUR', 'en-US');
      expect(result).toContain('1,234.56');
      expect(result.length).toBeGreaterThan(5);
    });

    it('should format NGN correctly', () => {
      const result = formatCurrency(50000, 'NGN', 'en-US');
      expect(result).toContain('50,000.00');
      expect(result.length).toBeGreaterThan(5);
    });

    it('should handle zero amount', () => {
      const result = formatCurrency(0, 'USD', 'en-US');
      expect(result).toContain('0.00');
      expect(result).toContain('$');
    });

    it('should handle negative amounts', () => {
      const result = formatCurrency(-100, 'USD', 'en-US');
      expect(result).toContain('100.00');
      expect(result).toContain('-');
    });

    it('should format with correct decimal places', () => {
      const result = formatCurrency(99.99, 'USD', 'en-US');
      expect(result).toContain('99.99');
    });

    it('should round to 2 decimal places', () => {
      const result = formatCurrency(99.999, 'USD', 'en-US');
      expect(result).toContain('100.00');
    });
  });
});
