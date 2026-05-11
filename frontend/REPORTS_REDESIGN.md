# Reports Page - Comprehensive Redesign Specification

## Overview
Complete redesign of the Reports (Rapoarte) page with KPI cards, improved charts, better date controls, and enhanced data visualization.

## 🎯 Key Improvements

### 1. KPI Cards at Top

**4 KPI Cards Layout:**
```tsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '1rem',
  marginBottom: '2rem'
}}>
  {/* Total Venituri */}
  <Card style={{ padding: '1.5rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        backgroundColor: `${tokens['accent-success']}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <TrendingUp size={24} style={{ color: tokens['accent-success'] }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.875rem', color: tokens['text-muted'], marginBottom: '0.25rem' }}>
          Total Venituri
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: tokens['accent-success'] }}>
          {totalIncome.toFixed(2)} RON
        </div>
        {previousIncome && (
          <div style={{ fontSize: '0.75rem', color: tokens['text-muted'], marginTop: '0.25rem' }}>
            {incomeDelta > 0 ? '↑' : '↓'} {Math.abs(incomeDelta).toFixed(1)}% vs perioada anterioară
          </div>
        )}
      </div>
    </div>
  </Card>

  {/* Total Cheltuieli */}
  <Card style={{ padding: '1.5rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        backgroundColor: `${tokens['accent-danger']}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <TrendingDown size={24} style={{ color: tokens['accent-danger'] }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.875rem', color: tokens['text-muted'], marginBottom: '0.25rem' }}>
          Total Cheltuieli
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: tokens['accent-danger'] }}>
          {totalExpenses.toFixed(2)} RON
        </div>
        {previousExpenses && (
          <div style={{ fontSize: '0.75rem', color: tokens['text-muted'], marginTop: '0.25rem' }}>
            {expensesDelta > 0 ? '↑' : '↓'} {Math.abs(expensesDelta).toFixed(1)}% vs perioada anterioară
          </div>
        )}
      </div>
    </div>
  </Card>

  {/* Sold Net */}
  <Card style={{ padding: '1.5rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        backgroundColor: `${netBalance >= 0 ? tokens['accent-primary'] : tokens['accent-danger']}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Wallet size={24} style={{ 
          color: netBalance >= 0 ? tokens['accent-primary'] : tokens['accent-danger'] 
        }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.875rem', color: tokens['text-muted'], marginBottom: '0.25rem' }}>
          Sold Net
        </div>
        <div style={{ 
          fontSize: '1.75rem', 
          fontWeight: 700, 
          color: netBalance >= 0 ? tokens['accent-primary'] : tokens['accent-danger']
        }}>
          {netBalance >= 0 ? '+' : ''}{netBalance.toFixed(2)} RON
        </div>
        {previousNetBalance !== null && (
          <div style={{ fontSize: '0.75rem', color: tokens['text-muted'], marginTop: '0.25rem' }}>
            {netDelta > 0 ? '↑' : '↓'} {Math.abs(netDelta).toFixed(1)}% vs perioada anterioară
          </div>
        )}
      </div>
    </div>
  </Card>

  {/* Rată Economisire */}
  <Card style={{ padding: '1.5rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        backgroundColor: `${tokens['accent-info']}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <PiggyBank size={24} style={{ color: tokens['accent-info'] }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.875rem', color: tokens['text-muted'], marginBottom: '0.25rem' }}>
          Rată Economisire
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: tokens['accent-info'] }}>
          {savingsRate.toFixed(1)}%
        </div>
        {previousSavingsRate !== null && (
          <div style={{ fontSize: '0.75rem', color: tokens['text-muted'], marginTop: '0.25rem' }}>
            {savingsRateDelta > 0 ? '↑' : '↓'} {Math.abs(savingsRateDelta).toFixed(1)}pp vs perioada anterioară
          </div>
        )}
      </div>
    </div>
  </Card>
</div>

// Calculations
const totalIncome = data.reduce((sum, item) => sum + item.income, 0);
const totalExpenses = data.reduce((sum, item) => sum + item.expenses, 0);
const netBalance = totalIncome - totalExpenses;
const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

