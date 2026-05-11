# Tranzacții Page - Comprehensive Improvements Specification

## Overview
Complete redesign of the Transactions page with enhanced filtering, better UX, bulk actions, and improved data presentation.

## 🎯 Key Improvements

### 1. Search & Filter Bar Alignment
**Current**: Search and filter button are misaligned
**Improved**:
```tsx
<div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
  <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
    <Search size={18} style={{ 
      position: 'absolute', 
      left: '1rem', 
      top: '50%', 
      transform: 'translateY(-50%)', 
      color: tokens['text-muted'] 
    }} />
    <Input 
      placeholder="Caută după descriere sau sumă..." 
      style={{ 
        paddingLeft: '2.5rem', 
        height: '42px',
        marginBottom: 0 
      }} 
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>
  <Button 
    variant="secondary" 
    onClick={() => setIsFilterOpen(true)}
    style={{ height: '42px', position: 'relative' }}
  >
    <Filter size={18} style={{ marginRight: '0.5rem' }} /> 
    Filtre
    {activeFilterCount > 0 && (
      <span style={{
        position: 'absolute',
        top: '-6px',
        right: '-6px',
        backgroundColor: tokens['accent-primary'],
        color: 'white',
        borderRadius: '50%',
        width: '20px',
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.75rem',
        fontWeight: 600
      }}>
        {activeFilterCount}
      </span>
    )}
  </Button>
</div>
```

### 2. Category Column in Table
**Add between "Descriere" and "Tip"**:
```tsx
<th>Categorie</th>

// In tbody:
<td>
  <div style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.375rem 0.75rem',
    borderRadius: '0.5rem',
    backgroundColor: `${category.color}20`,
    border: `1px solid ${category.color}40`
  }}>
    <span style={{ fontSize: '1rem' }}>{category.icon}</span>
    <span style={{ 
      fontSize: '0.875rem', 
      fontWeight: 500,
      color: tokens['text-primary']
    }}>
      {category.name}
    </span>
  </div>
</td>
```

### 3. Tabular Numbers for Amount Column
```css
/* Add to index.css */
.amount-column {
  font-variant-numeric: tabular-nums;
  text-align: right;
  font-weight: 600;
  font-feature-settings: "tnum";
}
```

```tsx
<th style={{ textAlign: 'right' }}>Sumă</th>

<td className="amount-column" style={{
  color: transaction.type === 'income' 
    ? tokens['accent-success'] 
    : tokens['text-primary']
}}>
  {transaction.type === 'income' ? '+' : '-'}
  {Number(transaction.amount).toFixed(2)} RON
</td>
```

### 4. Summary Bar Above Table
```tsx
const summary = useMemo(() => {
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  return {
    count: filteredTransactions.length,
    totalIncome,
    totalExpenses,
    net: totalIncome - totalExpenses
  };
}, [filteredTransactions]);

// Render:
<div style={{
  display: 'flex',
  gap: '2rem',
  padding: '1rem 1.5rem',
  backgroundColor: tokens['bg-elevated'],
  borderRadius: '0.5rem',
  marginBottom: '1rem',
  fontSize: '0.9rem'
}}>
  <div>
    <span style={{ color: tokens['text-muted'] }}>
      {summary.count} tranzacții
    </span>
  </div>
  <div style={{ borderLeft: `1px solid ${tokens['border-default']}`, paddingLeft: '2rem' }}>
    <span style={{ color: tokens['text-muted'] }}>Total Venituri: </span>
    <span style={{ fontWeight: 600, color: tokens['accent-success'] }}>
      {summary.totalIncome.toFixed(2)} RON
    </span>
  </div>
  <div style={{ borderLeft: `1px solid ${tokens['border-default']}`, paddingLeft: '2rem' }}>
    <span style={{ color: tokens['text-muted'] }}>Total Cheltuieli: </span>
    <span style={{ fontWeight: 600, color: tokens['accent-danger'] }}>
      {summary.totalExpenses.toFixed(2)} RON
    </span>
  </div>
  <div style={{ borderLeft: `1px solid ${tokens['border-default']}`, paddingLeft: '2rem' }}>
    <span style={{ color: tokens['text-muted'] }}>Net: </span>
    <span style={{ 
      fontWeight: 600, 
      color: summary.net >= 0 ? tokens['accent-success'] : tokens['accent-danger'] 
    }}>
      {summary.net >= 0 ? '+' : ''}{summary.net.toFixed(2)} RON
    </span>
  </div>
</div>
```

