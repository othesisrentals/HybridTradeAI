/**
 * Currency Configuration
 */

export const supportedCurrencies = [
  'USD', // US Dollar (base)
  'EUR', // Euro
  'GBP', // British Pound
  'NGN', // Nigerian Naira
  'GHS', // Ghanaian Cedi
  'KES', // Kenyan Shilling
  'ZAR', // South African Rand
  'CNY', // Chinese Yuan
  'INR', // Indian Rupee
  'JPY', // Japanese Yen
  'AUD', // Australian Dollar
  'CAD', // Canadian Dollar
  'CHF', // Swiss Franc
  'AED', // UAE Dirham
  'SAR', // Saudi Riyal
] as const;

export type Currency = (typeof supportedCurrencies)[number];

export const currencySymbols: Record<Currency, string> = {
  USD: '$',
  EUR: '?',
  GBP: '?',
  NGN: '?',
  GHS: '?',
  KES: 'KSh',
  ZAR: 'R',
  CNY: '?',
  INR: '?',
  JPY: '?',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  AED: '?.?',
  SAR: '?',
};

export const currencyNames: Record<Currency, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  NGN: 'Nigerian Naira',
  GHS: 'Ghanaian Cedi',
  KES: 'Kenyan Shilling',
  ZAR: 'South African Rand',
  CNY: 'Chinese Yuan',
  INR: 'Indian Rupee',
  JPY: 'Japanese Yen',
  AUD: 'Australian Dollar',
  CAD: 'Canadian Dollar',
  CHF: 'Swiss Franc',
  AED: 'UAE Dirham',
  SAR: 'Saudi Riyal',
};

export const defaultCurrency: Currency = 'USD';

// Cache TTL for exchange rates (1 hour)
export const EXCHANGE_RATE_CACHE_TTL = 3600;
