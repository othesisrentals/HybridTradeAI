/**
 * i18n Configuration
 * Supports: EN, FR, ES, AR, ZH, HI, YO, HA
 * 
 * Note: For Next.js App Router, you can use next-intl with [locale] routing
 * or use the simpler client-side approach with useLocale hook
 */

export const locales = ['en', 'fr', 'es', 'ar', 'zh', 'hi', 'yo', 'ha'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

// For App Router with next-intl, you would need to:
// 1. Restructure app directory to use [locale] segments
// 2. Use createLocalizedPathnamesNavigation
// 
// For now, we use a simpler client-side approach with useLocale hook
// This can be migrated to full next-intl setup if needed
