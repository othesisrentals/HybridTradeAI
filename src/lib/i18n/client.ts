/**
 * Client-side i18n utilities
 */
'use client';

import { useTranslations as useNextIntlTranslations } from 'next-intl';

export function useTranslations(namespace?: string) {
  return useNextIntlTranslations(namespace);
}

export { useLocale, useMessages } from 'next-intl';
