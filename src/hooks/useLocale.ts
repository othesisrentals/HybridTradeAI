/**
 * Locale/i18n hook
 * Provides language switching and translation utilities
 */

import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_LANGUAGE, LANGUAGES } from '@/config/constants';
import type { Locale } from '@/i18n/config';

// Simple client-side translation function
// In a real app, you'd use next-intl's useTranslations hook
export function useLocale() {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LANGUAGE);
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  // Load translations when locale changes
  useEffect(() => {
    const loadTranslations = async () => {
      setLoading(true);
      try {
        const messages = await import(`../../messages/${locale}.json`);
        setTranslations(messages.default);
      } catch (error) {
        console.error(`Failed to load translations for ${locale}:`, error);
        // Fallback to English
        const messages = await import(`../../messages/${DEFAULT_LANGUAGE}.json`);
        setTranslations(messages.default);
      } finally {
        setLoading(false);
      }
    };

    loadTranslations();
  }, [locale]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const keys = key.split('.');
      let value: any = translations;

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return key; // Return key if translation not found
        }
      }

      // Replace parameters
      if (params && typeof value === 'string') {
        return Object.entries(params).reduce(
          (str, [paramKey, paramValue]) =>
            str.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue)),
          value
        );
      }

      return typeof value === 'string' ? value : key;
    },
    [translations]
  );

  const changeLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
  }, []);

  // Load locale from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLocale = localStorage.getItem('locale') as Locale | null;
      if (storedLocale && Object.keys(LANGUAGES).includes(storedLocale)) {
        setLocale(storedLocale);
      }
    }
  }, []);

  return {
    locale,
    setLocale: changeLocale,
    t,
    loading,
    languages: LANGUAGES,
  };
}
