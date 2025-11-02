/**
 * Currency conversion hook
 * Provides currency conversion and formatting utilities
 */

import { useState, useEffect, useCallback } from 'react';
import { convertCurrency, formatCurrencyAmount, getExchangeRate } from '@/lib/currency/fixer';
import { DEFAULT_CURRENCY } from '@/config/constants';

export interface UseCurrencyOptions {
  defaultCurrency?: string;
  autoFetch?: boolean;
}

export function useCurrency(options: UseCurrencyOptions = {}) {
  const [currency, setCurrency] = useState<string>(
    options.defaultCurrency || DEFAULT_CURRENCY
  );
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch exchange rate when currency changes
  useEffect(() => {
    if (options.autoFetch !== false && currency !== DEFAULT_CURRENCY) {
      setLoading(true);
      getExchangeRate(DEFAULT_CURRENCY, currency)
        .then((rate) => {
          setExchangeRate(rate);
          setError(null);
        })
        .catch((err) => {
          setError(err);
          console.error('Failed to fetch exchange rate:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setExchangeRate(1);
    }
  }, [currency, options.autoFetch]);

  const convert = useCallback(
    async (amount: number, fromCurrency: string, toCurrency: string) => {
      try {
        setLoading(true);
        const result = await convertCurrency(amount, fromCurrency, toCurrency);
        return result.convertedAmount;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const format = useCallback(
    (amount: number, currencyCode?: string, locale?: string) => {
      return formatCurrencyAmount(amount, currencyCode || currency, locale);
    },
    [currency]
  );

  return {
    currency,
    setCurrency,
    exchangeRate,
    convert,
    format,
    loading,
    error,
  };
}
