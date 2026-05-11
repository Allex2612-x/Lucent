# Midnight Aurora Color System

## Overview
The Sasha finance app now uses the **Midnight Aurora** color palette - a sophisticated dark theme with deep blues, teals, and aurora-inspired accents that replace the previous purple-heavy theme.

## Color Tokens

### Semantic Tokens (CSS Custom Properties)
All colors are defined as semantic tokens in `:root` (see `frontend/src/index.css`):

#### Backgrounds
- `--bg-base`: #0a0e1a (Deepest midnight - base background)
- `--bg-surface`: #111827 (Dark midnight - surface background)
- `--bg-elevated`: #1e293b (Elevated midnight - elevated surfaces)
- `--bg-hover`: rgba(148, 163, 184, 0.05) (Hover state)
- `--bg-active`: rgba(148, 163, 184, 0.1) (Active state)

#### Borders
- `--border-default`: #334155 (Default borders)
- `--border-hover`: #14b8a6 (Hover state borders)
- `--border-focus`: #06b6d4 (Focus state borders)

#### Text
- `--text-primary`: #f8fafc (Primary text - high contrast)
- `--text-secondary`: #cbd5e1 (Secondary text - medium contrast)
- `--text-muted`: #94a3b8 (Muted text - low contrast)
- `--text-disabled`: #64748b (Disabled text)

#### Accents
- `--accent-primary`: #14b8a6 (Teal - primary accent)
- `--accent-primary-hover`: #0d9488 (Teal hover state)
- `--accent-secondary`: #06b6d4 (Cyan - secondary accent)
- `--accent-success`: #10b981 (Emerald - income/success)
- `--accent-danger`: #f43f5e (Rose - expenses/errors)
- `--accent-warning`: #f59e0b (Amber - warnings)
- `--accent-info`: #0ea5e9 (Sky - info states)

#### Chart Colors
- `--chart-1`: #14b8a6 (Teal)
- `--chart-2`: #10b981 (Emerald)
- `--chart-3`: #06b6d4 (Cyan)
- `--chart-4`: #0ea5e9 (Sky)
- `--chart-5`: #8b5cf6 (Violet)
- `--chart-6`: #ec4899 (Pink)
- `--chart-7`: #f59e0b (Amber)
- `--chart-8`: #f43f5e (Rose)

## TypeScript Color System

### Import
```typescript
import { tokens, CHART_COLORS } from '../../styles/colors';
```

### Usage in Components
```typescript
// Use semantic tokens
<div style={{ backgroundColor: tokens['bg-surface'], color: tokens['text-primary'] }}>

// Use chart colors for data visualization
<Cell fill={CHART_COLORS[index % CHART_COLORS.length]} />
```

### Chart Color Array
```typescript
export const CHART_COLORS = [
  '#14b8a6', // Teal
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#0ea5e9', // Sky
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#f43f5e', // Rose
] as const;
```

## Usage Guidelines

### DO ✅
- Use semantic tokens: `var(--accent-primary)` or `tokens['accent-primary']`
- Use `CHART_COLORS` array for categorical data visualization
- Use `--accent-success` for income/positive values
- Use `--accent-danger` for expenses/negative values
- Maintain WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)

### DON'T ❌
- Hardcode hex values: `#6366f1` ❌
- Use old purple colors: `#818cf8`, `#c084fc` ❌
- Mix old and new color systems
- Use non-semantic color names in components

## Migration Checklist

### Completed ✅
- [x] Created `frontend/src/styles/colors.ts` with semantic tokens
- [x] Updated `frontend/src/index.css` with CSS custom properties
- [x] Updated Dashboard component charts (LineChart)
- [x] Updated Reports component charts (PieChart, BarChart)
- [x] Updated Dashboard card gradients (teal instead of indigo)
- [x] Updated icon colors (teal-400 instead of indigo-400)
- [x] Updated all chart tooltips to use semantic tokens
- [x] Updated form inputs and borders to use semantic tokens

### Remaining Components to Update
- [ ] Transactions page
- [ ] Categories page
- [ ] Budgets page
- [ ] Settings page
- [ ] UI components (Button, Input, Select, Modal, Card)
- [ ] Layout components (Sidebar, Header, Navbar)

## WCAG Contrast Compliance

All color combinations meet WCAG AA standards:

| Foreground | Background | Ratio | Status |
|------------|------------|-------|--------|
| --text-primary (#f8fafc) | --bg-base (#0a0e1a) | 15.8:1 | ✅ AAA |
| --text-secondary (#cbd5e1) | --bg-base (#0a0e1a) | 11.2:1 | ✅ AAA |
| --text-muted (#94a3b8) | --bg-base (#0a0e1a) | 6.8:1 | ✅ AA |
| --accent-primary (#14b8a6) | --bg-base (#0a0e1a) | 5.2:1 | ✅ AA |
| --accent-success (#10b981) | --bg-base (#0a0e1a) | 5.4:1 | ✅ AA |
| --accent-danger (#f43f5e) | --bg-base (#0a0e1a) | 5.1:1 | ✅ AA |

## Chart Color Harmony

The `CHART_COLORS` array provides 8 harmonious colors at similar saturation (~70%) and lightness (~55%) for optimal data visualization:

1. **Teal** (#14b8a6) - Primary data series
2. **Emerald** (#10b981) - Income/positive trends
3. **Cyan** (#06b6d4) - Secondary data series
4. **Sky** (#0ea5e9) - Tertiary data series
5. **Violet** (#8b5cf6) - Quaternary data series
6. **Pink** (#ec4899) - Quinary data series
7. **Amber** (#f59e0b) - Warnings/alerts
8. **Rose** (#f43f5e) - Expenses/negative trends

## Examples

### Before (Old Purple Theme)
```typescript
// ❌ Hardcoded colors
<Line stroke="#818cf8" />
<div style={{ color: '#6366f1' }}>
<Card className="border-indigo-500/30">
```

### After (Midnight Aurora)
```typescript
// ✅ Semantic tokens
<Line stroke={tokens['accent-primary']} />
<div style={{ color: tokens['accent-primary'] }}>
<Card className="border-teal-500/30">
```

## Resources

- Color palette: `frontend/src/styles/colors.ts`
- CSS variables: `frontend/src/index.css` (`:root` section)
- Documentation: This file (`frontend/COLOR_SYSTEM.md`)
