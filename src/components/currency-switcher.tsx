'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  supportedCurrencies,
  currencySymbols,
  currencyNames,
  type Currency,
  defaultCurrency,
} from '@/lib/currency/config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function CurrencySwitcher() {
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const router = useRouter();

  // Load currency from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('preferredCurrency');
    if (saved && supportedCurrencies.includes(saved as Currency)) {
      setCurrency(saved as Currency);
    }
  }, []);

  const handleCurrencyChange = (newCurrency: string) => {
    const curr = newCurrency as Currency;
    setCurrency(curr);
    
    // Save to localStorage
    localStorage.setItem('preferredCurrency', curr);
    
    // Trigger a page refresh to update all currency displays
    router.refresh();
  };

  return (
    <Select value={currency} onValueChange={handleCurrencyChange}>
      <SelectTrigger className="w-[160px]">
        <SelectValue>
          <span className="flex items-center gap-2">
            <span>{currencySymbols[currency]}</span>
            <span>{currency}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {supportedCurrencies.map((curr) => (
          <SelectItem key={curr} value={curr}>
            <span className="flex items-center gap-2">
              <span className="font-semibold">{currencySymbols[curr]}</span>
              <span className="text-sm">{curr}</span>
              <span className="text-xs text-muted-foreground">
                {currencyNames[curr]}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
