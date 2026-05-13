/**
 * Sasha Finance App - Design Token System (light, modern fintech)
 * Mirrors the CSS custom properties declared in index.css.
 */

export const colors = {
  background: {
    base: '#f7f5f0',
    surface: '#ffffff',
    elevated: '#ffffff',
    subtle: '#faf9f5',
    inset: '#f2efe8',
    canvas: '#efede7',
  },

  border: {
    default: '#e7e3d9',
    strong: '#d8d3c5',
  },

  text: {
    primary: '#0e0e10',
    secondary: '#56544c',
    muted: '#8c8879',
    inverse: '#ffffff',
  },

  accent: {
    primary: '#2547f5',
    primaryInk: '#1a32b5',
    primarySoft: '#e8ecff',
    success: '#0ab39c',
    successSoft: '#defaf3',
    danger: '#f5556e',
    dangerSoft: '#fde4e7',
    warning: '#e89b1c',
    warningSoft: '#fbecd0',
  },

  chart: {
    cobalt: '#2547f5',
    teal: '#0ab39c',
    coral: '#f5556e',
    amber: '#e89b1c',
    violet: '#8b5cf6',
    cyan: '#06b6d4',
    pink: '#ec4899',
    orange: '#f97316',
  },
} as const;

export const tokens = {
  'bg-base': colors.background.base,
  'bg-surface': colors.background.surface,
  'bg-elevated': colors.background.surface,
  'bg-subtle': colors.background.subtle,
  'bg-inset': colors.background.inset,
  'bg-canvas': colors.background.canvas,
  'bg-hover': colors.background.subtle,
  'bg-active': colors.background.inset,

  'border-default': colors.border.default,
  'border-strong': colors.border.strong,
  'border-hover': colors.border.strong,
  'border-focus': colors.accent.primary,

  'text-primary': colors.text.primary,
  'text-secondary': colors.text.secondary,
  'text-muted': colors.text.muted,
  'text-inverse': colors.text.inverse,

  'accent-primary': colors.accent.primary,
  'accent-primary-hover': colors.accent.primaryInk,
  'accent-primary-soft': colors.accent.primarySoft,
  'accent-success': colors.accent.success,
  'accent-success-soft': colors.accent.successSoft,
  'accent-danger': colors.accent.danger,
  'accent-danger-soft': colors.accent.dangerSoft,
  'accent-warning': colors.accent.warning,
  'accent-warning-soft': colors.accent.warningSoft,
  'accent-info': '#4dabf7',

  'chart-1': colors.chart.cobalt,
  'chart-2': colors.chart.teal,
  'chart-3': colors.chart.coral,
  'chart-4': colors.chart.amber,
  'chart-5': colors.chart.violet,
  'chart-6': colors.chart.cyan,
  'chart-7': colors.chart.pink,
  'chart-8': colors.chart.orange,
} as const;

/**
 * Categorical palette for charts. Cobalt / teal / coral / amber lead.
 */
export const CHART_COLORS = [
  '#2547f5', // cobalt
  '#0ab39c', // teal
  '#f5556e', // coral
  '#e89b1c', // amber
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#f97316', // orange
] as const;

export function getToken(token: keyof typeof tokens): string {
  return tokens[token];
}
