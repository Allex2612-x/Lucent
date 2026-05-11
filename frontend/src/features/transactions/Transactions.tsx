import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Trash2, FolderOpen, Download, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { transactionsService, TransactionData } from '../../services/transactions.service';
import { categoriesService } from '../../services/categories.service';
import { tokens } from '../../styles/colors';
import { toast } from 'sonner';
import { Inbox } from 'lucide-react';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  date: string;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
}

interface FilterState {
  dateRange: 'current-month' | 'last-30-days' | 'current-year' | 'custom';
  customStartDate: string;
  customEndDate: string;
  types: Set<'income' | 'expense'>;
  categoryIds: Set<string>;
  minAmount: number;
  maxAmount: number;
}

const ITEMS_PER_PAGE = 20;

const DESCRIPTION_SUGGESTIONS = [
  'Cumpărături Lidl',
  'Cumpărături Kaufland',
  'Salariu martie',
  'Factură curent',
  'Factură gaz',
  'Factură internet',
  'Benzină',
  'Restaurant',
  'Cafenea',
  'Transport public',
];

export function Transactions() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'current-month',
    customStartDate: '',
    customEndDate: '',
    types: new Set(),
    categoryIds: new Set(),
    minAmount: 0,
    maxAmount: 999999,
  });
  const [formData, setFormData] = useState<TransactionData>({
    description: '',
    amount: 0,
    type: 'expense',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Fetch transactions
  const { data: transactionsResponse, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionsService.getAll(),
  });

  // Fetch categories
  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getAll(),
  });

  const transactions: Transaction[] = transactionsResponse?.data?.data || [];
  const categories: Category[] = categoriesResponse?.data?.data || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: TransactionData) => transactionsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      setIsAddModalOpen(false);
      resetForm();
      toast.success('Tranzacție adăugată cu succes!');
    },
    onError: () => {
      toast.error('Eroare la adăugarea tranzacției');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TransactionData> }) =>
      transactionsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      setIsEditModalOpen(false);
      setEditingTransaction(null);
      resetForm();
      toast.success('Tranzacție actualizată cu succes!');
    },
    onError: () => {
      toast.error('Eroare la actualizarea tranzacției');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => transactionsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      setIsEditModalOpen(false);
      setEditingTransaction(null);
      toast.success('Tranzacție ștearsă cu succes!');
    },
    onError: () => {
      toast.error('Eroare la ștergerea tranzacției');
    },
  });

  const resetForm = () => {
    setFormData({
      description: '',
      amount: 0,
      type: 'expense',
      categoryId: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (editingTransaction && window.confirm('Sigur vrei să ștergi această tranzacție?')) {
      deleteMutation.mutate(editingTransaction.id);
    }
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

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

  const getCategoryForTransaction = (categoryId: string) => {
    return categories.find((cat) => cat.id === categoryId);
  };

  // Apply all filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      // Search filter
      const matchesSearch =
        transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.amount.toString().includes(searchTerm);
      if (!matchesSearch) return false;

      // Type filter
      if (filters.types.size > 0 && !filters.types.has(transaction.type)) {
        return false;
      }

      // Category filter
      if (filters.categoryIds.size > 0 && !filters.categoryIds.has(transaction.categoryId)) {
        return false;
      }

      // Amount filter
      const amount = Number(transaction.amount);
      if (amount < filters.minAmount || amount > filters.maxAmount) {
        return false;
      }

      // Date range filter
      const transactionDate = new Date(transaction.date);
      const now = new Date();
      
      if (filters.dateRange === 'current-month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        if (transactionDate < startOfMonth || transactionDate > endOfMonth) return false;
      } else if (filters.dateRange === 'last-30-days') {
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        if (transactionDate < thirtyDaysAgo) return false;
      } else if (filters.dateRange === 'current-year') {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        if (transactionDate < startOfYear || transactionDate > endOfYear) return false;
      } else if (filters.dateRange === 'custom') {
        if (filters.customStartDate) {
          const startDate = new Date(filters.customStartDate);
          if (transactionDate < startDate) return false;
        }
        if (filters.customEndDate) {
          const endDate = new Date(filters.customEndDate);
          endDate.setHours(23, 59, 59, 999);
          if (transactionDate > endDate) return false;
        }
      }

      return true;
    });
  }, [transactions, searchTerm, filters]);

  // Calculate summary
  const summary = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      count: filteredTransactions.length,
      totalIncome,
      totalExpenses,
      net: totalIncome - totalExpenses,
    };
  }, [filteredTransactions]);

  // Pagination
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.dateRange !== 'current-month') count++;
    if (filters.types.size > 0) count++;
    if (filters.categoryIds.size > 0) count++;
    if (filters.minAmount > 0 || filters.maxAmount < 999999) count++;
    return count;
  }, [filters]);

  // Selection handlers
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
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
    if (selectedIds.size === paginatedTransactions.length && paginatedTransactions.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedTransactions.map((t) => t.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Sigur vrei să ștergi ${selectedIds.size} tranzacții?`)) {
      try {
        await Promise.all(Array.from(selectedIds).map((id) => transactionsService.delete(id)));
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['statistics'] });
        setSelectedIds(new Set());
        toast.success(`${selectedIds.size} tranzacții șterse cu succes!`);
      } catch (error) {
        toast.error('Eroare la ștergerea tranzacțiilor');
      }
    }
  };

  const handleResetFilters = () => {
    setFilters({
      dateRange: 'current-month',
      customStartDate: '',
      customEndDate: '',
      types: new Set(),
      categoryIds: new Set(),
      minAmount: 0,
      maxAmount: 999999,
    });
    setIsFilterOpen(false);
  };

  const handleApplyFilters = () => {
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  const hasActiveFilters = activeFilterCount > 0 || searchTerm.length > 0;

  const filteredCategories = categories.filter((cat) => cat.type === formData.type);

  return (
    <div className="page-content">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1>Tranzacții</h1>
          <p>Gestionează toate tranzacțiile tale financiare</p>
        </div>
        <div className="page-header-actions">
          <Button variant="primary" onClick={handleOpenAddModal}>
            <Plus size={18} style={{ marginRight: '0.5rem' }} />
            Adaugă Tranzacție
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar - FIXED LAYOUT */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'stretch',
          marginBottom: '1.5rem',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: tokens['text-muted'],
              pointerEvents: 'none',
            }}
          />
          <Input
            placeholder="Caută după descriere sau sumă..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              paddingLeft: '2.5rem',
              height: '44px',
              borderRadius: '8px',
              marginBottom: 0,
            }}
          />
        </div>

        {/* Filter Button */}
        <Button
          variant="secondary"
          onClick={() => setIsFilterOpen(true)}
          style={{
            height: '44px',
            padding: '0 20px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            position: 'relative',
          }}
        >
          <Filter size={18} />
          Filtre
          {activeFilterCount > 0 && (
            <span
              style={{
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
                fontWeight: 600,
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Summary Bar */}
      {filteredTransactions.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '2rem',
            padding: '1rem 1.5rem',
            backgroundColor: tokens['bg-elevated'],
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            fontSize: '0.9rem',
          }}
        >
          <div>
            <span style={{ color: tokens['text-muted'] }}>{summary.count} tranzacții</span>
          </div>
          <div
            style={{
              borderLeft: `1px solid ${tokens['border-default']}`,
              paddingLeft: '2rem',
            }}
          >
            <span style={{ color: tokens['text-muted'] }}>Total Venituri: </span>
            <span style={{ fontWeight: 600, color: tokens['accent-success'] }}>
              {summary.totalIncome.toFixed(2)} RON
            </span>
          </div>
          <div
            style={{
              borderLeft: `1px solid ${tokens['border-default']}`,
              paddingLeft: '2rem',
            }}
          >
            <span style={{ color: tokens['text-muted'] }}>Total Cheltuieli: </span>
            <span style={{ fontWeight: 600, color: tokens['accent-danger'] }}>
              {summary.totalExpenses.toFixed(2)} RON
            </span>
          </div>
          <div
            style={{
              borderLeft: `1px solid ${tokens['border-default']}`,
              paddingLeft: '2rem',
            }}
          >
            <span style={{ color: tokens['text-muted'] }}>Net: </span>
            <span
              style={{
                fontWeight: 600,
                color:
                  summary.net >= 0 ? tokens['accent-success'] : tokens['accent-danger'],
              }}
            >
              {summary.net >= 0 ? '+' : ''}
              {summary.net.toFixed(2)} RON
            </span>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <Card>
        {transactionsLoading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: tokens['text-muted'] }}>
            Se încarcă...
          </p>
        ) : filteredTransactions.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={hasActiveFilters ? 'Nu s-au găsit tranzacții' : 'Nu există tranzacții'}
            description={
              hasActiveFilters
                ? 'Nicio tranzacție nu corespunde criteriilor de filtrare selectate.'
                : 'Adaugă prima ta tranzacție pentru a începe să-ți urmărești finanțele.'
            }
            action={
              hasActiveFilters
                ? {
                    label: 'Resetează Filtrele',
                    onClick: handleResetFilters,
                  }
                : {
                    label: 'Adaugă Tranzacție',
                    onClick: handleOpenAddModal,
                  }
            }
          />
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.size === paginatedTransactions.length &&
                        paginatedTransactions.length > 0
                      }
                      onChange={toggleSelectAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th>Data</th>
                  <th>Descriere</th>
                  <th>Categorie</th>
                  <th>Tip</th>
                  <th style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    Sumă
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((transaction) => {
                  const category = getCategoryForTransaction(transaction.categoryId);
                  return (
                    <tr
                      key={transaction.id}
                      onClick={() => handleRowClick(transaction)}
                      style={{
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = tokens['bg-hover'];
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(transaction.id)}
                          onChange={() => toggleSelection(transaction.id)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td>{new Date(transaction.date).toLocaleDateString('ro-RO')}</td>
                      <td>{transaction.description || '-'}</td>
                      <td>
                        {category ? (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.375rem 0.75rem',
                              borderRadius: '0.5rem',
                              backgroundColor: `${category.color}20`,
                              border: `1px solid ${category.color}40`,
                            }}
                          >
                            <span style={{ fontSize: '1rem' }}>{category.icon}</span>
                            <span
                              style={{
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                color: tokens['text-primary'],
                              }}
                            >
                              {category.name}
                            </span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <span
                          className={
                            transaction.type === 'income' ? 'text-success' : 'text-danger'
                          }
                        >
                          {transaction.type === 'income' ? 'Venit' : 'Cheltuială'}
                        </span>
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums',
                          fontWeight: 600,
                          color:
                            transaction.type === 'income'
                              ? tokens['accent-success']
                              : tokens['text-primary'],
                        }}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {Number(transaction.amount).toFixed(2)} RON
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem 1.5rem',
                  borderTop: `1px solid ${tokens['border-default']}`,
                }}
              >
                <div style={{ fontSize: '0.875rem', color: tokens['text-muted'] }}>
                  Afișare {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} din{' '}
                  {filteredTransactions.length}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1
                      );
                    })
                    .map((page, index, array) => (
                      <>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span
                            key={`ellipsis-${page}`}
                            style={{ padding: '0.5rem', color: tokens['text-muted'] }}
                          >
                            ...
                          </span>
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
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Următor
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Floating Action Bar for Bulk Operations */}
      {selectedIds.size > 0 && (
        <div
          style={{
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
            zIndex: 50,
          }}
        >
          <span style={{ fontSize: '0.9rem', color: tokens['text-muted'] }}>
            {selectedIds.size} selectate
          </span>
          <div
            style={{
              width: '1px',
              height: '24px',
              backgroundColor: tokens['border-default'],
            }}
          />
          <Button variant="ghost" onClick={handleBulkDelete}>
            <Trash2 size={16} style={{ marginRight: '0.5rem' }} />
            Șterge
          </Button>
          <Button variant="ghost" onClick={() => setSelectedIds(new Set())}>
            <X size={16} />
          </Button>
        </div>
      )}

      {/* Add Transaction Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Adaugă Tranzacție"
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="Descriere"
            placeholder="ex: Cumpărături Lidl, Salariu martie, Factură curent..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            list="description-suggestions"
          />
          <datalist id="description-suggestions">
            {DESCRIPTION_SUGGESTIONS.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>

          <Input
            label="Sumă"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.amount || ''}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
            required
          />

          <div style={{ marginBottom: '1rem' }}>
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
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
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
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: `1px solid ${tokens['border-default']}`,
                backgroundColor: tokens['bg-base'],
                color: tokens['text-primary'],
                fontSize: '0.95rem',
              }}
            >
              <option value="">Selectează categoria</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Data"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAddModalOpen(false)}
              style={{ flex: 1 }}
            >
              Anulează
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createMutation.isPending}
              style={{ flex: 1 }}
            >
              {createMutation.isPending ? 'Se salvează...' : 'Salvează'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Transaction Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTransaction(null);
        }}
        title="Editează Tranzacție"
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="Descriere"
            placeholder="ex: Cumpărături Lidl"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <Input
            label="Sumă"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.amount || ''}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
            required
          />

          <div style={{ marginBottom: '1rem' }}>
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
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
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
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: `1px solid ${tokens['border-default']}`,
                backgroundColor: tokens['bg-base'],
                color: tokens['text-primary'],
                fontSize: '0.95rem',
              }}
            >
              <option value="">Selectează categoria</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Data"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Se șterge...' : 'Șterge'}
            </Button>
            <div style={{ flex: 1 }} />
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingTransaction(null);
              }}
            >
              Anulează
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Se salvează...' : 'Salvează'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Filter Modal - Placeholder */}
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
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: tokens['text-secondary'],
              }}
            >
              Perioadă
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {[
                { value: 'current-month', label: 'Luna curentă' },
                { value: 'last-30-days', label: 'Ultimele 30 zile' },
                { value: 'current-year', label: 'Anul curent' },
                { value: 'custom', label: 'Personalizat' },
              ].map((option) => (
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
                    backgroundColor:
                      filters.dateRange === option.value
                        ? `${tokens['accent-primary']}20`
                        : 'transparent',
                    color:
                      filters.dateRange === option.value
                        ? tokens['accent-primary']
                        : tokens['text-primary'],
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {filters.dateRange === 'custom' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                  marginTop: '0.75rem',
                }}
              >
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
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: tokens['text-secondary'],
              }}
            >
              Tip Tranzacție
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[
                { value: 'income', label: 'Venit', color: tokens['accent-success'] },
                { value: 'expense', label: 'Cheltuială', color: tokens['accent-danger'] },
              ].map((type) => (
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
                      filters.types.has(type.value as any) ? type.color : tokens['border-default']
                    }`,
                    backgroundColor: filters.types.has(type.value as any)
                      ? `${type.color}20`
                      : 'transparent',
                    color: filters.types.has(type.value as any) ? type.color : tokens['text-primary'],
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                  }}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Multiselect */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: tokens['text-secondary'],
              }}
            >
              Categorii
            </label>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                maxHeight: '200px',
                overflowY: 'auto',
                padding: '0.5rem',
                border: `1px solid ${tokens['border-default']}`,
                borderRadius: '0.5rem',
              }}
            >
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
                    transition: 'all 0.2s',
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
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: tokens['text-secondary'],
              }}
            >
              Interval Sumă
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <Input
                label="Minim"
                type="number"
                placeholder="0"
                value={filters.minAmount || ''}
                onChange={(e) =>
                  setFilters({ ...filters, minAmount: parseFloat(e.target.value) || 0 })
                }
              />
              <Input
                label="Maxim"
                type="number"
                placeholder="999999"
                value={filters.maxAmount || ''}
                onChange={(e) =>
                  setFilters({ ...filters, maxAmount: parseFloat(e.target.value) || 999999 })
                }
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