### 5. Pagination
```tsx
const ITEMS_PER_PAGE = 20;
const [currentPage, setCurrentPage] = useState(1);

const paginatedTransactions = useMemo(() => {
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
}, [filteredTransactions, currentPage]);

const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

// Render below table:
<div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1rem 1.5rem',
  borderTop: `1px solid ${tokens['border-default']}`
}}>
  <div style={{ fontSize: '0.875rem', color: tokens['text-muted'] }}>
    Afișare {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-
    {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} din {filteredTransactions.length}
  </div>
  <div style={{ display: 'flex', gap: '0.5rem' }}>
    <Button
      variant="ghost"
      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
      disabled={currentPage === 1}
    >
      Anterior
    </Button>
    {Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter(page => {
        // Show first, last, current, and adjacent pages
        return page === 1 || 
               page === totalPages || 
               Math.abs(page - currentPage) <= 1;
      })
      .map((page, index, array) => (
        <>
          {index > 0 && array[index - 1] !== page - 1 && (
            <span key={`ellipsis-${page}`} style={{ padding: '0.5rem' }}>...</span>
          )}
          <Button
            key={page}
            variant={page === currentPage ? 'primary' : 'ghost'}
            onClick={() => setCurrentPage(page)}
            style={{ minWidth: '40px' }}
          >
            {page}
          </Button>
        </>
      ))}
    <Button
      variant="ghost"
      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
      disabled={currentPage === totalPages}
    >
      Următor
    </Button>
  </div>
</div>
```

### 6. Row Selection & Bulk Actions
```tsx
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

const toggleSelection = (id: string) => {
  setSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
  });
};

const toggleSelectAll = () => {
  if (selectedIds.size === paginatedTransactions.length) {
    setSelectedIds(new Set());
  } else {
    setSelectedIds(new Set(paginatedTransactions.map(t => t.id)));
  }
};

// Table header:
<th style={{ width: '40px' }}>
  <input
    type="checkbox"
    checked={selectedIds.size === paginatedTransactions.length && paginatedTransactions.length > 0}
    onChange={toggleSelectAll}
    style={{ cursor: 'pointer' }}
  />
</th>

// Table body:
<td>
  <input
    type="checkbox"
    checked={selectedIds.has(transaction.id)}
    onChange={() => toggleSelection(transaction.id)}
    onClick={(e) => e.stopPropagation()}
    style={{ cursor: 'pointer' }}
  />
</td>

// Floating action bar:
{selectedIds.size > 0 && (
  <div style={{
    position: 'fixed',
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: tokens['bg-elevated'],
    border: `1px solid ${tokens['border-default']}`,
    borderRadius: '0.75rem',
    padding: '1rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
    zIndex: 50
  }}>
    <span style={{ fontSize: '0.9rem', color: tokens['text-muted'] }}>
      {selectedIds.size} selectate
    </span>
    <div style={{ 
      width: '1px', 
      height: '24px', 
      backgroundColor: tokens['border-default'] 
    }} />
    <Button variant="ghost" onClick={handleBulkDelete}>
      <Trash2 size={16} style={{ marginRight: '0.5rem' }} />
      Șterge
    </Button>
    <Button variant="ghost" onClick={handleBulkChangeCategory}>
      <FolderOpen size={16} style={{ marginRight: '0.5rem' }} />
      Schimbă Categoria
    </Button>
    <Button variant="ghost" onClick={handleBulkExport}>
      <Download size={16} style={{ marginRight: '0.5rem' }} />
      Export
    </Button>
    <Button variant="ghost" onClick={() => setSelectedIds(new Set())}>
      <X size={16} />
    </Button>
  </div>
)}
```