// Previous period comparison
const incomeDelta = previousIncome ? ((totalIncome - previousIncome) / previousIncome) * 100 : 0;
const expensesDelta = previousExpenses ? ((totalExpenses - previousExpenses) / previousExpenses) * 100 : 0;
const netDelta = previousNetBalance ? ((netBalance - previousNetBalance) / Math.abs(previousNetBalance)) * 100 : 0;
const savingsRateDelta = previousSavingsRate !== null ? savingsRate - previousSavingsRate : 0;
```

### 2. Compact Date Range Toolbar

**Toolbar with Presets:**
```tsx
<div style={{
  display: 'flex',
  gap: '1rem',
  alignItems: 'center',
  padding: '1rem 1.5rem',
  backgroundColor: tokens['bg-elevated'],
  borderRadius: '0.75rem',
  marginBottom: '2rem',
  flexWrap: 'wrap'
}}>
  {/* Quick Presets */}
  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
    <Button
      variant={datePreset === 'current-month' ? 'primary' : 'secondary'}
      onClick={() => handlePresetChange('current-month')}
      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
    >
      Luna curentă
    </Button>
    <Button
      variant={datePreset === 'last-3-months' ? 'primary' : 'secondary'}
      onClick={() => handlePresetChange('last-3-months')}
      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
    >
      Ultimele 3 luni
    </Button>
    <Button
      variant={datePreset === 'current-year' ? 'primary' : 'secondary'}
      onClick={() => handlePresetChange('current-year')}
      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
    >
      Anul curent
    </Button>
    <Button
      variant={datePreset === 'custom' ? 'primary' : 'secondary'}
      onClick={() => handlePresetChange('custom')}
      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
    >
      Custom
    </Button>
  </div>

  {/* Custom Date Inputs */}
  {datePreset === 'custom' && (
    <>
      <div style={{ width: '1px', height: '32px', backgroundColor: tokens['border-default'] }} />
      <Input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        style={{ width: '160px', marginBottom: 0 }}
      />
      <span style={{ color: tokens['text-muted'] }}>până la</span>
      <Input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        style={{ width: '160px', marginBottom: 0 }}
      />
    </>
  )}
</div>

