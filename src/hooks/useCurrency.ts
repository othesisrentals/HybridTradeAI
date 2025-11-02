/**
 * Currency Hook
 * Provides currency conversion and formatting utilities
 */

'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  type Currency,
  defaultCurrency,
  supportedCurrencies,
} from '@/lib/currency/config';
import { formatCurrency } from '@/lib/currency/service';
import type { ExchangeRates } from '@/lib/currency/service';

export function useCurrency() {
  const [preferredCurrency, setPreferredCurrency] =
    useState<Currency>(defaultCurrency);

  // Load preferred currency from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('preferredCurrency');
    if (saved && supportedCurrencies.includes(saved as Currency)) {
      setPreferredCurrency(saved as Currency);
    }
  }, []);

  // Fetch exchange rates
  const { data: exchangeRates, isLoading } = useQuery<ExchangeRates>({
    queryKey: ['exchangeRates', preferredCurrency],
    queryFn: async () => {
      const response = await fetch(
        `/api/currency/rates?base=${preferredCurrency}`
      );
      const result = await response.json();
      return result.data;
    },
    staleTime: 3600000, // 1 hour
    gcTime: 3600000, // 1 hour (formerly cacheTime)
  });

  /**
   * Convert amount from USD to preferred currency
   */
  const convertFromUSD = (amountUSD: number): number => {
    if (preferredCurrency === 'USD' || !exchangeRates) {
      return amountUSD;
    }

    const rate = exchangeRates.rates[preferredCurrency];
    return rate ? amountUSD * rate : amountUSD;
  };

  /**
   * Convert amount to USD from preferred currency
   */
  const convertToUSD = (amount: number): number => {
    if (preferredCurrency === 'USD' || !exchangeRates) {
      return amount;
    }

    const rate = exchangeRates.rates[preferredCurrency];
    return rate ? amount / rate : amount;
  };

  /**
   * Format amount in preferred currency
   */
  const format = (amountUSD: number, locale?: string): string => {
    const converted = convertFromUSD(amountUSD);
    return formatCurrency(converted, preferredCurrency, locale);
  };

  /**
   * Change preferred currency
   */
  const changeCurrency = (newCurrency: Currency) => {
    setPreferredCurrency(newCurrency);
    localStorage.setItem('preferredCurrency', newCurrency);
  };

  return {
    currency: preferredCurrency,
    exchangeRates,
    isLoading,
    convertFromUSD,
    convertToUSD,
    format,
    changeCurrency,
  };
}
