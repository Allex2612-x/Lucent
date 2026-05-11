/**
 * Sasha Finance App - Design Token System
 * Semantic color tokens for consistent theming across the application
 */

export const colors = {
  // Base backgrounds
  background: {
    base: '#0A0E1A',      // Main app background
    surface: '#131829',   // Card and panel backgrounds
    elevated: '#1C2238',  // Elevated elements (modals, dropdowns)
  },
  
  // Borders
  border: {
    default: '#252B42',   // Default border color
  },
  
  // Text colors
  text: {
    primary: '#E8EAF2',   // Primary text - high contrast
    muted: '#8B92A8',     // Muted text - low contrast
  },
  
  // Accent colors
  accent: {
    primary: '#7C5CFF',   // Primary accent - buttons, links, brand
    success: '#00D9C0',   // Success/Income - always for income
    danger: '#FF5A6B',    // Danger/Expenses - always for expenses
    warning: '#FFB547',   // Warning states
  },
  
  // Chart colors - harmonious palette for data visualization
  chart: {
    purple: '#7C5CFF',
    teal: '#00D9C0',
    amber: '#FFB547',
    red: '#FF5A6B',
    blue: '#4DABF7',
    violet: '#B197FC',
    orange: '#FFA94D',
    green: '#69DB7C',
  },
} as const;

/**
 * Semantic color tokens for consistent usage across the app
 * These tokens map to CSS custom properties and should be used throughout the application
 */
export const tokens = {
  // Backgrounds
  'bg-base': colors.background.base,
  'bg-surface': colors.background.surface,
  'bg-elevated': colors.background.elevated,
  'bg-hover': 'rgba(139, 146, 168, 0.05)',
  'bg-active': 'rgba(139, 146, 168, 0.1)',
  
  // Borders
  'border-default': colors.border.default,
  'border-hover': colors.accent.primary,
  'border-focus': colors.accent.primary,
  
  // Text
  'text-primary': colors.text.primary,
  'text-secondary': colors.text.muted,
  'text-muted': colors.text.muted,
  
  // Accents
  'accent-primary': colors.accent.primary,
  'accent-primary-hover': '#6A4DE6',
  'accent-success': colors.accent.success,
  'accent-danger': colors.accent.danger,
  'accent-warning': colors.accent.warning,
  'accent-info': colors.chart.blue,
  
  // Chart colors - harmonious palette for data visualization
  'chart-1': colors.chart.purple,
  'chart-2': colors.chart.teal,
  'chart-3': colors.chart.amber,
  'chart-4': colors.chart.red,
  'chart-5': colors.chart.blue,
  'chart-6': colors.chart.violet,
  'chart-7': colors.chart.orange,
  'chart-8': colors.chart.green,
} as const;

/**
 * Chart color palette for data visualization
 * Use this array for categorical data (pie charts, bar charts, etc.)
 * 
 * Order: Purple, Teal, Amber, Red, Blue, Violet, Orange, Green
 */
export const CHART_COLORS = [
  '#7C5CFF', // Purple
  '#00D9C0', // Teal
  '#FFB547', // Amber
  '#FF5A6B', // Red
  '#4DABF7', // Blue
  '#B197FC', // Violet
  '#FFA94D', // Orange
  '#69DB7C', // Green
] as const;

/**
 * Generate CSS custom properties for use in stylesheets
 */
export function generateCSSVariables(): string {
  return Object.entries(tokens)
    .map(([key, value]) => `  --${key}: ${value};`)
    .join('\n');
}

/**
 * Helper function to get token value
 */
export function getToken(token: keyof typeof tokens): string {
  return tokens[token];
}
