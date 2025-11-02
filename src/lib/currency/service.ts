/**
 * Currency Conversion Service
 * Integrates with Fixer.io API and Redis caching
 */

import { redis } from '@/lib/redis/client';
import { logger } from '@/lib/utils/logger';
import {
  type Currency,
  defaultCurrency,
  supportedCurrencies,
  EXCHANGE_RATE_CACHE_TTL,
} from './config';

const FIXER_API_KEY = process.env.FX_API_KEY;
const FIXER_BASE_URL = 'https://api.apilayer.com/fixer';
const CACHE_KEY_PREFIX = 'exchange_rates:';

export interface ExchangeRates {
  base: Currency;
  rates: Record<string, number>;
  timestamp: number;
}

/**
 * Fetch exchange rates from Fixer API
 */
async function fetchExchangeRatesFromAPI(
  base: Currency = defaultCurrency
): Promise<ExchangeRates> {
  if (!FIXER_API_KEY) {
    throw new Error('FX_API_KEY not configured');
  }

  const symbols = supportedCurrencies.join(',');
  const url = `${FIXER_BASE_URL}/latest?base=${base}&symbols=${symbols}`;

  try {
    const response = await fetch(url, {
      headers: {
        apikey: FIXER_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Fixer API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`Fixer API error: ${data.error?.info || 'Unknown error'}`);
    }

    return {
      base: data.base,
      rates: data.rates,
      timestamp: data.timestamp,
    };
  } catch (error) {
    logger.error('Failed to fetch exchange rates from Fixer', error);
    throw error;
  }
}

/**
 * Get exchange rates with Redis caching
 */
export async function getExchangeRates(
  base: Currency = defaultCurrency
): Promise<ExchangeRates> {
  const cacheKey = `${CACHE_KEY_PREFIX}${base}`;

  try {
    // Try to get from cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.info(`Exchange rates cache hit for ${base}`);
      return JSON.parse(cached);
    }

    logger.info(`Exchange rates cache miss for ${base}, fetching from API`);

    // Fetch from API
    const rates = await fetchExchangeRatesFromAPI(base);

    // Cache the result
    await redis.setex(cacheKey, EXCHANGE_RATE_CACHE_TTL, JSON.stringify(rates));

    return rates;
  } catch (error) {
    logger.error('Failed to get exchange rates', error);

    // Return fallback rates (1:1 for same currency)
    return {
      base,
      rates: supportedCurrencies.reduce(
        (acc, curr) => {
          acc[curr] = curr === base ? 1 : 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      timestamp: Date.now() / 1000,
    };
  }
}

/**
 * Convert amount from one currency to another
 */
export async function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency
): Promise<number> {
  if (from === to) {
    return amount;
  }

  try {
    // Get exchange rates with 'from' currency as base
    const rates = await getExchangeRates(from);

    // Convert to target currency
    const rate = rates.rates[to];
    if (!rate) {
      throw new Error(`Exchange rate not found for ${to}`);
    }

    return amount * rate;
  } catch (error) {
    logger.error(`Failed to convert ${amount} ${from} to ${to}`, error);
    throw error;
  }
}

/**
 * Format currency amount with symbol
 */
export function formatCurrency(
  amount: number,
  currency: Currency,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Invalidate exchange rates cache
 */
export async function invalidateExchangeRatesCache(
  base?: Currency
): Promise<void> {
  try {
    if (base) {
      const cacheKey = `${CACHE_KEY_PREFIX}${base}`;
      await redis.del(cacheKey);
      logger.info(`Invalidated exchange rates cache for ${base}`);
    } else {
      // Invalidate all exchange rate caches
      const keys = await redis.keys(`${CACHE_KEY_PREFIX}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info(`Invalidated ${keys.length} exchange rate caches`);
      }
    }
  } catch (error) {
    logger.error('Failed to invalidate exchange rates cache', error);
  }
}

/**
 * Get all exchange rates for multiple currencies
 */
export async function getAllExchangeRates(): Promise<
  Record<Currency, ExchangeRates>
> {
  const rates: Partial<Record<Currency, ExchangeRates>> = {};

  // Fetch rates for USD as base (most commonly used)
  const usdRates = await getExchangeRates('USD');
  rates.USD = usdRates;

  return rates as Record<Currency, ExchangeRates>;
}

/**
 * Warm up the cache with exchange rates
 */
export async function warmUpExchangeRatesCache(): Promise<void> {
  logger.info('Warming up exchange rates cache...');
  
  try {
    // Fetch rates for the most common base currencies
    const baseCurrencies: Currency[] = ['USD', 'EUR', 'GBP', 'NGN'];
    
    await Promise.all(
      baseCurrencies.map((base) => getExchangeRates(base))
    );

    logger.info('Exchange rates cache warmed up successfully');
  } catch (error) {
    logger.error('Failed to warm up exchange rates cache', error);
  }
}