### 7. Clickable Table Rows
```tsx
<tr 
  key={transaction.id}
  onClick={() => handleRowClick(transaction)}
  style={{
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = tokens['bg-hover'];
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'transparent';
  }}
>
  {/* cells */}
</tr>

const handleRowClick = (transaction: Transaction) => {
  setEditingTransaction(transaction);
  setFormData({
    description: transaction.description || '',
    amount: Number(transaction.amount),
    type: transaction.type,
    categoryId: transaction.categoryId,
    date: new Date(transaction.date).toISOString().split('T')[0],
  });
  setIsEditModalOpen(true);
};
```

### 8. Empty State Component
```tsx
import { EmptyState } from '../../components/ui/EmptyState';
import { Inbox } from 'lucide-react';

// When no transactions match filters:
{filteredTransactions.length === 0 && (
  <EmptyState
    icon={Inbox}
    title={hasActiveFilters ? "Nu s-au găsit tranzacții" : "Nu există tranzacții"}
    description={
      hasActiveFilters 
        ? "Nicio tranzacție nu corespunde criteriilor de filtrare selectate."
        : "Adaugă prima ta tranzacție pentru a începe să-ți urmărești finanțele."
    }
    action={hasActiveFilters ? {
      label: "Resetează Filtrele",
      onClick: handleClearFilters
    } : {
      label: "Adaugă Tranzacție",
      onClick: handleOpenAddModal
    }}
  />
)}
```

### 9. Enhanced Description Input
```tsx
const DESCRIPTION_SUGGESTIONS = [
  "Cumpărături Lidl",
  "Cumpărături Kaufland",
  "Salariu martie",
  "Factură curent",
  "Factură gaz",
  "Factură internet",
  "Benzină",
  "Restaurant",
  "Cafenea",
  "Transport public"
];

<Input 
  label="Descriere" 
  placeholder="ex: Cumpărături Lidl, Salariu martie, Factură curent..."
  value={formData.description}
  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
  list="description-suggestions"
/>
<datalist id="description-suggestions">
  {DESCRIPTION_SUGGESTIONS.map(suggestion => (
    <option key={suggestion} value={suggestion} />
  ))}
</datalist>
```

