# Requirements Document

## Introduction

Această funcționalitate înlocuiește dialogul nativ `window.confirm` cu un modal de confirmare custom pentru ștergerea bugetelor în aplicația Sasha Finance. Modalul va oferi o experiență utilizator îmbunătățită, consistentă cu designul aplicației, și va afișa informații clare despre bugetul care urmează să fie șters.

## Glossary

- **Budget_Delete_Modal**: Componenta modal custom care solicită confirmarea utilizatorului înainte de ștergerea unui buget
- **Budgets_Component**: Componenta React din `frontend/src/features/budgets/Budgets.tsx` care gestionează afișarea și operațiunile asupra bugetelor
- **Modal_Component**: Componenta UI reutilizabilă din `frontend/src/components/ui/Modal.tsx`
- **Button_Component**: Componenta UI reutilizabilă din `frontend/src/components/ui/Button.tsx`
- **Budget_Entity**: Entitatea care conține informații despre un buget (id, month, year, totalLimit, categories)
- **Delete_Mutation**: Operația React Query care execută ștergerea bugetului prin API

## Requirements

### Requirement 1: Modal State Management

**User Story:** Ca dezvoltator, vreau să gestionez starea modalului de confirmare ștergere, astfel încât să pot controla vizibilitatea și datele afișate.

#### Acceptance Criteria

1. THE Budgets_Component SHALL maintain a boolean state `isDeleteModalOpen` to control modal visibility
2. THE Budgets_Component SHALL maintain a state `budgetToDelete` containing the Budget_Entity details (id, month, year, totalLimit)
3. WHEN `isDeleteModalOpen` is true, THE Budget_Delete_Modal SHALL be visible
4. WHEN `isDeleteModalOpen` is false, THE Budget_Delete_Modal SHALL be hidden
5. WHEN a budget is selected for deletion, THE Budgets_Component SHALL store the complete Budget_Entity information in `budgetToDelete`

### Requirement 2: Delete Button Interaction

**User Story:** Ca utilizator, vreau să dau click pe butonul de ștergere pentru a deschide modalul de confirmare, astfel încât să pot vedea detaliile înainte de a confirma ștergerea.

#### Acceptance Criteria

1. WHEN the user clicks the delete button (Trash2 icon) on a budget card, THE Budgets_Component SHALL open the Budget_Delete_Modal
2. WHEN the delete button is clicked, THE Budgets_Component SHALL set `isDeleteModalOpen` to true
3. WHEN the delete button is clicked, THE Budgets_Component SHALL populate `budgetToDelete` with the selected Budget_Entity
4. THE Budgets_Component SHALL NOT invoke `window.confirm` when the delete button is clicked
5. THE Budgets_Component SHALL NOT execute Delete_Mutation immediately when the delete button is clicked

### Requirement 3: Modal Content Display

**User Story:** Ca utilizator, vreau să văd informații clare despre bugetul care urmează să fie șters, astfel încât să pot lua o decizie informată.

#### Acceptance Criteria

1. THE Budget_Delete_Modal SHALL display the title "Șterge Buget"
2. THE Budget_Delete_Modal SHALL display an AlertTriangle icon from lucide-react
3. THE Budget_Delete_Modal SHALL display the confirmation message "Sigur vrei să ștergi acest buget?"
4. THE Budget_Delete_Modal SHALL display the budget month name in Romanian (e.g., "Ianuarie", "Februarie")
5. THE Budget_Delete_Modal SHALL display the budget year
6. THE Budget_Delete_Modal SHALL display the budget total limit formatted as "X.XX RON"
7. THE Budget_Delete_Modal SHALL use warning background color `rgba(245, 158, 11, 0.1)` for the alert section
8. THE Budget_Delete_Modal SHALL use `tokens['text-primary']` for primary text
9. THE Budget_Delete_Modal SHALL use `tokens['text-muted']` for secondary text

### Requirement 4: Modal Action Buttons

**User Story:** Ca utilizator, vreau să pot anula sau confirma ștergerea bugetului, astfel încât să am control complet asupra acțiunii.

#### Acceptance Criteria

1. THE Budget_Delete_Modal SHALL display a "Anulează" button with `variant="ghost"`
2. THE Budget_Delete_Modal SHALL display a "Șterge Buget" button with `variant="danger"`
3. WHEN the user clicks "Anulează", THE Budget_Delete_Modal SHALL close without executing Delete_Mutation
4. WHEN the user clicks the X close button, THE Budget_Delete_Modal SHALL close without executing Delete_Mutation
5. WHEN the user clicks "Șterge Buget", THE Budgets_Component SHALL execute Delete_Mutation with `budgetToDelete.id`
6. WHEN the user clicks "Șterge Buget", THE Budget_Delete_Modal SHALL close after mutation execution
7. WHEN Delete_Mutation is pending, THE "Șterge Buget" button SHALL be disabled
8. WHEN Delete_Mutation is pending, THE "Șterge Buget" button SHALL display "Se șterge..." text

