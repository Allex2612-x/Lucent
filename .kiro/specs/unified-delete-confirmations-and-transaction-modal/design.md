# Design Document: Unified Delete Confirmations and Transaction Modal

## Overview

This design document specifies the technical implementation for creating two reusable modal components that will unify the user experience across the Sasha Finance application:

1. **DeleteConfirmationModal**: A generic, reusable confirmation dialog that replaces all native `window.confirm()` calls with beautiful, consistent custom modals
2. **AddTransactionModal**: A unified transaction creation modal that consolidates duplicate implementations from Dashboard and Transactions pages

The implementation follows the Electric Blue design system (#3B82F6) with Romanian language throughout, ensuring visual consistency and maintainability.

### Goals

- **Consistency**: Provide identical user experience for delete operations and transaction creation across all pages
- **Reusability**: Create generic components that can be easily integrated into any page
- **Maintainability**: Eliminate code duplication and centralize modal logic
- **User Experience**: Replace jarring native browser dialogs with polished custom modals
- **Design System Compliance**: Follow established design tokens and patterns

### Non-Goals

- Modifying the underlying business logic for deletions or transaction creation
- Changing API contracts or backend behavior
- Adding new features beyond unification
- Modifying existing validation rules

## Architecture

### Component Structure

```
frontend/src/components/
├── ui/
│   ├── Modal.tsx                    (existing - base modal)
│   ├── Button.tsx                   (existing - button component)
│   ├── Input.tsx                    (existing - input component)
│   ├── Select.tsx                   (existing - select component)
│   ├── DeleteConfirmationModal.tsx  (new - generic delete confirmation)
│   └── AddTransactionModal.tsx      (new - unified transaction modal)
```

### Integration Points

The new components will be integrated into the following pages:

1. **Transactions Page** (`frontend/src/features/transactions/Transactions.tsx`)
   - Individual transaction deletion
   - Bulk transaction deletion
   - Transaction creation

2. **Dashboard Page** (`frontend/src/features/dashboard/Dashboard.tsx`)
   - Transaction creation

3. **Categories Page** (`frontend/src/features/categories/Categories.tsx`)
   - Category deletion

4. **Budgets Page** (`frontend/src/features/budgets/Budgets.tsx`)
   - Budget deletion

### Data Flow

#### DeleteConfirmationModal Flow
```
User clicks delete → Page opens DeleteConfirmationModal with item details
                   → User reviews details in modal
                   → User clicks "Anulează" → Modal closes, no action
                   → User clicks danger button → onConfirm callback executes
                                               → Page performs deletion
                                               → Toast notification shown
                                               → React Query cache invalidated
```

#### AddTransactionModal Flow
```
User clicks "Adaugă Tranzacție" → Page opens AddTransactionModal
                                → User fills form fields
                                → User clicks "Salvează" → Validation runs
                                                        → If valid: API call
                                                        → onSuccess callback
                                                        → Toast notification
                                                        → Modal closes
                                                        → Cache invalidated
                                → User clicks "Anulează" → Modal closes, no action
```

## Components and Interfaces

### 1. DeleteConfirmationModal Component

#### Props Interface

```typescript
interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemDetails?: React.ReactNode;
  warningText?: string;
  confirmButtonText: string;
  confirmButtonVariant?: 'danger' | 'primary';
  isLoading?: boolean;
}
```

#### Props Description

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isOpen` | boolean | Yes | - | Controls modal visibility |
| `onClose` | () => void | Yes | - | Callback when user cancels or closes modal |
| `onConfirm` | () => void | Yes | - | Callback when user confirms deletion |
| `title` | string | Yes | - | Modal header title (e.g., "Șterge Tranzacție") |
| `message` | string | Yes | - | Main confirmation message |
| `itemDetails` | ReactNode | No | undefined | Custom content showing item details |
| `warningText` | string | No | undefined | Warning message displayed below details |
| `confirmButtonText` | string | Yes | - | Text for confirmation button |
| `confirmButtonVariant` | 'danger' \| 'primary' | No | 'danger' | Button style variant |
| `isLoading` | boolean | No | false | Shows loading state on confirm button |

#### Component Structure

```tsx
export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemDetails,
  warningText,
  confirmButtonText,
  confirmButtonVariant = 'danger',
  isLoading = false,
}: DeleteConfirmationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Anulează
          </Button>
          <Button
            variant={confirmButtonVariant}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {confirmButtonText}
          </Button>
        </div>
      }
    >
      {/* Modal body content */}
    </Modal>
  );
}
```

#### Visual Design

- **Header**: AlertTriangle icon (lucide-react) + title
- **Body**: 
  - Confirmation message in primary text color
  - Item details section (if provided) with elevated background
  - Warning text (if provided) with warning color and icon
- **Footer**: "Anulează" (ghost) + confirm button (danger/primary)
- **Spacing**: Consistent 1rem padding, 0.75rem gaps
- **Colors**: Follow design tokens from `colors.ts`

#### Usage Examples

**Individual Transaction Deletion:**
```tsx
<DeleteConfirmationModal
  isOpen={isDeleteModalOpen}
  onClose={() => setIsDeleteModalOpen(false)}
  onConfirm={handleDeleteTransaction}
  title="Șterge Tranzacție"
  message="Sigur vrei să ștergi această tranzacție?"
  itemDetails={
    <div>
      <p><strong>Descriere:</strong> {transaction.description}</p>
      <p><strong>Sumă:</strong> {transaction.amount} RON</p>
      <p><strong>Categorie:</strong> {category.name}</p>
      <p><strong>Dată:</strong> {formatDate(transaction.date)}</p>
    </div>
  }
  confirmButtonText="Șterge Tranzacție"
  isLoading={deleteMutation.isPending}
