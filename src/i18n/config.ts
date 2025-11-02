export const locales = ['en', 'fr', 'es', 'ar', 'zh', 'hi', 'yo', 'ha'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  fr: 'Fran?ais',
  es: 'Espa?ol',
  ar: '???????',
  zh: '??',
  hi: '??????',
  yo: 'Yor?b?',
  ha: 'Hausa',
};

export const localeFlags: Record<Locale, string> = {
  en: '????',
  fr: '????',
  es: '????',
  ar: '????',
  zh: '????',
  hi: '????',
  yo: '????',
  ha: '????',
};