### Requirement 5: Modal Close Behavior

**User Story:** Ca utilizator, vreau să pot închide modalul în mai multe moduri, astfel încât să am o experiență flexibilă.

#### Acceptance Criteria

1. WHEN the user clicks "Anulează", THE Budgets_Component SHALL set `isDeleteModalOpen` to false
2. WHEN the user clicks the X close button, THE Budgets_Component SHALL set `isDeleteModalOpen` to false
3. WHEN the user clicks outside the modal overlay, THE Budgets_Component SHALL set `isDeleteModalOpen` to false
4. WHEN the modal closes, THE Budgets_Component SHALL reset `budgetToDelete` to null
5. WHEN Delete_Mutation succeeds, THE Budgets_Component SHALL set `isDeleteModalOpen` to false

### Requirement 6: Visual Design Consistency

**User Story:** Ca utilizator, vreau ca modalul de confirmare să aibă un design consistent cu restul aplicației, astfel încât să am o experiență vizuală coerentă.

#### Acceptance Criteria

1. THE Budget_Delete_Modal SHALL use Modal_Component from `frontend/src/components/ui/Modal.tsx`
2. THE Budget_Delete_Modal SHALL use Button_Component from `frontend/src/components/ui/Button.tsx`
3. THE Budget_Delete_Modal SHALL use `tokens['bg-elevated']` for modal background
4. THE Budget_Delete_Modal SHALL use `tokens['border-default']` for borders
5. THE Budget_Delete_Modal SHALL use `tokens['accent-danger']` (#FF5A6B) for the danger button
6. THE Budget_Delete_Modal SHALL display smooth open/close animations (provided by Modal_Component)
7. THE Budget_Delete_Modal SHALL use AlertTriangle icon with size 24 and warning color `#F59E0B`

### Requirement 7: Error Handling

**User Story:** Ca utilizator, vreau să fiu informat dacă ștergerea bugetului eșuează, astfel încât să știu că trebuie să încerc din nou.

#### Acceptance Criteria

1. WHEN Delete_Mutation fails, THE Budget_Delete_Modal SHALL remain open
2. WHEN Delete_Mutation fails, THE Budget_Delete_Modal SHALL display an error message
3. THE error message SHALL use `tokens['accent-danger']` color
4. THE error message SHALL display "Eroare la ștergerea bugetului. Încearcă din nou."
5. WHEN Delete_Mutation fails, THE user SHALL be able to retry the deletion or cancel

### Requirement 8: Accessibility

**User Story:** Ca utilizator cu nevoi speciale de accesibilitate, vreau ca modalul să fie utilizabil cu tastatura și screen readers, astfel încât să pot șterge bugete independent.

#### Acceptance Criteria

1. WHEN the Budget_Delete_Modal is open, THE focus SHALL be trapped within the modal
2. WHEN the user presses Escape key, THE Budget_Delete_Modal SHALL close without executing Delete_Mutation
3. THE "Șterge Buget" button SHALL be focusable via keyboard navigation
4. THE "Anulează" button SHALL be focusable via keyboard navigation
5. THE AlertTriangle icon SHALL have appropriate aria-label "Avertizare"

### Requirement 9: Code Refactoring

**User Story:** Ca dezvoltator, vreau să înlocuiesc complet `window.confirm` cu modalul custom, astfel încât codul să fie mai ușor de întreținut și testat.

#### Acceptance Criteria

1. THE Budgets_Component SHALL remove the `window.confirm` call from line 336
2. THE `handleDeleteClick` function SHALL be refactored to open Budget_Delete_Modal instead of calling `window.confirm`
3. THE Budgets_Component SHALL create a new function `handleConfirmDelete` that executes Delete_Mutation
4. THE code SHALL NOT contain any references to `window.confirm` for budget deletion
5. THE refactored code SHALL maintain the same deletion functionality as the original implementation

### Requirement 10: Month Name Localization

**User Story:** Ca utilizator român, vreau să văd numele lunii în limba română în modalul de confirmare, astfel încât să înțeleg ușor ce buget urmează să fie șters.

#### Acceptance Criteria

1. THE Budget_Delete_Modal SHALL use the existing `getMonthName` helper function to display month names
2. THE month names SHALL be displayed in Romanian (Ianuarie, Februarie, Martie, etc.)
3. WHEN `budgetToDelete.month` is 1, THE Budget_Delete_Modal SHALL display "Ianuarie"
4. WHEN `budgetToDelete.month` is 12, THE Budget_Delete_Modal SHALL display "Decembrie"
5. THE month name SHALL be displayed with proper capitalization