/>
```

**Bulk Transaction Deletion:**
```tsx
<DeleteConfirmationModal
  isOpen={isBulkDeleteModalOpen}
  onClose={() => setIsBulkDeleteModalOpen(false)}
  onConfirm={handleBulkDelete}
  title="Șterge Tranzacții"
  message={`Sigur vrei să ștergi ${selectedIds.size} tranzacții?`}
  itemDetails={
    <div>
      <p><strong>Număr tranzacții:</strong> {selectedIds.size}</p>
      <p><strong>Sumă totală:</strong> {totalAmount.toFixed(2)} RON</p>
    </div>
  }
  confirmButtonText="Șterge Toate"
  isLoading={bulkDeleteMutation.isPending}
/>
```

**Category Deletion:**
```tsx
<DeleteConfirmationModal
  isOpen={isDeleteModalOpen}
  onClose={() => setIsDeleteModalOpen(false)}
  onConfirm={handleDeleteCategory}
  title="Șterge Categorie"
  message="Sigur vrei să ștergi această categorie?"
  itemDetails={
    <div>
      <p><strong>Nume:</strong> {category.name}</p>
      <p><strong>Tip:</strong> {category.type === 'income' ? 'Venit' : 'Cheltuială'}</p>
    </div>
  }
  warningText="Tranzacțiile asociate vor rămâne fără categorie"
  confirmButtonText="Șterge Categorie"
  isLoading={deleteMutation.isPending}
/>
```

**Budget Deletion:**
```tsx
<DeleteConfirmationModal
  isOpen={isDeleteModalOpen}
  onClose={() => setIsDeleteModalOpen(false)}
  onConfirm={handleDeleteBudget}
  title="Șterge Buget"
  message="Sigur vrei să ștergi acest buget?"
  itemDetails={
    <div>
      <p><strong>Categorie:</strong> {budget.category.name}</p>
      <p><strong>Sumă:</strong> {budget.totalLimit} RON</p>
      <p><strong>Perioadă:</strong> {getMonthName(budget.month)} {budget.year}</p>
    </div>
  }
  confirmButtonText="Șterge Buget"
  isLoading={deleteMutation.isPending}
/>
```

### 2. AddTransactionModal Component

#### Props Interface

```typescript
interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
```

#### Props Description

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | boolean | Yes | Controls modal visibility |
| `onClose` | () => void | Yes | Callback when user cancels or closes modal |
| `onSuccess` | () => void | Yes | Callback when transaction is successfully created |

#### Internal State

```typescript
interface TransactionFormData {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  date: string; // ISO date string (YYYY-MM-DD)
}

