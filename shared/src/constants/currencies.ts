export const SUPPORTED_CURRENCIES = [
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
] as const;

export type SupportedCurrencyCode = typeof SUPPORTED_CURRENCIES[number]['code'];
