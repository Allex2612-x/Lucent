import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { BudgetWarningModal, BudgetWarning } from './BudgetWarningModal';
import { transactionsService, TransactionData, RecurringFrequency } from '../../services/transactions.service';
import { categoriesService } from '../../services/categories.service';
import { tokens } from '../../styles/colors';

export interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TransactionFormData {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  date: string;
  isRecurring: boolean;
  frequency?: RecurringFrequency;
  repetitionCount?: number;
}

interface FormErrors {
  description?: string;
  amount?: string;
  categoryId?: string;
  date?: string;
  frequency?: string;
  repetitionCount?: string;
}

const DESCRIPTION_SUGGESTIONS = [
  'Cumpărături Lidl',
  'Cumpărături Kaufland',
  'Salariu',
  'Factură curent',
  'Factură gaz',
  'Factură internet',
  'Benzină',
  'Restaurant',
  'Cafenea',
  'Transport public',
];

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
    isRecurring: false,
    frequency: undefined,
    repetitionCount: undefined,
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [budgetWarning, setBudgetWarning] = useState<BudgetWarning | null>(null);
  const [showBudgetWarning, setShowBudgetWarning] = useState(false);

  // Fetch categories
  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getAll(),
  });

  const categories = categoriesResponse?.data?.data || [];

  // Filter categories by transaction type
  const filteredCategories = categories.filter(
    (cat: any) => cat.type === formData.type
  );

  // Create mutation
  const createMutation = useMutation({
    mutationFn: ({ data, force }: { data: TransactionData; force?: boolean }) => 
      transactionsService.create(data, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Tranzacție adăugată cu succes!');
      onSuccess();
      handleClose();
    },
    onError: (error: any) => {
      // Handle budget warning (409 Conflict)
      if (error.response?.status === 409) {
        setBudgetWarning(error.response.data.warning);
        setShowBudgetWarning(true);
        return;
      }
      
      // Handle date validation error (400)
      if (error.response?.status === 400 && error.response.data.error === 'DateValidationError') {
        setErrors({ ...errors, date: 'Nu poți adăuga tranzacții cu date din viitor' });
        return;
      }
      
      // Handle other validation errors
      if (error.response?.status === 400 && error.response.data.details) {
        const newErrors: FormErrors = {};
        error.response.data.details.forEach((detail: any) => {
          newErrors[detail.field as keyof FormErrors] = detail.message;
        });
        setErrors(newErrors);
        return;
      }
      
      // Generic error
      toast.error('Eroare la adăugarea tranzacției');
    },
  });

  // Validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.description || formData.description.trim().length < 2) {
      newErrors.description = 'Descrierea trebuie să aibă cel puțin 2 caractere';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Suma trebuie să fie mai mare decât 0';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Selectează o categorie';
    }

    if (!formData.date) {
      newErrors.date = 'Selectează o dată validă';
    }

    // Recurring transaction validation
    if (formData.isRecurring) {
      if (!formData.frequency) {
        newErrors.frequency = 'Selectează frecvența';
      }
      
      if (!formData.repetitionCount) {
        newErrors.repetitionCount = 'Introdu numărul de repetări';
      } else if (formData.repetitionCount < 1) {
        newErrors.repetitionCount = 'Numărul de repetări trebuie să fie cel puțin 1';
      } else if (formData.repetitionCount > 365) {
        newErrors.repetitionCount = 'Numărul de repetări nu poate depăși 365';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handlers
  const handleClose = () => {
    setFormData({
      description: '',
      amount: 0,
      type: 'expense',
      categoryId: '',
      date: new Date().toISOString().split('T')[0],
      isRecurring: false,
      frequency: undefined,
      repetitionCount: undefined,
    });
    setErrors({});
    setBudgetWarning(null);
    setShowBudgetWarning(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const transactionData: TransactionData = {
      description: formData.description,
      amount: formData.amount,
      type: formData.type,
      categoryId: formData.categoryId,
      date: formData.date,
    };

    if (formData.isRecurring) {
      transactionData.isRecurring = true;
      transactionData.frequency = formData.frequency;
      transactionData.repetitionCount = formData.repetitionCount;
    }

    createMutation.mutate({ data: transactionData });
  };

  const handleBudgetWarningConfirm = () => {
    setShowBudgetWarning(false);
    
    const transactionData: TransactionData = {
      description: formData.description,
      amount: formData.amount,
      type: formData.type,
      categoryId: formData.categoryId,
      date: formData.date,
    };

    if (formData.isRecurring) {
      transactionData.isRecurring = true;
      transactionData.frequency = formData.frequency;
      transactionData.repetitionCount = formData.repetitionCount;
    }

    createMutation.mutate({ data: transactionData, force: true });
  };

  const handleBudgetWarningCancel = () => {
    setShowBudgetWarning(false);
    setBudgetWarning(null);
  };

  const handleTypeChange = (type: 'income' | 'expense') => {
    setFormData({ ...formData, type, categoryId: '' });
    setErrors({ ...errors, categoryId: undefined });
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Adaugă Tranzacție"
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={createMutation.isPending}
            >
              Anulează
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending 
                ? (formData.isRecurring ? 'Se creează tranzacțiile recurente...' : 'Se salvează...') 
                : 'Salvează'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Description Input */}
            <div>
              <Input
                label="Descriere"
                placeholder="ex: Cumpărături Lidl, Salariu martie, Factură curent..."
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  setErrors({ ...errors, description: undefined });
                }}
                list="description-suggestions"
                disabled={createMutation.isPending}
              />
              <datalist id="description-suggestions">
                {DESCRIPTION_SUGGESTIONS.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
              {errors.description && (
                <p
                  style={{
                    color: tokens['accent-danger'],
                    fontSize: '0.875rem',
                    marginTop: '0.25rem',
                    marginBottom: 0,
                  }}
                >
                  {errors.description}
                </p>
              )}
            </div>

            {/* Amount Input */}
            <div>
              <Input
                label="Sumă"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount || ''}
                onChange={(e) => {
                  setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 });
                  setErrors({ ...errors, amount: undefined });
                }}
                disabled={createMutation.isPending}
              />
              {errors.amount && (
                <p
                  style={{
                    color: tokens['accent-danger'],
                    fontSize: '0.875rem',
                    marginTop: '0.25rem',
                    marginBottom: 0,
                  }}
                >
                  {errors.amount}
                </p>
              )}
            </div>

            {/* Type Select */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  marginBottom: '0.5rem',
                  color: tokens['text-secondary'],
                }}
              >
                Tip
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                  type="button"
                  variant={formData.type === 'expense' ? 'primary' : 'secondary'}
                  onClick={() => handleTypeChange('expense')}
                  style={{ flex: 1 }}
                  disabled={createMutation.isPending}
                >
                  Cheltuială
                </Button>
                <Button
                  type="button"
                  variant={formData.type === 'income' ? 'primary' : 'secondary'}
                  onClick={() => handleTypeChange('income')}
                  style={{ flex: 1 }}
                  disabled={createMutation.isPending}
                >
                  Venit
                </Button>
              </div>
            </div>

            {/* Category Select */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  marginBottom: '0.5rem',
                  color: tokens['text-secondary'],
                }}
              >
                Categorie
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => {
                  setFormData({ ...formData, categoryId: e.target.value });
                  setErrors({ ...errors, categoryId: undefined });
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${errors.categoryId ? tokens['accent-danger'] : tokens['border-default']}`,
                  backgroundColor: tokens['bg-base'],
                  color: tokens['text-primary'],
                  fontSize: '0.95rem',
                }}
                disabled={createMutation.isPending}
              >
                <option value="">Selectează categoria</option>
                {filteredCategories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p
                  style={{
                    color: tokens['accent-danger'],
                    fontSize: '0.875rem',
                    marginTop: '0.25rem',
                    marginBottom: 0,
                  }}
                >
                  {errors.categoryId}
                </p>
              )}
            </div>

            {/* Date Input */}
            <div>
              <Input
                label="Data"
                type="date"
                value={formData.date}
                onChange={(e) => {
                  setFormData({ ...formData, date: e.target.value });
                  setErrors({ ...errors, date: undefined });
                }}
                disabled={createMutation.isPending}
              />
              {errors.date && (
                <p
                  style={{
                    color: tokens['accent-danger'],
                    fontSize: '0.875rem',
                    marginTop: '0.25rem',
                    marginBottom: 0,
                  }}
                >
                  {errors.date}
                </p>
              )}
            </div>

            {/* Recurring Transaction Checkbox */}
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  color: tokens['text-primary'],
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      isRecurring: e.target.checked,
                      frequency: e.target.checked ? formData.frequency : undefined,
                      repetitionCount: e.target.checked ? formData.repetitionCount : undefined,
                    });
                    if (!e.target.checked) {
                      setErrors({ 
                        ...errors, 
                        frequency: undefined, 
                        repetitionCount: undefined 
                      });
                    }
                  }}
                  disabled={createMutation.isPending}
                  style={{ cursor: 'pointer' }}
                />
                Tranzacție recurentă
              </label>
            </div>

            {/* Recurring Transaction Fields */}
            {formData.isRecurring && (
              <>
                {/* Frequency Dropdown */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      marginBottom: '0.5rem',
                      color: tokens['text-secondary'],
                    }}
                  >
                    Frecvență
                  </label>
                  <select
                    value={formData.frequency || ''}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        frequency: e.target.value as RecurringFrequency 
                      });
                      setErrors({ ...errors, frequency: undefined });
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      border: `1px solid ${errors.frequency ? tokens['accent-danger'] : tokens['border-default']}`,
                      backgroundColor: tokens['bg-base'],
                      color: tokens['text-primary'],
                      fontSize: '0.95rem',
                    }}
                    disabled={createMutation.isPending}
                  >
                    <option value="">Selectează frecvența</option>
                    <option value="daily">Zilnic</option>
                    <option value="weekly">Săptămânal</option>
                    <option value="monthly">Lunar</option>
                    <option value="yearly">Anual</option>
                  </select>
                  {errors.frequency && (
                    <p
                      style={{
                        color: tokens['accent-danger'],
                        fontSize: '0.875rem',
                        marginTop: '0.25rem',
                        marginBottom: 0,
                      }}
                    >
                      {errors.frequency}
                    </p>
                  )}
                </div>

                {/* Repetition Count Input */}
                <div>
                  <Input
                    label="Număr de repetări"
                    type="number"
                    min="1"
                    max="365"
                    placeholder="ex: 12"
                    value={formData.repetitionCount || ''}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        repetitionCount: parseInt(e.target.value) || undefined 
                      });
                      setErrors({ ...errors, repetitionCount: undefined });
                    }}
                    disabled={createMutation.isPending}
                  />
                  {errors.repetitionCount && (
                    <p
                      style={{
                        color: tokens['accent-danger'],
                        fontSize: '0.875rem',
                        marginTop: '0.25rem',
                        marginBottom: 0,
                      }}
                    >
                      {errors.repetitionCount}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </form>
      </Modal>

      {/* Budget Warning Modal */}
      <BudgetWarningModal
        isOpen={showBudgetWarning}
        onClose={handleBudgetWarningCancel}
        onConfirm={handleBudgetWarningConfirm}
        warning={budgetWarning}
      />
    </>
  );
}