### 10. Advanced Filter Panel
```tsx
interface FilterState {
  dateRange: 'current-month' | 'last-30-days' | 'current-year' | 'custom';
  customStartDate: string;
  customEndDate: string;
  types: Set<'income' | 'expense'>;
  categoryIds: Set<string>;
  minAmount: number;
  maxAmount: number;
}

const [filters, setFilters] = useState<FilterState>({
  dateRange: 'current-month',
  customStartDate: '',
  customEndDate: '',
  types: new Set(),
  categoryIds: new Set(),
  minAmount: 0,
  maxAmount: 999999,
});

// Filter Panel Component:
<Modal
  isOpen={isFilterOpen}
  onClose={() => setIsFilterOpen(false)}
  title="Filtrează Tranzacțiile"
  footer={
    <>
      <Button variant="ghost" onClick={handleResetFilters}>
        Resetează
      </Button>
      <Button variant="primary" onClick={handleApplyFilters}>
        Aplică Filtrele
      </Button>
    </>
  }
>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
    {/* Date Range */}
    <div>
      <label style={{ 
        display: 'block', 
        marginBottom: '0.5rem', 
        fontSize: '0.875rem',
        fontWeight: 500,
        color: tokens['text-secondary']
      }}>
        Perioadă
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
        {[
          { value: 'current-month', label: 'Luna curentă' },
          { value: 'last-30-days', label: 'Ultimele 30 zile' },
          { value: 'current-year', label: 'Anul curent' },
          { value: 'custom', label: 'Personalizat' },
        ].map(option => (
          <button
            key={option.value}
            onClick={() => setFilters({ ...filters, dateRange: option.value as any })}
            style={{
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: `1px solid ${
                filters.dateRange === option.value 
                  ? tokens['accent-primary'] 
                  : tokens['border-default']
              }`,
              backgroundColor: filters.dateRange === option.value 
                ? `${tokens['accent-primary']}20` 
                : 'transparent',
              color: filters.dateRange === option.value 
                ? tokens['accent-primary'] 
                : tokens['text-primary'],
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
      {filters.dateRange === 'custom' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
          <Input
            label="De la"
            type="date"
            value={filters.customStartDate}
            onChange={(e) => setFilters({ ...filters, customStartDate: e.target.value })}
          />
          <Input
            label="Până la"
            type="date"
            value={filters.customEndDate}
            onChange={(e) => setFilters({ ...filters, customEndDate: e.target.value })}
          />
        </div>
      )}
    </div>

    {/* Type Multiselect */}
    <div>
      <label style={{ 
        display: 'block', 
        marginBottom: '0.5rem', 
        fontSize: '0.875rem',
        fontWeight: 500,
        color: tokens['text-secondary']
      }}>
        Tip Tranzacție
      </label>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {[
          { value: 'income', label: 'Venit', color: tokens['accent-success'] },
          { value: 'expense', label: 'Cheltuială', color: tokens['accent-danger'] },
        ].map(type => (
          <button
            key={type.value}
            onClick={() => {
              const newTypes = new Set(filters.types);
              if (newTypes.has(type.value as any)) {
                newTypes.delete(type.value as any);
              } else {
                newTypes.add(type.value as any);
              }
              setFilters({ ...filters, types: newTypes });
            }}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: `1px solid ${
                filters.types.has(type.value as any) 
                  ? type.color 
                  : tokens['border-default']
              }`,
              backgroundColor: filters.types.has(type.value as any) 
                ? `${type.color}20` 
                : 'transparent',
              color: filters.types.has(type.value as any) 
                ? type.color 
                : tokens['text-primary'],
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>

    {/* Category Multiselect */}
    <div>
      <label style={{ 
        display: 'block', 
        marginBottom: '0.5rem', 
        fontSize: '0.875rem',
        fontWeight: 500,
        color: tokens['text-secondary']
      }}>
        Categorii
      </label>
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '0.5rem',
        maxHeight: '200px',
        overflowY: 'auto',
        padding: '0.5rem',
        border: `1px solid ${tokens['border-default']}`,
        borderRadius: '0.5rem'
      }}>
        {categories.map((category: Category) => (
          <button
            key={category.id}
            onClick={() => {
              const newCategories = new Set(filters.categoryIds);
              if (newCategories.has(category.id)) {
                newCategories.delete(category.id);
              } else {
                newCategories.add(category.id);
              }
              setFilters({ ...filters, categoryIds: newCategories });
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              border: `1px solid ${
                filters.categoryIds.has(category.id) 
                  ? category.color 
                  : tokens['border-default']
              }`,
              backgroundColor: filters.categoryIds.has(category.id) 
                ? `${category.color}30` 
                : 'transparent',
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'all 0.2s'
            }}
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>
    </div>

    {/* Amount Range */}
    <div>
      <label style={{ 
        display: 'block', 
        marginBottom: '0.5rem', 
        fontSize: '0.875rem',
        fontWeight: 500,
        color: tokens['text-secondary']
      }}>
        Interval Sumă
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <Input
          label="Minim"
          type="number"
          placeholder="0"
          value={filters.minAmount || ''}
          onChange={(e) => setFilters({ ...filters, minAmount: parseFloat(e.target.value) || 0 })}
        />
        <Input
          label="Maxim"
          type="number"
          placeholder="999999"
          value={filters.maxAmount || ''}
          onChange={(e) => setFilters({ ...filters, maxAmount: parseFloat(e.target.value) || 999999 })}
        />
      </div>
    </div>
  </div>
</Modal>

// Calculate active filter count:
const activeFilterCount = useMemo(() => {
  let count = 0;
  if (filters.dateRange !== 'current-month') count++;
  if (filters.types.size > 0) count++;
  if (filters.categoryIds.size > 0) count++;
  if (filters.minAmount > 0 || filters.maxAmount < 999999) count++;
  return count;
}, [filters]);
```

