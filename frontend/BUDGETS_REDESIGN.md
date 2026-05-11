# Budgets Page - Comprehensive Redesign Specification

## Overview
Complete redesign of the Budgets page with enhanced cards, better status indicators, detailed information, and improved UX.

## 🎯 Key Improvements

### 1. Enhanced Budget Cards

**Card Layout:**
```tsx
<Card style={{ padding: '1.5rem', position: 'relative' }}>
  {/* Header Row */}
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
    <h3 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
      {getMonthName(budget.month)} {budget.year}
    </h3>
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <Button variant="ghost" onClick={() => onEdit(budget)}>
        <Edit2 size={16} />
      </Button>
      <Button variant="ghost" onClick={() => onDelete(budget.id)}>
        <Trash2 size={16} />
      </Button>
    </div>
  </div>

  {/* Status Badge - Top Right */}
  <div style={{
    position: 'absolute',
    top: '1.5rem',
    right: '5rem',
    padding: '0.375rem 0.75rem',
    borderRadius: '0.5rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    backgroundColor: statusColor + '20',
    color: statusColor,
    border: `1px solid ${statusColor}40`
  }}>
    {statusText}
  </div>

  {/* Big Number */}
  <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
    {spent.toFixed(2)} / {limit.toFixed(2)} RON
  </div>

  {/* Progress Bar - Tall with Gradient */}
  <div style={{
    height: '16px',
    backgroundColor: tokens['bg-base'],
    borderRadius: '8px',
    overflow: 'visible',
    position: 'relative',
    marginBottom: '1rem'
  }}>
    <div style={{
      width: `${Math.min(percentage, 100)}%`,
      height: '100%',
      background: progressGradient,
      borderRadius: '8px',
      transition: 'width 0.3s ease'
    }} />
    {percentage > 100 && (
      <div style={{
        position: 'absolute',
        left: '100%',
        top: 0,
        width: `${(percentage - 100) * 2}px`,
        height: '100%',
        background: 'linear-gradient(90deg, #f43f5e, #dc2626)',
        borderRadius: '0 8px 8px 0'
      }} />
    )}
  </div>

  {/* Sub-info Row */}
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.875rem',
    color: tokens['text-muted'],
    marginBottom: '1rem'
  }}>
    <span>{daysRemaining} zile rămase din lună</span>
    <span>
      Pace ideal: {idealPace.toFixed(2)} RON
      <span style={{ color: paceColor }}>
        {' '}(ești cu {Math.abs(paceDiff).toFixed(2)} RON {paceDiff > 0 ? 'peste' : 'sub'})
      </span>
    </span>
  </div>

  {/* Category Chips with Real Colors */}
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
    {budget.categories.map(bc => {
      const category = getCategory(bc.categoryId);
      return (
        <div key={bc.id} style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.375rem 0.75rem',
          borderRadius: '0.5rem',
          backgroundColor: `${category.color}20`,
          border: `1px solid ${category.color}40`,
          fontSize: '0.875rem'
        }}>
          <span style={{ fontSize: '0.875rem' }}>{category.icon}</span>
          <span>{category.name}</span>
          <span style={{ fontWeight: 600 }}>{bc.limitAmount} RON</span>
        </div>
      );
    })}
  </div>

  {/* View Details Link */}
  <Button
    variant="ghost"
    onClick={() => handleViewDetails(budget)}
    style={{
      width: '100%',
      justifyContent: 'center',
      fontSize: '0.875rem',
      color: tokens['accent-primary']
    }}
  >
    <Eye size={16} style={{ marginRight: '0.5rem' }} />
    Vezi Detalii
  </Button>
</Card>
```

### 2. Status Indicators

