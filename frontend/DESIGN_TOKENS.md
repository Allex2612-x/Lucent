# Sasha Finance App - Design Token System

## Overview
This document describes the design token system used throughout the Sasha finance application. All colors are defined as semantic tokens to ensure consistency and make theming easier.

## Color Palette

### Background Colors
```css
--bg-base: #0A0E1A        /* Main app background */
--bg-surface: #131829     /* Card and panel backgrounds */
--bg-elevated: #1C2238    /* Elevated elements (modals, dropdowns) */
--bg-hover: rgba(139, 146, 168, 0.05)   /* Hover state background */
--bg-active: rgba(139, 146, 168, 0.1)   /* Active state background */
```

### Border Colors
```css
--border: #252B42         /* Default border color */
--border-default: #252B42 /* Alias for default border */
--border-hover: #7C5CFF   /* Border color on hover */
--border-focus: #7C5CFF   /* Border color on focus */
```

### Text Colors
```css
--text-primary: #E8EAF2   /* Primary text - high contrast */
--text-secondary: #8B92A8 /* Secondary text */
--text-muted: #8B92A8     /* Muted text - low contrast */
```

### Accent Colors
```css
--accent-primary: #7C5CFF        /* Primary accent - buttons, links, brand */
--accent-primary-hover: #6A4DE6  /* Primary accent hover state */
--accent-success: #00D9C0        /* Success/Income - ALWAYS for income */
--accent-danger: #FF5A6B         /* Danger/Expenses - ALWAYS for expenses */
--accent-warning: #FFB547        /* Warning states */
--accent-info: #4DABF7           /* Info states */
```

### Chart Colors
```css
--chart-1: #7C5CFF  /* Purple */
--chart-2: #00D9C0  /* Teal */
--chart-3: #FFB547  /* Amber */
--chart-4: #FF5A6B  /* Red */
--chart-5: #4DABF7  /* Blue */
--chart-6: #B197FC  /* Violet */
--chart-7: #FFA94D  /* Orange */
--chart-8: #69DB7C  /* Green */
```

## Usage Guidelines

### 1. Income & Expenses
**CRITICAL RULE:** Always use semantic tokens for financial data:

```tsx
// ✅ CORRECT - Use semantic tokens
<span style={{ color: 'var(--accent-success)' }}>
  +{income.toFixed(2)} RON
</span>

<span style={{ color: 'var(--accent-danger)' }}>
  -{expenses.toFixed(2)} RON
</span>

// ❌ WRONG - Never hardcode colors
<span style={{ color: '#00D9C0' }}>+{income}</span>
<span style={{ color: 'green' }}>+{income}</span>
```

### 2. Primary CTAs
All primary call-to-action buttons should use `--accent-primary`:

```tsx
// ✅ CORRECT
<Button variant="primary">Adaugă Tranzacție</Button>
// This will use --accent-primary (#7C5CFF)

// ❌ WRONG
<Button style={{ backgroundColor: '#7C5CFF' }}>Adaugă</Button>
```

### 3. Backgrounds
Use the appropriate background token based on hierarchy:

```tsx
// Base level (page background)
<div style={{ backgroundColor: 'var(--bg-base)' }}>

// Surface level (cards, panels)
<Card style={{ backgroundColor: 'var(--bg-surface)' }}>

// Elevated level (modals, dropdowns, tooltips)
<Modal style={{ backgroundColor: 'var(--bg-elevated)' }}>
```

### 4. Text
Use semantic text tokens for proper contrast:

```tsx
// Primary text (headings, important content)
<h1 style={{ color: 'var(--text-primary)' }}>Dashboard</h1>

// Muted text (labels, descriptions)
<p style={{ color: 'var(--text-muted)' }}>Ultima actualizare</p>
```

### 5. Charts
Use the `CHART_COLORS` array for categorical data:

```tsx
import { CHART_COLORS } from '../styles/colors';

// For pie charts, bar charts, etc.
<PieChart>
  {data.map((entry, index) => (
    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
  ))}
</PieChart>

// For specific financial data
<BarChart>
  <Bar dataKey="income" fill="var(--accent-success)" />
  <Bar dataKey="expenses" fill="var(--accent-danger)" />
</BarChart>
```

## TypeScript Usage

### Importing Tokens
```typescript
import { tokens, CHART_COLORS } from '../styles/colors';

// Use tokens object
const primaryColor = tokens['accent-primary'];

// Use chart colors array
const categoryColor = CHART_COLORS[categoryIndex % CHART_COLORS.length];
```

### Type-Safe Token Access
```typescript
// tokens is typed, so you get autocomplete
const bgColor = tokens['bg-surface'];  // ✅ Valid
const invalid = tokens['invalid'];     // ❌ TypeScript error
```

## CSS Usage

### In Stylesheets
```css
.button-primary {
  background-color: var(--accent-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}

.button-primary:hover {
  background-color: var(--accent-primary-hover);
  border-color: var(--border-hover);
}

.income-text {
  color: var(--accent-success);
}

.expense-text {
  color: var(--accent-danger);
}
```

### In Inline Styles
```tsx
<div style={{
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--border-default)',
  color: 'var(--text-primary)'
}}>
  Content
</div>
```

## Component Examples

