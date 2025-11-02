/**
 * Fixer API integration for currency exchange rates
 * Uses Redis caching to minimize API calls
 */

import axios from 'axios';
import { redis } from '@/lib/redis/client';
import { RedisKeys } from '@/lib/redis/keys';
import { REDIS_TTL, BASE_CURRENCY } from '@/config/constants';
import { logger } from '@/lib/utils/logger';

const FIXER_API_KEY = process.env.FIXER_API_KEY || process.env.FX_API_KEY;
const FIXER_API_URL = process.env.FIXER_API_URL || 'https://api.fixer.io/latest';

export interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

export interface CurrencyConversionResult {
  from: string;
  to: string;
  amount: number;
  convertedAmount: number;
  rate: number;
  timestamp: Date;
}

/**
 * Fetch exchange rates from Fixer API
 */
export async function fetchExchangeRates(baseCurrency: string = BASE_CURRENCY): Promise<ExchangeRates> {
  const cacheKey = RedisKeys.cache(`exchange_rates:${baseCurrency}`);
  
  // Try to get from cache first
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const rates = JSON.parse(cached) as ExchangeRates;
      logger.info('Exchange rates fetched from cache', { baseCurrency });
      return rates;
    }
  } catch (error) {
    logger.warn('Failed to fetch exchange rates from cache', { error });
  }

  // Fetch from API
  if (!FIXER_API_KEY) {
    logger.warn('FIXER_API_KEY not configured, using fallback API');
    // Fallback to exchangerate-api.com (free tier)
    const fallbackUrl = `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`;
    try {
      const response = await axios.get(fallbackUrl);
      const rates: ExchangeRates = {
        base: baseCurrency,
        date: new Date().toISOString().split('T')[0],
        rates: response.data.rates,
      };
      
      // Cache the result
      await redis.setex(cacheKey, REDIS_TTL.CURRENCY_RATES, JSON.stringify(rates));
      return rates;
    } catch (error) {
      logger.error('Failed to fetch exchange rates from fallback API', { error });
      throw new Error('Failed to fetch exchange rates');
    }
  }

  try {
    const url = `${FIXER_API_URL}?access_key=${FIXER_API_KEY}&base=${baseCurrency}`;
    const response = await axios.get(url);
    
    if (!response.data.success && response.data.error) {
      throw new Error(`Fixer API error: ${response.data.error.info}`);
    }

    const rates: ExchangeRates = {
      base: baseCurrency,
      date: response.data.date,
      rates: response.data.rates,
    };

    // Cache the result
    await redis.setex(cacheKey, REDIS_TTL.CURRENCY_RATES, JSON.stringify(rates));
    
    logger.info('Exchange rates fetched from Fixer API', { baseCurrency });
    return rates;
  } catch (error) {
    logger.error('Failed to fetch exchange rates from Fixer API', { error });
    throw error;
  }
}

/**
 * Convert amount from one currency to another
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<CurrencyConversionResult> {
  if (fromCurrency === toCurrency) {
    return {
      from: fromCurrency,
      to: toCurrency,
      amount,
      convertedAmount: amount,
      rate: 1,
      timestamp: new Date(),
    };
  }

  const rates = await fetchExchangeRates(fromCurrency);
  
  // If base currency is the from currency, use direct rate
  let rate: number;
  if (rates.base === fromCurrency) {
    rate = rates.rates[toCurrency] || 1;
  } else {
    // Convert through base currency
    const fromRate = rates.rates[fromCurrency] || 1;
    const toRate = rates.rates[toCurrency] || 1;
    rate = toRate / fromRate;
  }

  const convertedAmount = amount * rate;

  return {
    from: fromCurrency,
    to: toCurrency,
    amount,
    convertedAmount: Number(convertedAmount.toFixed(2)),
    rate: Number(rate.toFixed(6)),
    timestamp: new Date(),
  };
}

/**
 * Get exchange rate between two currencies
 */
export async function getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
  if (fromCurrency === toCurrency) {
    return 1;
  }

  const result = await convertCurrency(1, fromCurrency, toCurrency);
  return result.rate;
}

/**
 * Format currency amount with proper symbol and locale
 */
export function formatCurrencyAmount(
  amount: number,
  currency: string,
  locale: string = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback formatting
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${amount.toFixed(2)}`;
  }
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '?',
    GBP: '?',
    NGN: '?',
    GHS: '?',
    ZAR: 'R',
    KES: 'KSh',
    CNY: '?',
    INR: '?',
  };
  
  return symbols[currency] || currency;
}
