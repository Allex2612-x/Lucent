/**
 * Sasha Finance App - Design Token System
 * Semantic color tokens for consistent theming across the application
 * 
 * Midnight Aurora — Electric Blue Edition
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
    strong: '#2F3656',    // Strong border color
  },
  
  // Text colors
  text: {
    primary: '#E8EAF2',   // Primary text - high contrast
    secondary: '#B4BAC9', // Secondary text
    muted: '#8B92A8',     // Muted text - low contrast
    disabled: '#5A6178',  // Disabled text
  },
  
  // Accent colors
  accent: {
    primary: '#3B82F6',   // Primary accent - buttons, links, brand (Electric Blue)
    success: '#00D9C0',   // Success/Income - always for income
    danger: '#FF5A6B',    // Danger/Expenses - always for expenses
    warning: '#FFB547',   // Warning states
    info: '#4DABF7',      // Info states
  },
  
  // Chart colors - harmonious palette for data visualization
  chart: {
    blue: '#3B82F6',      // Primary blue (replaces purple)
    teal: '#00D9C0',
    amber: '#FFB547',
    red: '#FF5A6B',
    violet: '#A855F7',
    cyan: '#22D3EE',
    orange: '#FB923C',
    emerald: '#34D399',
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
  'border-strong': colors.border.strong,
  'border-hover': colors.accent.primary,
  'border-focus': colors.accent.primary,
  
  // Text
  'text-primary': colors.text.primary,
  'text-secondary': colors.text.secondary,
  'text-muted': colors.text.muted,
  'text-disabled': colors.text.disabled,
  
  // Accents
  'accent-primary': colors.accent.primary,
  'accent-primary-hover': '#2563EB',
  'accent-primary-active': '#1D4ED8',
  'accent-primary-soft': 'rgba(59, 130, 246, 0.15)',
  'accent-success': colors.accent.success,
  'accent-success-soft': 'rgba(0, 217, 192, 0.15)',
  'accent-danger': colors.accent.danger,
  'accent-danger-soft': 'rgba(255, 90, 107, 0.15)',
  'accent-warning': colors.accent.warning,
  'accent-warning-soft': 'rgba(255, 181, 71, 0.15)',
  'accent-info': colors.accent.info,
  
  // Chart colors - harmonious palette for data visualization
  'chart-1': colors.chart.blue,
  'chart-2': colors.chart.teal,
  'chart-3': colors.chart.amber,
  'chart-4': colors.chart.red,
  'chart-5': colors.chart.violet,
  'chart-6': colors.chart.cyan,
  'chart-7': colors.chart.orange,
  'chart-8': colors.chart.emerald,
} as const;

/**
 * Chart color palette for data visualization
 * Use this array for categorical data (pie charts, bar charts, etc.)
 * 
 * Order: Blue, Teal, Amber, Red, Violet, Cyan, Orange, Emerald
 */
export const CHART_COLORS = [
  '#3B82F6', // Blue (primary)
  '#00D9C0', // Teal
  '#FFB547', // Amber
  '#FF5A6B', // Red
  '#A855F7', // Violet
  '#22D3EE', // Cyan
  '#FB923C', // Orange
  '#34D399', // Emerald
] as const;

/**
 * Semantic colors for financial data
 * ALWAYS use these for income/expense visualization
 */
export const SEMANTIC_COLORS = {
  income: '#00D9C0',
  expense: '#FF5A6B',
  neutral: '#3B82F6',
  warning: '#FFB547',
} as const;

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