**Status Logic:**
```typescript
function getBudgetStatus(spent: number, limit: number) {
  const percentage = (spent / limit) * 100;
  
  if (percentage >= 100) {
    return {
      text: 'Depășit',
      color: tokens['accent-danger'], // #f43f5e
      gradient: 'linear-gradient(90deg, #f43f5e, #dc2626)'
    };
  } else if (percentage >= 91) {
    return {
      text: 'Aproape depășit',
      color: '#fb923c', // orange
      gradient: 'linear-gradient(90deg, #fb923c, #f97316)'
    };
  } else if (percentage >= 71) {
    return {
      text: 'Atenție',
      color: tokens['accent-warning'], // #f59e0b
      gradient: 'linear-gradient(90deg, #fbbf24, #f59e0b)'
    };
  } else {
    return {
      text: 'Sub control',
      color: tokens['accent-success'], // #10b981
      gradient: 'linear-gradient(90deg, #34d399, #10b981)'
    };
  }
}
```

### 3. Pace Calculation

**Ideal Pace Logic:**
```typescript
function calculatePace(budget: Budget, spent: number) {
  const now = new Date();
  const daysInMonth = new Date(budget.year, budget.month, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = daysInMonth - currentDay;
  
  // Ideal pace: how much should be spent by now
  const idealPace = (budget.totalLimit / daysInMonth) * currentDay;
  const paceDiff = spent - idealPace;
  
  return {
    idealPace,
    paceDiff,
    daysRemaining,
    paceColor: paceDiff > 0 ? tokens['accent-danger'] : tokens['accent-success']
  };
}
```

### 4. Responsive Grid

**Grid Layout:**
```tsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
  gap: '1.5rem',
  marginTop: '1.5rem'
}}>
  {sortedBudgets.map(budget => (
    <BudgetCard key={budget.id} budget={budget} />
  ))}
</div>

/* Responsive breakpoints:
 * Mobile (<768px): 1 column
 * Tablet (768px-1200px): 2 columns
 * Desktop (>1200px): 3 columns
 */
```

### 5. Filter & Sort Controls

**Sort Options:**
```tsx
<div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem'
}}>
  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
    <span style={{ fontSize: '0.875rem', color: tokens['text-muted'] }}>
      Sortare:
    </span>
    <Select
      value={sortBy}
      onChange={(e) => setSortBy(e.target.value as SortOption)}
      options={[
        { value: 'recent', label: 'Cele mai recente' },
        { value: 'status', label: 'Status' },
        { value: 'percentage', label: '% consumat' },
      ]}
      style={{ width: '200px' }}
    />
  </div>
</div>

// Sort logic
const sortedBudgets = useMemo(() => {
  const sorted = [...budgets];
  
  switch (sortBy) {
    case 'recent':
      return sorted.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
    
    case 'status':
      return sorted.sort((a, b) => {
        const aStatus = getBudgetStatus(getSpent(a), a.totalLimit);
        const bStatus = getBudgetStatus(getSpent(b), b.totalLimit);
        const statusOrder = { 'Depășit': 0, 'Aproape depășit': 1, 'Atenție': 2, 'Sub control': 3 };
        return statusOrder[aStatus.text] - statusOrder[bStatus.text];
      });
    
    case 'percentage':
      return sorted.sort((a, b) => {
        const aPercentage = (getSpent(a) / a.totalLimit) * 100;
        const bPercentage = (getSpent(b) / b.totalLimit) * 100;
        return bPercentage - aPercentage;
      });
    
    default:
      return sorted;
  }
}, [budgets, sortBy]);
```

### 6. Empty State

**Empty State Component:**
```tsx
{budgets.length === 0 && (
  <EmptyState
    icon={PiggyBank}
    title="Nu ai bugete create"
    description="Nu ai bugete create. Creează primul tău buget lunar pentru a-ți controla cheltuielile pe categorii."
    action={{
      label: 'Creează Primul Buget',
      onClick: handleOpenCreateModal
    }}
  />
)}
```

### 7. View Details Modal