interface FormErrors {
  description?: string;
  amount?: string;
  categoryId?: string;
  date?: string;
}
```

#### Component Structure

```tsx
export function AddTransactionModal({
  isOpen,
  onClose,
  onSuccess,
}: AddTransactionModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<TransactionFormData>({
    description: '',
    amount: 0,
    type: 'expense',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Fetch categories
  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getAll(),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: TransactionData) => transactionsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      toast.success('Tranzacție adăugată cu succes!');
      onSuccess();
      handleClose();
    },
    onError: () => {
      toast.error('Eroare la adăugarea tranzacției');
    },
  });

  // Validation, handlers, etc.
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Adaugă Tranzacție"
      footer={/* buttons */}
    >
      {/* Form fields */}
    </Modal>
  );
}
```

#### Validation Rules

| Field | Validation Rules | Error Message |
|-------|-----------------|---------------|
| description | Required, min 2 characters | "Descrierea trebuie să aibă cel puțin 2 caractere" |
| amount | Required, > 0 | "Suma trebuie să fie mai mare decât 0" |
| categoryId | Required | "Selectează o categorie" |
| date | Required, valid date | "Selectează o dată validă" |

#### Form Fields

1. **Description Input**
   - Type: text
   - Placeholder: "Descriere tranzacție"
   - Validation: Required, min 2 chars
   - Autocomplete suggestions (optional enhancement)

2. **Amount Input**
   - Type: number
   - Placeholder: "0.00"
   - Suffix: "RON"
   - Validation: Required, > 0
   - Step: 0.01

3. **Type Select**
   - Options: 
     - "Cheltuială" (expense)
     - "Venit" (income)
   - Default: "expense"
   - Affects category filtering

4. **Category Select**
   - Options: Filtered by transaction type
   - Placeholder: "Selectează categoria"
   - Validation: Required
   - Display: Icon + Name

5. **Date Input**
   - Type: date
   - Default: Today
   - Validation: Required, valid date

#### Visual Design

- **Header**: "Adaugă Tranzacție" title
- **Body**: Form with 5 fields in vertical layout
- **Footer**: "Anulează" (ghost) + "Salvează" (primary)
- **Spacing**: 1rem between fields, 0.75rem button gap
- **Colors**: Follow design tokens
- **Loading State**: Disable form and show spinner on submit button

#### Usage Examples

**Dashboard Integration:**
```tsx
function Dashboard() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleTransactionSuccess = () => {
    // Modal handles cache invalidation internally
    // Just close the modal
    setIsAddModalOpen(false);
  };

  return (
    <>
      <Button onClick={() => setIsAddModalOpen(true)}>
        Adaugă Tranzacție
      </Button>
      
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleTransactionSuccess}
      />
    </>
  );
}
```

**Transactions Page Integration:**
```tsx
function Transactions() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleTransactionSuccess = () => {
    setIsAddModalOpen(false);
    // Modal handles cache invalidation internally
  };

  return (
    <>
      <Button onClick={() => setIsAddModalOpen(true)}>
        <Plus size={18} />
        Adaugă Tranzacție
      </Button>
      
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleTransactionSuccess}
      />
    </>
  );
}
```

## Data Models

### TransactionData (existing)

```typescript
interface TransactionData {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  date: string; // ISO date string
}
```

### Category (existing)

```typescript
interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  isDefault: boolean;
}
```

### Budget (existing)

```typescript
interface Budget {
  id: string;
  month: number;
  year: number;
  totalLimit: number;
  categories: BudgetCategory[];
}
```

## Error Handling

### DeleteConfirmationModal Error Handling

1. **Network Errors**: Handled by parent component's mutation error callback
2. **Loading States**: `isLoading` prop disables buttons and shows loading indicator
3. **User Cancellation**: `onClose` callback allows clean cancellation

### AddTransactionModal Error Handling

1. **Validation Errors**: 
   - Display inline error messages below each field
   - Prevent submission until all errors are resolved
   - Use red text color (`tokens['accent-danger']`)

2. **API Errors**:
   - Show toast notification: "Eroare la adăugarea tranzacției"
   - Keep modal open so user can retry
   - Log error to console for debugging

3. **Network Errors**:
   - Handled by React Query mutation
   - Show toast notification
   - Allow user to retry

### Error Display Pattern

```tsx
{errors.amount && (
  <p style={{ 
    color: tokens['accent-danger'], 
    fontSize: '0.875rem',
    marginTop: '0.25rem' 
  }}>
    {errors.amount}
  </p>
)}
```

## Testing Strategy

### Unit Tests

Unit tests will verify component behavior, validation logic, and user interactions using React Testing Library and Vitest.

#### DeleteConfirmationModal Unit Tests

1. **Rendering Tests**
   - Renders with required props
   - Displays title correctly
   - Displays message correctly
   - Renders item details when provided
   - Renders warning text when provided
   - Does not render when isOpen is false

2. **Interaction Tests**
   - Calls onClose when "Anulează" is clicked
   - Calls onConfirm when confirm button is clicked
   - Disables buttons when isLoading is true
   - Closes modal when clicking outside (via Modal component)

3. **Styling Tests**
   - Uses danger variant by default for confirm button
   - Uses custom variant when specified
   - Applies correct design tokens

#### AddTransactionModal Unit Tests

1. **Rendering Tests**
   - Renders with all form fields
   - Displays correct default values
   - Filters categories by transaction type
   - Does not render when isOpen is false

2. **Validation Tests**
   - Shows error for empty description
   - Shows error for description < 2 characters
   - Shows error for amount <= 0
   - Shows error for missing category
   - Shows error for invalid date
   - Prevents submission with validation errors

3. **Interaction Tests**
   - Updates form data on field changes
   - Filters categories when type changes
   - Calls onClose when "Anulează" is clicked
   - Submits form when "Salvează" is clicked with valid data
   - Calls onSuccess after successful creation
   - Shows toast on success
   - Shows toast on error

4. **Integration Tests**
   - Creates transaction via API
   - Invalidates React Query cache
   - Closes modal after success

### Integration Tests

Integration tests will verify the modals work correctly within the context of actual pages.

#### Page Integration Tests

1. **Transactions Page**
   - Opens delete modal for individual transaction
   - Opens delete modal for bulk transactions
   - Opens add transaction modal
   - Deletes transaction successfully
   - Creates transaction successfully
   - Updates transaction list after operations

2. **Dashboard Page**
   - Opens add transaction modal
   - Creates transaction successfully
   - Updates statistics after creation

3. **Categories Page**
   - Opens delete modal for category
   - Deletes category successfully
   - Shows warning about orphaned transactions

4. **Budgets Page**
   - Opens delete modal for budget
   - Deletes budget successfully
   - Updates budget list after deletion

### Test File Structure

```
frontend/src/components/ui/__tests__/
├── DeleteConfirmationModal.test.tsx
└── AddTransactionModal.test.tsx

