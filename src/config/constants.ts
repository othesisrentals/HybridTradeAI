/**
 * Application Constants
 * Centralized configuration constants for the HybridTradeAI platform
 */

// API Endpoints
export const API_ENDPOINTS = {
  // Payment Gateways
  PAYSTACK_INITIALIZE: 'https://api.paystack.co/transaction/initialize',
  PAYSTACK_VERIFY: 'https://api.paystack.co/transaction/verify',
  FLUTTERWAVE_INITIALIZE: 'https://api.flutterwave.com/v3/payments',
  FLUTTERWAVE_VERIFY: 'https://api.flutterwave.com/v3/transactions',
  COINBASE_COMMERCE: 'https://api.commerce.coinbase.com',
  
  // Currency API
  FIXER_API: 'https://api.fixer.io/latest',
  EXCHANGE_RATE_API: 'https://api.exchangerate-api.com/v4/latest',
  
  // Ad Networks
  ADMOB_API: 'https://admob.googleapis.com/v1',
} as const;

// Currency Configuration
export const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '?', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '?', name: 'British Pound' },
  NGN: { code: 'NGN', symbol: '?', name: 'Nigerian Naira' },
  GHS: { code: 'GHS', symbol: '?', name: 'Ghanaian Cedi' },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  KES: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  CNY: { code: 'CNY', symbol: '?', name: 'Chinese Yuan' },
  INR: { code: 'INR', symbol: '?', name: 'Indian Rupee' },
} as const;

export const DEFAULT_CURRENCY = 'USD';
export const BASE_CURRENCY = 'USD';

// Supported Languages
export const LANGUAGES = {
  en: { code: 'en', name: 'English', nativeName: 'English' },
  fr: { code: 'fr', name: 'French', nativeName: 'Fran?ais' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Espa?ol' },
  ar: { code: 'ar', name: 'Arabic', nativeName: '???????' },
  zh: { code: 'zh', name: 'Chinese', nativeName: '??' },
  hi: { code: 'hi', name: 'Hindi', nativeName: '??????' },
  yo: { code: 'yo', name: 'Yoruba', nativeName: 'Yor?b?' },
  ha: { code: 'ha', name: 'Hausa', nativeName: 'Hausa' },
} as const;

export const DEFAULT_LANGUAGE = 'en';

// Redis TTL Configuration (in seconds)
export const REDIS_TTL = {
  CURRENCY_RATES: 3600, // 1 hour
  USER_SESSION: 86400, // 24 hours
  AD_COOLDOWN: 86400, // 24 hours
  RATE_LIMIT: 60, // 1 minute
  CACHE_DEFAULT: 300, // 5 minutes
} as const;

// Investment Plan Configuration
export const PLAN_CONFIG = {
  STARTER: {
    minAmount: 100,
    maxAmount: 5000,
    roiMin: 5,
    roiMax: 12,
    durationWeeks: 12,
  },
  PRO: {
    minAmount: 5000,
    maxAmount: 50000,
    roiMin: 8,
    roiMax: 18,
    durationWeeks: 12,
  },
  ELITE: {
    minAmount: 50000,
    maxAmount: 500000,
    roiMin: 12,
    roiMax: 25,
    durationWeeks: 12,
  },
} as const;

// Revenue Stream Allocations
export const REVENUE_STREAM_ALLOCATIONS = {
  ALGORITHMIC_TRADING: 40,
  CRYPTO_STAKING: 25,
  COPY_TRADING: 15,
  ADVERTISING: 20,
} as const;

// Reserve Buffer Configuration
export const RESERVE_BUFFER_PERCENTAGE = 10; // 10% of AUM

// Profit Distribution
export const PROFIT_DISTRIBUTION = {
  CYCLE_DAYS: 14, // Every 14 days
  MANAGEMENT_FEE_PERCENTAGE: 10, // 10% of profits
} as const;

// Ad Task Configuration
export const AD_TASK_CONFIG = {
  PLATFORM_COMMISSION: 30, // 30% platform commission
  USER_REWARD_PERCENTAGE: 70, // 70% user reward
  DEFAULT_COOLDOWN_HOURS: 24,
} as const;

// Security Configuration
export const SECURITY = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 30,
  SESSION_TIMEOUT_MINUTES: 60,
  PASSWORD_MIN_LENGTH: 8,
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  API_REQUESTS_PER_MINUTE: 60,
  LOGIN_ATTEMPTS_PER_HOUR: 5,
  DEPOSIT_REQUESTS_PER_DAY: 10,
  WITHDRAWAL_REQUESTS_PER_DAY: 5,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// File Upload Limits
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 5,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
  KYC_MAX_SIZE_MB: 10,
} as const;

export default {
  API_ENDPOINTS,
  CURRENCIES,
  DEFAULT_CURRENCY,
  BASE_CURRENCY,
  LANGUAGES,
  DEFAULT_LANGUAGE,
  REDIS_TTL,
  PLAN_CONFIG,
  REVENUE_STREAM_ALLOCATIONS,
  RESERVE_BUFFER_PERCENTAGE,
  PROFIT_DISTRIBUTION,
  AD_TASK_CONFIG,
  SECURITY,
  RATE_LIMITS,
  PAGINATION,
  FILE_UPLOAD,
};
