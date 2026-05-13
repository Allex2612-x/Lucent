# Tip Toggle Semantic Color Fix

## Issue
The "Tip" toggle buttons in the transaction modals (Add and Edit) currently use `variant="primary"` which will display the new blue accent color. However, these buttons should use **semantic colors** to match the transaction type:
- **Cheltuială** (Expense) → Red (`tokens['accent-danger']`)
- **Venit** (Income) → Green (`tokens['accent-success']`)

## Locations
File: `frontend/src/features/transactions/Transactions.tsx`
- **Add Modal**: Lines 778-795
- **Edit Modal**: Lines 901-918

## Required Changes

Replace the Button components with custom styled buttons:

### Current Code (WRONG):
```tsx
<Button
  type="button"
  variant={formData.type === 'expense' ? 'primary' : 'secondary'}
  onClick={() => setFormData({ ...formData, type: 'expense', categoryId: '' })}
  style={{ flex: 1 }}
>
  Cheltuială
</Button>
<Button
  type="button"
  variant={formData.type === 'income' ? 'primary' : 'secondary'}
  onClick={() => setFormData({ ...formData, type: 'income', categoryId: '' })}
  style={{ flex: 1 }}
>
  Venit
</Button>
```

### Correct Code (FIXED):
```tsx
<button
  type="button"
  onClick={() => setFormData({ ...formData, type: 'expense', categoryId: '' })}
  style={{
    flex: 1,
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    border: `1px solid ${formData.type === 'expense' ? tokens['accent-danger'] : tokens['border-default']}`,
    backgroundColor: formData.type === 'expense' ? tokens['accent-danger-soft'] : 'transparent',
    color: formData.type === 'expense' ? tokens['accent-danger'] : tokens['text-muted'],
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    fontSize: '1rem',
  }}
>
  Cheltuială
</button>
<button
  type="button"
  onClick={() => setFormData({ ...formData, type: 'income', categoryId: '' })}
  style={{
    flex: 1,
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    border: `1px solid ${formData.type === 'income' ? tokens['accent-success'] : tokens['border-default']}`,
    backgroundColor: formData.type === 'income' ? tokens['accent-success-soft'] : 'transparent',
    color: formData.type === 'income' ? tokens['accent-success'] : tokens['text-muted'],
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    fontSize: '1rem',
  }}
>
  Venit
</button>
```

## Why This Matters
Using semantic colors for the Tip toggle ensures:
1. **Visual consistency**: Expense/Income colors match throughout the app
2. **User clarity**: Users immediately understand which type they're selecting
3. **Design system compliance**: Follows the rule that income = green, expense = red

## Status
⚠️ **MANUAL FIX REQUIRED** - The automated migration could not replace these due to duplicate modal forms in the file. Please apply the fix manually to both the Add Modal and Edit Modal sections.