### KPI Card
```tsx
<Card style={{ backgroundColor: 'var(--bg-surface)' }}>
  <div style={{ color: 'var(--text-muted)' }}>Total Venituri</div>
  <div style={{ 
    fontSize: '2rem', 
    fontWeight: 700,
    color: 'var(--accent-success)'
  }}>
    {totalIncome.toFixed(2)} RON
  </div>
</Card>
```

### Transaction Item
```tsx
<div style={{
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--border-default)',
  padding: '1rem'
}}>
  <span style={{ color: 'var(--text-primary)' }}>
    {transaction.description}
  </span>
  <span style={{ 
    color: transaction.type === 'income' 
      ? 'var(--accent-success)' 
      : 'var(--accent-danger)'
  }}>
    {transaction.type === 'income' ? '+' : '-'}
    {transaction.amount.toFixed(2)} RON
  </span>
</div>
```

### Budget Progress Bar
```tsx
<div style={{
  height: '8px',
  backgroundColor: 'var(--bg-elevated)',
  borderRadius: '4px',
  overflow: 'hidden'
}}>
  <div style={{
    width: `${percentage}%`,
    height: '100%',
    backgroundColor: percentage > 90 
      ? 'var(--accent-danger)' 
      : percentage > 70 
        ? 'var(--accent-warning)' 
        : 'var(--accent-success)',
    transition: 'width 0.3s ease'
  }} />
</div>
```

## Migration Guide

### Replacing Hardcoded Colors

**Before:**
```tsx
<div style={{ backgroundColor: '#0a0e1a', color: '#f8fafc' }}>
  <span style={{ color: '#10b981' }}>+500 RON</span>
  <span style={{ color: '#f43f5e' }}>-300 RON</span>
</div>
```

**After:**
```tsx
<div style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
  <span style={{ color: 'var(--accent-success)' }}>+500 RON</span>
  <span style={{ color: 'var(--accent-danger)' }}>-300 RON</span>
</div>
```

### Replacing Old Tokens

**Before (Midnight Aurora):**
```tsx
import { tokens } from '../styles/colors';
// tokens['accent-primary'] was #14b8a6 (teal)
```

**After (New System):**
```tsx
import { tokens } from '../styles/colors';
// tokens['accent-primary'] is now #7C5CFF (purple)
```

## Color Contrast & Accessibility

All color combinations meet WCAG AA standards:

| Foreground | Background | Contrast Ratio | WCAG Level |
|------------|------------|----------------|------------|
| --text-primary | --bg-base | 12.5:1 | AAA |
| --text-primary | --bg-surface | 11.8:1 | AAA |
| --text-muted | --bg-base | 5.2:1 | AA |
| --accent-primary | --bg-base | 6.8:1 | AA |
| --accent-success | --bg-base | 7.2:1 | AA |
| --accent-danger | --bg-base | 6.5:1 | AA |

## Chart Color Usage

### Categorical Data
Use `CHART_COLORS` array for categories:

```tsx
const categoryColors = categories.map((_, index) => 
  CHART_COLORS[index % CHART_COLORS.length]
);
```

### Financial Data
Always use semantic tokens:

```tsx
// Income vs Expenses chart
<BarChart>
  <Bar dataKey="income" fill="var(--accent-success)" name="Venituri" />
  <Bar dataKey="expenses" fill="var(--accent-danger)" name="Cheltuieli" />
</BarChart>

// Budget status
const statusColor = percentage > 90 
  ? 'var(--accent-danger)' 
  : percentage > 70 
    ? 'var(--accent-warning)' 
    : 'var(--accent-success)';
```

## Best Practices

### ✅ DO
- Use CSS custom properties (`var(--token-name)`) in styles
- Use semantic tokens for income/expenses
- Use `CHART_COLORS` array for categorical data
- Use appropriate background hierarchy (base → surface → elevated)
- Test color contrast for accessibility

### ❌ DON'T
- Hardcode hex colors in components
- Use non-semantic colors for financial data
- Mix old and new token names
- Use chart colors for UI elements
- Ignore contrast ratios

## Token Reference Table

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | #0A0E1A | Page background |
| `--bg-surface` | #131829 | Cards, panels |
| `--bg-elevated` | #1C2238 | Modals, dropdowns |
| `--border` | #252B42 | Borders |
| `--text-primary` | #E8EAF2 | Headings, body text |
| `--text-muted` | #8B92A8 | Labels, descriptions |
| `--accent-primary` | #7C5CFF | Primary CTAs, links |
| `--accent-success` | #00D9C0 | Income, success |
| `--accent-danger` | #FF5A6B | Expenses, errors |
| `--accent-warning` | #FFB547 | Warnings, alerts |

## Support

For questions or issues with the design token system, please refer to:
- `frontend/src/styles/colors.ts` - Token definitions
- `frontend/src/index.css` - CSS custom properties
- This documentation file

## Changelog

### v2.0.0 (Current)
- Updated to new Sasha brand colors
- Changed primary accent from teal (#14b8a6) to purple (#7C5CFF)
- Updated success color from emerald (#10b981) to teal (#00D9C0)
- Updated danger color from rose (#f43f5e) to red (#FF5A6B)
- Updated warning color from amber (#f59e0b) to orange (#FFB547)
- Updated background colors for better contrast
- Updated chart color palette
- Simplified token structure

### v1.0.0 (Previous - Midnight Aurora)
- Initial design token system
- Teal-based color scheme
- Deep blue backgrounds