**Details Modal:**
```tsx
<Modal
  isOpen={isDetailsModalOpen}
  onClose={() => setIsDetailsModalOpen(false)}
  title={`Detalii Buget - ${getMonthName(selectedBudget.month)} ${selectedBudget.year}`}
>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
    {/* Summary */}
    <div style={{
      padding: '1rem',
      backgroundColor: tokens['bg-elevated'],
      borderRadius: '0.5rem'
    }}>
      <div style={{ fontSize: '0.875rem', color: tokens['text-muted'], marginBottom: '0.5rem' }}>
        Total Cheltuit
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700 }}>
        {spent.toFixed(2)} / {selectedBudget.totalLimit.toFixed(2)} RON
      </div>
      <div style={{ fontSize: '0.875rem', color: statusColor, marginTop: '0.5rem' }}>
        {statusText} • {percentage.toFixed(1)}%
      </div>
    </div>

    {/* Category Breakdown */}
    <div>
      <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
        Detalii pe Categorii
      </h4>
      {selectedBudget.categories.map(bc => {
        const category = getCategory(bc.categoryId);
        const categorySpent = getCategorySpent(bc.categoryId, selectedBudget.month, selectedBudget.year);
        const categoryPercentage = (categorySpent / bc.limitAmount) * 100;
        
        return (
          <div key={bc.id} style={{
            padding: '1rem',
            backgroundColor: tokens['bg-elevated'],
            borderRadius: '0.5rem',
            marginBottom: '0.75rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>{category.icon}</span>
                <span style={{ fontWeight: 500 }}>{category.name}</span>
              </div>
              <span style={{ fontWeight: 600 }}>
                {categorySpent.toFixed(2)} / {bc.limitAmount} RON
              </span>
            </div>
            <div style={{
              height: '8px',
              backgroundColor: tokens['bg-base'],
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min(categoryPercentage, 100)}%`,
                height: '100%',
                backgroundColor: category.color,
                borderRadius: '4px'
              }} />
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: tokens['text-muted'],
              marginTop: '0.25rem'
            }}>
              {categoryPercentage.toFixed(1)}%
            </div>
          </div>
        );
      })}
    </div>

    {/* Transactions List */}
    <div>
      <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
        Tranzacții din această perioadă
      </h4>
      {transactions.length === 0 ? (
        <p style={{ color: tokens['text-muted'], textAlign: 'center', padding: '2rem' }}>
          Nu există tranzacții în această perioadă.
        </p>
      ) : (
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {transactions.map(tx => (
            <div key={tx.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.75rem',
              borderBottom: `1px solid ${tokens['border-default']}`
            }}>
              <div>
                <div style={{ fontWeight: 500 }}>{tx.description}</div>
                <div style={{ fontSize: '0.75rem', color: tokens['text-muted'] }}>
                  {new Date(tx.date).toLocaleDateString('ro-RO')}
                </div>
              </div>
              <div style={{
                fontWeight: 600,
                color: tokens['accent-danger']
              }}>
                -{tx.amount.toFixed(2)} RON
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
</Modal>
```

### 8. Recurring Budget Feature

**Recurring Budget Checkbox:**
```tsx
{/* In Create Budget Modal */}
<div style={{
  padding: '1rem',
  backgroundColor: tokens['bg-elevated'],
  borderRadius: '0.5rem',
  marginTop: '1rem'
}}>
  <label style={{
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    cursor: 'pointer'
  }}>
    <input
      type="checkbox"
      checked={formData.isRecurring}
      onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
      style={{ cursor: 'pointer', width: '18px', height: '18px' }}
    />
    <div>
      <div style={{ fontWeight: 500, color: tokens['text-primary'] }}>
        Buget Recurent
      </div>
      <div style={{ fontSize: '0.75rem', color: tokens['text-muted'] }}>
        Creează automat același buget pentru lunile următoare
      </div>
    </div>
  </label>
</div>

// Backend logic to create recurring budgets
if (formData.isRecurring) {
  // Create budget for next 12 months
  const promises = [];
  for (let i = 0; i < 12; i++) {
    const futureMonth = (formData.month + i) % 12 || 12;
    const futureYear = formData.year + Math.floor((formData.month + i - 1) / 12);
    
    promises.push(
      budgetsService.create({
        ...budgetData,
        month: futureMonth,
        year: futureYear
      })
    );
  }
  await Promise.all(promises);
}
```

## 📊 Complete Implementation Checklist

### UI Components
- [ ] Enhanced budget cards with all sections
- [ ] Status badges with color coding
- [ ] Tall progress bars with gradients
- [ ] Overflow indicator for >100%
- [ ] Category chips with real colors and icons
- [ ] View Details button
- [ ] Responsive grid layout
- [ ] Sort dropdown
- [ ] Empty state component

### Features
- [ ] Status calculation (0-70%, 71-90%, 91-100%, >100%)
- [ ] Pace calculation (ideal vs actual)
- [ ] Days remaining calculation
- [ ] Sort by: Recent, Status, % consumed
- [ ] View Details modal
- [ ] Category breakdown in details
- [ ] Transactions list in details
- [ ] Recurring budget checkbox
- [ ] Auto-create recurring budgets

### Styling
- [ ] Midnight Aurora color tokens
- [ ] Gradient progress bars
- [ ] Hover states
- [ ] Transition animations
- [ ] Responsive breakpoints

### Data & Logic
- [ ] Fetch spent amount per budget
- [ ] Fetch spent amount per category
- [ ] Fetch transactions for budget period
- [ ] Calculate all metrics
- [ ] Sort logic
- [ ] Filter logic

## 🎨 Design Tokens Usage

```typescript
// Status Colors
'Sub control': tokens['accent-success']      // #10b981
'Atenție': tokens['accent-warning']          // #f59e0b
'Aproape depășit': '#fb923c'                 // orange
'Depășit': tokens['accent-danger']           // #f43f5e

// Gradients
green: 'linear-gradient(90deg, #34d399, #10b981)'
amber: 'linear-gradient(90deg, #fbbf24, #f59e0b)'
orange: 'linear-gradient(90deg, #fb923c, #f97316)'
red: 'linear-gradient(90deg, #f43f5e, #dc2626)'
```

## 📱 Responsive Behavior

### Desktop (>1200px)
- 3 columns grid
- Full details visible
- Hover effects

### Tablet (768px - 1200px)
- 2 columns grid
- Compact details
- Touch-friendly

### Mobile (<768px)
- 1 column grid
- Stacked layout
- Bottom sheet for details

## 🚀 Performance Optimizations

- `useMemo` for sorted budgets
- `useMemo` for calculated metrics
- Lazy loading for transactions
- Debounced sort changes
- Virtual scrolling for large lists

## 📋 Implementation Priority

1. **High Priority** (Core UX):
   - Enhanced card layout
   - Status indicators
   - Progress bars
   - Responsive grid
   - Empty state

2. **Medium Priority** (Enhanced UX):
   - Sort controls
   - View Details modal
   - Category breakdown
   - Pace calculation
   - Days remaining

3. **Low Priority** (Nice to Have):
   - Recurring budgets
   - Transactions list in details
   - Export functionality
   - Budget templates

## 🐛 Edge Cases to Handle

- Budget with no categories
- Budget with 0 limit
- Budget in future month
- Budget with >100% spent
- No transactions in period
- Invalid date ranges
- Recurring budget conflicts

## 📚 Related Files

- `frontend/src/features/budgets/Budgets.tsx` - Main component
- `frontend/src/components/ui/EmptyState.tsx` - Empty state component
- `frontend/src/services/budgets.service.ts` - API service
- `frontend/src/services/statistics.service.ts` - Statistics API
- `frontend/src/styles/colors.ts` - Color tokens