// Preset handlers
const handlePresetChange = (preset: DatePreset) => {
  setDatePreset(preset);
  const now = new Date();
  
  switch (preset) {
    case 'current-month':
      setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
      setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
      break;
    
    case 'last-3-months':
      setStartDate(new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0]);
      setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
      break;
    
    case 'current-year':
      setStartDate(new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]);
      setEndDate(new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]);
      break;
    
    case 'custom':
      // Keep current dates
      break;
  }
};
```

### 3. Horizontal Bar Chart (Replace Pie Chart)

**Horizontal Bar Chart for Categories:**
```tsx
<Card style={{ padding: '1.5rem' }}>
  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>
    Distribuție Cheltuieli pe Categorii
  </h3>
  
  {categoryData.length === 0 ? (
    <p style={{ textAlign: 'center', color: tokens['text-muted'], padding: '2rem' }}>
      Nu există date pentru perioada selectată
    </p>
  ) : (
    <ResponsiveContainer width="100%" height={categoryData.length * 60 + 40}>
      <BarChart
        data={sortedCategoryData}
        layout="vertical"
        margin={{ top: 5, right: 80, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={tokens['border-default']} />
        <XAxis type="number" stroke={tokens['text-muted']} />
        <YAxis 
          type="category" 
          dataKey="name" 
          stroke={tokens['text-muted']}
          width={150}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: tokens['bg-elevated'],
            border: `1px solid ${tokens['border-default']}`,
            borderRadius: '0.5rem',
            color: tokens['text-primary']
          }}
          formatter={(value: number) => [`${value.toFixed(2)} RON`, 'Sumă']}
          labelFormatter={(label) => `Categorie: ${label}`}
        />
        <Bar 
          dataKey="amount" 
          radius={[0, 8, 8, 0]}
          label={{
            position: 'right',
            formatter: (value: number, entry: any) => 
              `${value.toFixed(2)} RON (${entry.percentage.toFixed(1)}%)`,
            fill: tokens['text-primary'],
            fontSize: 12
          }}
        >
          {sortedCategoryData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )}
</Card>

// Data preparation
const sortedCategoryData = useMemo(() => {
  const total = categoryData.reduce((sum, item) => sum + item.amount, 0);
  return categoryData
    .map(item => ({
      ...item,
      percentage: (item.amount / total) * 100
    }))
    .sort((a, b) => b.amount - a.amount);
}, [categoryData]);
```

### 4. Improved Monthly Bar Chart

**Side-by-Side Bars with Better Tooltips:**
```tsx
<Card style={{ padding: '1.5rem' }}>
  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>
    Venituri și Cheltuieli Lunare
  </h3>
  
  {monthlyData.length === 0 ? (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <p style={{ color: tokens['text-muted'], marginBottom: '0.5rem' }}>
        Nu există date pentru perioada selectată
      </p>
      <p style={{ fontSize: '0.875rem', color: tokens['text-muted'] }}>
        Date insuficiente pentru lunile anterioare
      </p>
    </div>
  ) : (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={filteredMonthlyData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={tokens['border-default']} />
        <XAxis 
          dataKey="month" 
          stroke={tokens['text-muted']}
          tickFormatter={(value) => {
            const [year, month] = value.split('-');
            return `${getMonthName(parseInt(month))} ${year}`;
          }}
        />
        <YAxis stroke={tokens['text-muted']} />
        <Tooltip
          position={{ y: -60 }}
          contentStyle={{
            backgroundColor: tokens['bg-elevated'],
            border: `1px solid ${tokens['border-default']}`,
            borderRadius: '0.5rem',
            color: tokens['text-primary']
          }}
          formatter={(value: number, name: string) => {
            const label = name === 'income' ? 'Venituri' : 'Cheltuieli';
            return [`${value.toFixed(2)} RON`, label];
          }}
          labelFormatter={(label) => {
            const [year, month] = label.split('-');
            return `${getMonthName(parseInt(month))} ${year}`;
          }}
        />
        <Legend
          formatter={(value) => value === 'income' ? 'Venituri' : 'Cheltuieli'}
          wrapperStyle={{ paddingTop: '20px' }}
        />
        <Bar 
          dataKey="income" 
          fill={tokens['accent-success']}
          radius={[8, 8, 0, 0]}
          name="income"
        />
        <Bar 
          dataKey="expenses" 
          fill={tokens['accent-danger']}
          radius={[8, 8, 0, 0]}
          name="expenses"
        />
      </BarChart>
    </ResponsiveContainer>
  )}
</Card>

// Filter out empty months
const filteredMonthlyData = useMemo(() => {
  return monthlyData.filter(item => item.income > 0 || item.expenses > 0);
}, [monthlyData]);
```

### 5. NEW: Stacked Area Chart for Category Trends

**Category Trends Over Time:**
```tsx
<Card style={{ padding: '1.5rem' }}>
  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>
    Tendință Cheltuieli pe Categorii
  </h3>
  
  {categoryTrendData.length === 0 ? (
    <p style={{ textAlign: 'center', color: tokens['text-muted'], padding: '2rem' }}>
      Nu există date pentru perioada selectată
    </p>
  ) : (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart
        data={categoryTrendData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          {topCategories.map((category, index) => (
            <linearGradient key={category.id} id={`color-${category.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={category.color} stopOpacity={0.8} />
              <stop offset="95%" stopColor={category.color} stopOpacity={0.1} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={tokens['border-default']} />
        <XAxis 
          dataKey="month" 
          stroke={tokens['text-muted']}
          tickFormatter={(value) => {
            const [year, month] = value.split('-');
            return `${getMonthName(parseInt(month))} ${year}`;
          }}
        />
        <YAxis stroke={tokens['text-muted']} />
        <Tooltip
          contentStyle={{
            backgroundColor: tokens['bg-elevated'],
            border: `1px solid ${tokens['border-default']}`,
            borderRadius: '0.5rem',
            color: tokens['text-primary']
          }}
          formatter={(value: number) => `${value.toFixed(2)} RON`}
          labelFormatter={(label) => {
            const [year, month] = label.split('-');
            return `${getMonthName(parseInt(month))} ${year}`;
          }}
        />
        <Legend 
          wrapperStyle={{ paddingTop: '20px' }}
          formatter={(value, entry: any) => {
            const category = topCategories.find(c => c.id === value);
            return category ? category.name : value;
          }}
        />
        {topCategories.map((category) => (
          <Area
            key={category.id}
            type="monotone"
            dataKey={category.id}
            stackId="1"
            stroke={category.color}
            fill={`url(#color-${category.id})`}
            name={category.id}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )}
  
  <p style={{ 
    fontSize: '0.75rem', 
    color: tokens['text-muted'], 
    marginTop: '1rem',
    textAlign: 'center'
  }}>
    Afișează top {topCategories.length} categorii cu cele mai mari cheltuieli
  </p>
</Card>

// Data preparation
const categoryTrendData = useMemo(() => {
  // Group transactions by month and category
  const monthlyByCategory: Record<string, Record<string, number>> = {};
  
  transactions.forEach(tx => {
    if (tx.type !== 'expense') return;
    
    const monthKey = format(new Date(tx.date), 'yyyy-MM');
    if (!monthlyByCategory[monthKey]) {
      monthlyByCategory[monthKey] = {};
    }
    
    if (!monthlyByCategory[monthKey][tx.categoryId]) {
      monthlyByCategory[monthKey][tx.categoryId] = 0;
    }
    
    monthlyByCategory[monthKey][tx.categoryId] += tx.amount;
  });
  
  // Convert to array format for chart
  return Object.entries(monthlyByCategory)
    .map(([month, categories]) => ({
      month,
      ...categories
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}, [transactions]);

// Get top categories
const topCategories = useMemo(() => {
  const categoryTotals: Record<string, number> = {};
  
  transactions.forEach(tx => {
    if (tx.type !== 'expense') return;
    if (!categoryTotals[tx.categoryId]) {
      categoryTotals[tx.categoryId] = 0;
    }
    categoryTotals[tx.categoryId] += tx.amount;
  });
  
  return Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8) // Top 8 categories
    .map(([categoryId]) => categories.find(c => c.id === categoryId))
    .filter(Boolean);
}, [transactions, categories]);
```

### 6. Consistent Export Buttons

**Export Buttons:**
```tsx
<div style={{
  display: 'flex',
  gap: '1rem',
  justifyContent: 'flex-end',
  marginTop: '2rem'
}}>
  <Button
    variant="primary"
    onClick={handleExportExcel}
    disabled={isExporting}
    style={{
      height: '44px',
      padding: '0 1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    }}
  >
    <FileSpreadsheet size={18} />
    Export Excel
  </Button>
  
  <Button
    variant="secondary"
    onClick={handleExportPDF}
    disabled={isExporting}
    style={{
      height: '44px',
      padding: '0 1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    }}
  >
    <FileText size={18} />
    Export PDF
  </Button>
</div>
```

## 📊 Complete Implementation Checklist

### UI Components
- [ ] 4 KPI cards with icons and deltas
- [ ] Compact date range toolbar
- [ ] Quick preset buttons
- [ ] Horizontal bar chart for categories
- [ ] Improved monthly bar chart
- [ ] NEW: Stacked area chart for trends
- [ ] Consistent export buttons
- [ ] Empty states for all charts

### Features
- [ ] KPI calculations (income, expenses, net, savings rate)
- [ ] Previous period comparison
- [ ] Delta calculations
- [ ] Date preset handlers
- [ ] Filter empty months
- [ ] Sort categories by amount
- [ ] Top N categories for trends
- [ ] Tooltip translations
- [ ] Tooltip positioning

### Styling
- [ ] Midnight Aurora color tokens
- [ ] Gradient fills for area chart
- [ ] Consistent card padding
- [ ] Responsive grid for KPIs
- [ ] Chart colors matching categories

### Data & Logic
- [ ] Fetch data for selected period
- [ ] Fetch previous period data
- [ ] Calculate all metrics
- [ ] Group by month
- [ ] Group by category
- [ ] Filter logic
- [ ] Sort logic

## 🎨 Design Tokens Usage

```typescript
// KPI Colors
'Total Venituri': tokens['accent-success']    // #10b981
'Total Cheltuieli': tokens['accent-danger']   // #f43f5e
'Sold Net': tokens['accent-primary']          // #14b8a6 (or danger if negative)
'Rată Economisire': tokens['accent-info']     // #0ea5e9

// Chart Colors
Income: tokens['accent-success']              // #10b981
Expenses: tokens['accent-danger']             // #f43f5e
Categories: Use actual category colors from database
```

## 📱 Responsive Behavior

### Desktop (>1200px)
- 4 KPI cards in row
- Full-width charts
- Side-by-side export buttons

### Tablet (768px - 1200px)
- 2 KPI cards per row
- Compact charts
- Stacked export buttons

### Mobile (<768px)
- 1 KPI card per row
- Scrollable charts
- Full-width export buttons

## 🚀 Performance Optimizations

- `useMemo` for all calculations
- `useMemo` for filtered data
- `useMemo` for sorted data
- Lazy loading for charts
- Debounced date changes

## 📋 Implementation Priority

1. **High Priority** (Core UX):
   - KPI cards
   - Date range toolbar
   - Horizontal bar chart
   - Improved monthly chart
   - Export buttons

2. **Medium Priority** (Enhanced UX):
   - Previous period comparison
   - Delta indicators
   - Empty states
   - Tooltip improvements
   - Category trends chart

3. **Low Priority** (Nice to Have):
   - Chart animations
   - Export templates
   - Print view
   - Share functionality

## 🐛 Edge Cases to Handle

- No data for selected period
- Single month selected
- Future dates selected
- Invalid date ranges
- No categories defined
- All zero values
- Very large numbers
- Negative savings rate

## 📚 Related Files

- `frontend/src/features/reports/Reports.tsx` - Main component
- `frontend/src/services/statistics.service.ts` - Statistics API
- `frontend/src/services/reports.service.ts` - Reports API
- `frontend/src/styles/colors.ts` - Color tokens
- `frontend/src/utils/dateHelpers.ts` - Date utilities

## 🔧 Helper Functions

```typescript
// Month name helper
function getMonthName(month: number): string {
  const months = [
    'Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun',
    'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'
  ];
  return months[month - 1] || '';
}

// Previous period calculator
function getPreviousPeriod(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - diffDays);
  
  return {
    startDate: prevStart.toISOString().split('T')[0],
    endDate: prevEnd.toISOString().split('T')[0]
  };
}

// Savings rate calculator
function calculateSavingsRate(income: number, expenses: number): number {
  if (income === 0) return 0;
  return ((income - expenses) / income) * 100;
}

// Delta calculator
function calculateDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}
```

## 📖 Chart Configuration Examples

### Horizontal Bar Chart Config
```typescript
const horizontalBarConfig = {
  layout: 'vertical',
  margin: { top: 5, right: 80, left: 20, bottom: 5 },
  barSize: 32,
  barGap: 8,
  barCategoryGap: 16
};
```

### Monthly Bar Chart Config
```typescript
const monthlyBarConfig = {
  margin: { top: 20, right: 30, left: 20, bottom: 5 },
  barSize: 40,
  barGap: 8,
  barCategoryGap: '20%'
};
```

### Area Chart Config
```typescript
const areaChartConfig = {
  margin: { top: 10, right: 30, left: 0, bottom: 0 },
  stackOffset: 'none',
  type: 'monotone'
};
```