frontend/src/features/__tests__/
├── transactions-integration.test.tsx
├── dashboard-integration.test.tsx
├── categories-integration.test.tsx
└── budgets-integration.test.tsx
```

### Test Coverage Goals

- **Component Coverage**: 90%+ line coverage for both modal components
- **Integration Coverage**: All critical user flows tested
- **Edge Cases**: Empty states, error states, loading states

### Example Test Cases

**DeleteConfirmationModal Test:**
```typescript
describe('DeleteConfirmationModal', () => {
  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <DeleteConfirmationModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={onConfirm}
        title="Delete Item"
        message="Are you sure?"
        confirmButtonText="Delete"
      />
    );
    
    fireEvent.click(screen.getByText('Delete'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
```

**AddTransactionModal Test:**
```typescript
describe('AddTransactionModal', () => {
  it('shows validation error for amount <= 0', async () => {
    render(
      <AddTransactionModal
        isOpen={true}
        onClose={() => {}}
        onSuccess={() => {}}
      />
    );
    
    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '0' } });
    fireEvent.click(screen.getByText('Salvează'));
    
    expect(await screen.findByText('Suma trebuie să fie mai mare decât 0')).toBeInTheDocument();
  });
});
```

## Implementation Plan

### Phase 1: Create DeleteConfirmationModal Component

1. Create `frontend/src/components/ui/DeleteConfirmationModal.tsx`
2. Implement component with all props and styling
3. Write unit tests
4. Export from `frontend/src/components/ui/index.ts`

### Phase 2: Create AddTransactionModal Component

1. Create `frontend/src/components/ui/AddTransactionModal.tsx`
2. Implement form with validation
3. Integrate with React Query
4. Write unit tests
5. Export from `frontend/src/components/ui/index.ts`

### Phase 3: Integrate DeleteConfirmationModal

1. **Transactions Page**
   - Replace individual transaction `window.confirm` with DeleteConfirmationModal
   - Replace bulk delete `window.confirm` with DeleteConfirmationModal
   - Test both flows

2. **Categories Page**
   - Replace `window.confirm` with DeleteConfirmationModal
   - Add category details display
   - Add warning text
   - Test deletion flow

3. **Budgets Page**
   - Replace `window.confirm` with DeleteConfirmationModal
   - Add budget details display
   - Test deletion flow

### Phase 4: Integrate AddTransactionModal

1. **Dashboard Page**
   - Remove duplicate modal implementation
   - Import and use AddTransactionModal
   - Update success callback
   - Test transaction creation

2. **Transactions Page**
   - Remove duplicate modal implementation
   - Import and use AddTransactionModal
   - Update success callback
   - Test transaction creation

### Phase 5: Testing and Validation

1. Run all unit tests
2. Run all integration tests
3. Manual testing of all flows
4. Verify design token usage
5. Verify Romanian language throughout
6. Check accessibility (keyboard navigation, focus management)

### Phase 6: Cleanup

1. Remove old modal implementations
2. Remove unused code
3. Update documentation
4. Code review

## Migration Strategy

### Removing window.confirm Calls

**Before:**
```typescript
const handleDelete = (id: string) => {
  if (window.confirm('Sigur doriți să ștergeți această categorie?')) {
    deleteMutation.mutate(id);
  }
};
```

**After:**
```typescript
const [deleteModalOpen, setDeleteModalOpen] = useState(false);
const [itemToDelete, setItemToDelete] = useState<string | null>(null);