## 📊 Complete Implementation Checklist

### UI Components
- [ ] Aligned search and filter bar (flex container, gap-3)
- [ ] Category column with colored chips
- [ ] Tabular numbers for amount column
- [ ] Summary bar above table
- [ ] Pagination controls
- [ ] Checkbox column for selection
- [ ] Floating action bar for bulk operations
- [ ] Clickable table rows with hover state
- [ ] Empty state component
- [ ] Enhanced filter panel

### Features
- [ ] Row selection (individual + select all)
- [ ] Bulk delete
- [ ] Bulk change category
- [ ] Bulk export
- [ ] Advanced filters (date presets, multiselect, amount range)
- [ ] Active filter count badge
- [ ] Description input suggestions
- [ ] Pagination or infinite scroll
- [ ] Summary calculations (reflect filter state)

### Styling
- [ ] Tabular numbers CSS
- [ ] Hover states
- [ ] Transition animations
- [ ] Responsive layout
- [ ] Midnight Aurora color tokens

### Data & Logic
- [ ] Filter application logic
- [ ] Summary calculations
- [ ] Pagination logic
- [ ] Selection state management
- [ ] Bulk operation mutations
- [ ] Toast notifications for all actions

## 🎨 Design Tokens Usage

```typescript
// Colors
tokens['bg-elevated'] // Summary bar background
tokens['border-default'] // Borders
tokens['text-muted'] // Labels
tokens['text-primary'] // Main text
tokens['accent-primary'] // Active filters, selected items
tokens['accent-success'] // Income
tokens['accent-danger'] // Expenses
tokens['bg-hover'] // Row hover state

// Typography
font-variant-numeric: tabular-nums // Amount column
font-feature-settings: "tnum" // Tabular numbers
```

## 📱 Responsive Behavior

### Desktop (>1200px)
- Full table with all columns
- Pagination controls
- Floating action bar

### Tablet (768px - 1200px)
- Horizontal scroll for table
- Simplified pagination
- Floating action bar

### Mobile (<768px)
- Card-based layout instead of table
- Simplified filters
- Bottom sheet for bulk actions

## 🚀 Performance Optimizations

- `useMemo` for filtered/paginated data
- `useMemo` for summary calculations
- Debounced search input
- Virtual scrolling for large datasets (optional)
- Lazy loading for categories

## 📋 Implementation Priority

1. **High Priority** (Core UX):
   - Aligned search/filter bar
   - Category column
   - Tabular numbers
   - Summary bar
   - Clickable rows
   - Empty state

2. **Medium Priority** (Enhanced UX):
   - Pagination
   - Row selection
   - Bulk actions
   - Advanced filters
   - Filter count badge

3. **Low Priority** (Nice to Have):
   - Description suggestions
   - Infinite scroll
   - Export functionality
   - Keyboard shortcuts

## 🐛 Edge Cases to Handle

- Empty transaction list
- No categories defined
- All transactions filtered out
- Single transaction
- Very long descriptions (truncate)
- Very large amounts (format with commas)
- Invalid date ranges
- Bulk operations on mixed types

## 📚 Related Files

- `frontend/src/features/transactions/Transactions.tsx` - Main component
- `frontend/src/components/ui/EmptyState.tsx` - Empty state component
- `frontend/src/services/transactions.service.ts` - API service
- `frontend/src/styles/colors.ts` - Color tokens
- `frontend/src/index.css` - Global styles (add tabular-nums)
