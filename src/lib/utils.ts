import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number | string,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  // Handle Arabic locale for RTL support
  const formatLocale = locale === 'ar' ? 'ar-SA' : locale
  
  try {
    return new Intl.NumberFormat(formatLocale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount)
  } catch (error) {
    // Fallback formatting
    const symbol = getCurrencySymbol(currency)
    return `${symbol}${numAmount.toFixed(2)}`
  }
}

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
  }
  return symbols[currency] || currency
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj)
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj)
}

export function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

export function calculateROI(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