const handleDeleteClick = (id: string) => {
  setItemToDelete(id);
  setDeleteModalOpen(true);
};

const handleConfirmDelete = () => {
  if (itemToDelete) {
    deleteMutation.mutate(itemToDelete);
  }
  setDeleteModalOpen(false);
  setItemToDelete(null);
};

// In JSX:
<DeleteConfirmationModal
  isOpen={deleteModalOpen}
  onClose={() => {
    setDeleteModalOpen(false);
    setItemToDelete(null);
  }}
  onConfirm={handleConfirmDelete}
  title="Șterge Categorie"
  message="Sigur vrei să ștergi această categorie?"
  confirmButtonText="Șterge Categorie"
/>
```

### Consolidating Transaction Modals

**Dashboard Before:**
```typescript
// Duplicate modal implementation in Dashboard.tsx
const [isAddModalOpen, setIsAddModalOpen] = useState(false);
const [formData, setFormData] = useState<TransactionData>({...});
// ... form handling logic ...
// ... Modal JSX ...
```

**Dashboard After:**
```typescript
import { AddTransactionModal } from '../../components/ui';

const [isAddModalOpen, setIsAddModalOpen] = useState(false);

<AddTransactionModal
  isOpen={isAddModalOpen}
  onClose={() => setIsAddModalOpen(false)}
  onSuccess={() => setIsAddModalOpen(false)}
/>
```

**Transactions Before:**
```typescript
// Duplicate modal implementation in Transactions.tsx
const [isAddModalOpen, setIsAddModalOpen] = useState(false);
const [formData, setFormData] = useState<TransactionData>({...});
// ... form handling logic ...
// ... Modal JSX ...
```

**Transactions After:**
```typescript
import { AddTransactionModal } from '../../components/ui';

const [isAddModalOpen, setIsAddModalOpen] = useState(false);

<AddTransactionModal
  isOpen={isAddModalOpen}
  onClose={() => setIsAddModalOpen(false)}
  onSuccess={() => setIsAddModalOpen(false)}
/>
```

## Design Token Usage

All components will use design tokens from `frontend/src/styles/colors.ts`:

### Colors

```typescript
import { tokens } from '../../styles/colors';

// Backgrounds
backgroundColor: tokens['bg-elevated']  // Modal background
backgroundColor: tokens['bg-surface']   // Item details section

// Text
color: tokens['text-primary']   // Primary text
color: tokens['text-muted']     // Labels, descriptions
color: tokens['text-secondary'] // Secondary information

// Accents
color: tokens['accent-primary']  // Primary buttons, links
color: tokens['accent-danger']   // Delete buttons, error text
color: tokens['accent-warning']  // Warning text and icons
color: tokens['accent-success']  // Success states (income)

// Borders
border: `1px solid ${tokens['border-default']}`
```

### Typography

- **Headings**: 1.25rem, font-weight 600
- **Body Text**: 1rem, font-weight 400
- **Labels**: 0.875rem, font-weight 500
- **Error Text**: 0.875rem, font-weight 400

### Spacing

- **Modal Padding**: 1.5rem
- **Field Spacing**: 1rem vertical gap
- **Button Gap**: 0.75rem
- **Section Gap**: 1.25rem

### Border Radius

- **Modal**: 0.75rem
- **Buttons**: 0.5rem
- **Inputs**: 0.5rem
- **Item Details Section**: 0.5rem

## Accessibility Considerations

### Keyboard Navigation

- Modal opens: Focus moves to first interactive element
- Tab: Cycles through interactive elements
- Shift+Tab: Reverse cycle
- Escape: Closes modal (calls onClose)
- Enter: Submits form (AddTransactionModal) or confirms (DeleteConfirmationModal)

### Screen Readers

- Modal has `role="dialog"` and `aria-modal="true"`
- Modal title has `aria-labelledby`
- Form fields have proper `aria-label` or associated `<label>` elements
- Error messages have `aria-live="polite"` for announcements
- Loading states announced with `aria-busy="true"`

### Focus Management

- Focus trapped within modal when open
- Focus returns to trigger element when modal closes
- First focusable element receives focus on open
- Confirm button is default action (Enter key)

### Color Contrast

All text meets WCAG AA standards:
- Primary text on elevated background: 11.8:1 (AAA)
- Muted text on elevated background: 5.2:1 (AA)
- Danger button text on danger background: 6.5:1 (AA)
- Primary button text on primary background: 6.8:1 (AA)

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Components are only loaded when needed (already tree-shaken)
2. **Memoization**: Use `React.memo` for modal components if re-renders are frequent
3. **Query Caching**: React Query handles caching for categories
4. **Debouncing**: Not needed for these modals (simple forms)

### Bundle Size Impact

- DeleteConfirmationModal: ~2KB (gzipped)
- AddTransactionModal: ~4KB (gzipped)
- Total impact: ~6KB additional bundle size
- Offset by removing duplicate code: ~8KB saved
- **Net result**: ~2KB bundle size reduction

## Security Considerations

### Input Validation

- All form inputs validated on client side
- Server-side validation remains unchanged
- No XSS vulnerabilities (React escapes by default)
- No SQL injection (using Prisma ORM)

### Authorization

- Modal components do not handle authorization
- Authorization checked by API endpoints
- Mutations will fail if user lacks permissions
- Error messages displayed via toast notifications

## Rollback Plan

If issues are discovered after deployment:

1. **Immediate Rollback**: Revert to previous commit
2. **Partial Rollback**: Keep new components but restore old implementations
3. **Feature Flag**: Add feature flag to toggle between old and new modals
4. **Gradual Rollout**: Deploy to one page at a time

## Success Metrics

### Quantitative Metrics

- **Code Reduction**: Remove ~200 lines of duplicate code
- **Bundle Size**: Reduce by ~2KB (gzipped)
- **Test Coverage**: Achieve 90%+ coverage for new components
- **Performance**: No regression in page load times

### Qualitative Metrics

- **User Experience**: Consistent modal appearance across all pages
- **Developer Experience**: Easier to add new delete confirmations
- **Maintainability**: Single source of truth for modal logic
- **Design Consistency**: All modals follow design system

## Future Enhancements

### Potential Improvements (Out of Scope)

1. **Animation**: Add smooth open/close animations
2. **Confirmation Input**: Require typing "DELETE" for dangerous operations
3. **Undo Functionality**: Add "Undo" button in toast notifications
4. **Batch Operations**: Extend AddTransactionModal for bulk creation
5. **Templates**: Save transaction templates for quick entry
6. **Keyboard Shortcuts**: Add Ctrl+N for new transaction
7. **Accessibility**: Add high contrast mode support

## Appendix

### Related Documentation

- [Design Tokens Documentation](../../frontend/DESIGN_TOKENS.md)
- [Modal Component Documentation](../../frontend/src/components/ui/Modal.tsx)
- [Button Component Documentation](../../frontend/src/components/ui/Button.tsx)
- [Requirements Document](.kiro/specs/unified-delete-confirmations-and-transaction-modal/requirements.md)

### Dependencies

- React 18+
- React Query (TanStack Query)
- Lucide React (icons)
- Sonner (toast notifications)
- Existing UI components (Modal, Button, Input, Select)

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Romanian Language Reference

| English | Romanian |
|---------|----------|
| Delete | Șterge |
| Cancel | Anulează |
| Save | Salvează |
| Transaction | Tranzacție |
| Category | Categorie |
| Budget | Buget |
| Description | Descriere |
| Amount | Sumă |
| Date | Dată |
| Income | Venit |
| Expense | Cheltuială |
| Are you sure? | Sigur vrei? |
| Delete All | Șterge Toate |
