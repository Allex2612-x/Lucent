import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Download,
  ChevronDown,
  MoreHorizontal,
  Repeat,
  X,
  Trash2,
  Inbox,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { transactionsService, TransactionData } from '../../services/transactions.service';
import { categoriesService } from '../../services/categories.service';
import { api } from '../../services/api';
import { useCategorySuggestion } from '../../hooks/useCategorySuggestion';
import { Sparkles, Upload as UploadIcon, Camera, Loader2 } from 'lucide-react';
import { ImportCsvModal } from './ImportCsvModal';
import { runReceiptOcr } from '../../utils/receiptOcr';
import { CategoryIcon } from '../../components/CategoryIcon';
import { BudgetWarningDialog, BudgetWarningPayload } from '../../components/BudgetWarningDialog';

const fmt = (n: number, dec = 2) =>
  n.toLocaleString('ro-RO', { minimumFractionDigits: dec, maximumFractionDigits: dec });

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  date: string;
  createdAt: string;
  isRecurring?: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
}

interface FilterState {
  segment: 'all' | 'income' | 'expense' | 'recurring';
  dateRange: 'current-month' | 'last-30-days' | 'current-year' | 'custom';
  customStartDate: string;
  customEndDate: string;
  categoryIds: Set<string>;
  minAmount: number;
  maxAmount: number;
}

const ITEMS_PER_PAGE = 20;

const ROMANIAN_MONTHS = [
  'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
  'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie',
];

function periodLabel(filters: FilterState) {
  const now = new Date();
  if (filters.dateRange === 'current-month') {
    return `1–${now.getDate()} ${ROMANIAN_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  }
  if (filters.dateRange === 'last-30-days') {
    return 'Ultimele 30 de zile';
  }
  if (filters.dateRange === 'current-year') {
    return `Anul ${now.getFullYear()}`;
  }
  if (filters.customStartDate && filters.customEndDate) {
    return `${filters.customStartDate} → ${filters.customEndDate}`;
  }
  return 'Personalizat';
}

export function Transactions() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchParams, setSearchParams] = useSearchParams();
  // Seed filters from URL query params on first mount (lets other pages
  // deep-link into transactions: e.g. clicking a budget category opens
  // /transactions?category=<id>&from=YYYY-MM-DD&to=YYYY-MM-DD).
  const [filters, setFilters] = useState<FilterState>(() => {
    const categoryParam = searchParams.get('category');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const hasCustomRange = !!(from && to);
    return {
      segment: 'all',
      dateRange: hasCustomRange ? 'custom' : 'current-month',
      customStartDate: from ?? '',
      customEndDate: to ?? '',
      categoryIds: categoryParam ? new Set(categoryParam.split(',').filter(Boolean)) : new Set(),
      minAmount: 0,
      maxAmount: 999999,
    };
  });

  // Strip the query params from the URL once they've been applied so a manual
  // refresh doesn't keep re-applying them after the user changes filters.
  useEffect(() => {
    if (searchParams.get('category') || searchParams.get('from') || searchParams.get('to')) {
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [formData, setFormData] = useState<TransactionData>({
    description: '',
    amount: 0,
    type: 'expense',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    frequency: undefined,
    repetitionCount: undefined,
  });
  const [userPickedCategory, setUserPickedCategory] = useState(false);
  const addSuggestion = useCategorySuggestion(formData.description, formData.type, {
    enabled: isAddModalOpen,
  });

  // Auto-apply suggestion only if the user hasn't manually picked one yet.
  useEffect(() => {
    if (
      isAddModalOpen &&
      addSuggestion &&
      !userPickedCategory &&
      formData.categoryId !== addSuggestion.categoryId
    ) {
      setFormData((prev) => ({ ...prev, categoryId: addSuggestion.categoryId }));
    }
  }, [addSuggestion, isAddModalOpen, userPickedCategory]);

  const { data: transactionsResponse, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionsService.getAll(),
  });

  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getAll(),
  });

  const transactions: Transaction[] = transactionsResponse?.data?.data || [];
  const categories: Category[] = categoriesResponse?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: ({ data, force }: { data: TransactionData; force?: boolean }) =>
      transactionsService.create(data, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      // The backend creates a budget_exceeded notification when this tx
      // pushes the user over a category limit — refresh the bell badge
      // so the new dot shows up immediately instead of after the 30s poll.
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      setIsAddModalOpen(false);
      resetForm();
      toast.success('Tranzacție adăugată cu succes!');
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      const payload = error?.response?.data;
      if (status === 409 && payload?.requiresConfirmation) {
        // Surface our themed dialog instead of window.confirm
        setBudgetWarning(payload.warning ?? { categoryName: 'Necunoscut' });
        return;
      }
      toast.error(payload?.message || 'Eroare la adăugarea tranzacției');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TransactionData> }) =>
      transactionsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      setIsEditModalOpen(false);
      setEditingTransaction(null);
      resetForm();
      toast.success('Tranzacție actualizată cu succes!');
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || 'Eroare la actualizarea tranzacției'),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, deleteFuture }: { id: string; deleteFuture?: boolean }) =>
      transactionsService.delete(id, deleteFuture),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      setIsEditModalOpen(false);
      setEditingTransaction(null);
      setShowDeleteScopeModal(false);
      toast.success(
        variables.deleteFuture
          ? 'Tranzacția și toate cele viitoare au fost șterse.'
          : 'Tranzacție ștearsă cu succes!',
      );
    },
    onError: () => toast.error('Eroare la ștergerea tranzacției'),
  });

  const [showDeleteScopeModal, setShowDeleteScopeModal] = useState(false);

  const resetForm = () => {
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
    setUserPickedCategory(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      toast.error('Selectează o categorie.');
      return;
    }
    if (!(formData.amount > 0)) {
      toast.error('Suma trebuie să fie pozitivă.');
      return;
    }
    if (formData.isRecurring) {
      if (!formData.frequency) {
        toast.error('Alege frecvența pentru tranzacția recurentă.');
        return;
      }
      if (!formData.repetitionCount || formData.repetitionCount < 1) {
        toast.error('Introdu numărul de repetări (cel puțin 1).');
        return;
      }
    }
    const payload: TransactionData = formData.isRecurring
      ? formData
      : { ...formData, isRecurring: false, frequency: undefined, repetitionCount: undefined };
    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data: payload });
    } else {
      createMutation.mutate({ data: payload });
    }
  };

  const handleDelete = () => {
    if (!editingTransaction) return;
    if (editingTransaction.isRecurring) {
      // Open scope picker — let the user choose between just this one or the
      // full future series.
      setShowDeleteScopeModal(true);
      return;
    }
    if (window.confirm('Sigur vrei să ștergi această tranzacție?')) {
      deleteMutation.mutate({ id: editingTransaction.id, deleteFuture: false });
    }
  };

  const handleRowClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      description: transaction.description || '',
      amount: Number(transaction.amount),
      type: transaction.type,
      categoryId: transaction.categoryId,
      date: new Date(transaction.date).toISOString().split('T')[0],
      isRecurring: false,
      frequency: undefined,
      repetitionCount: undefined,
    });
    setIsEditModalOpen(true);
  };

  const getCategory = (id: string) => categories.find((c) => c.id === id);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        !searchTerm ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        Number(t.amount).toString().includes(searchTerm);
      if (!matchesSearch) return false;

      if (filters.segment === 'income' && t.type !== 'income') return false;
      if (filters.segment === 'expense' && t.type !== 'expense') return false;
      if (filters.segment === 'recurring' && !t.isRecurring) return false;

      if (filters.categoryIds.size > 0 && !filters.categoryIds.has(t.categoryId)) return false;

      const amt = Number(t.amount);
      if (amt < filters.minAmount || amt > filters.maxAmount) return false;

      const tDate = new Date(t.date);
      const now = new Date();
      if (filters.dateRange === 'current-month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        if (tDate < start || tDate > end) return false;
      } else if (filters.dateRange === 'last-30-days') {
        const start = new Date(now);
        start.setDate(now.getDate() - 30);
        if (tDate < start) return false;
      } else if (filters.dateRange === 'current-year') {
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        if (tDate < start || tDate > end) return false;
      } else if (filters.dateRange === 'custom') {
        if (filters.customStartDate) {
          if (tDate < new Date(filters.customStartDate)) return false;
        }
        if (filters.customEndDate) {
          const end = new Date(filters.customEndDate);
          end.setHours(23, 59, 59, 999);
          if (tDate > end) return false;
        }
      }

      return true;
    });
  }, [transactions, searchTerm, filters]);

  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + Number(t.amount), 0);
    const expense = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + Number(t.amount), 0);
    const recurring = filteredTransactions
      .filter((t) => t.isRecurring)
      .reduce((s, t) => s + Number(t.amount), 0);
    const count = filteredTransactions.length;
    return {
      count,
      total: income + expense,
      income,
      expense,
      recurring,
      incomeCount: filteredTransactions.filter((t) => t.type === 'income').length,
      expenseCount: filteredTransactions.filter((t) => t.type === 'expense').length,
      recurringCount: filteredTransactions.filter((t) => t.isRecurring).length,
    };
  }, [filteredTransactions]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE));

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
    if (!window.confirm(`Sigur vrei să ștergi ${selectedIds.size} tranzacții?`)) return;
    try {
      await Promise.all(Array.from(selectedIds).map((id) => transactionsService.delete(id)));
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      setSelectedIds(new Set());
      toast.success(`${selectedIds.size} tranzacții șterse cu succes!`);
    } catch {
      toast.error('Eroare la ștergerea tranzacțiilor');
    }
  };

  const handleResetFilters = () => {
    setFilters({
      segment: 'all',
      dateRange: 'current-month',
      customStartDate: '',
      customEndDate: '',
      categoryIds: new Set(),
      minAmount: 0,
      maxAmount: 999999,
    });
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  const filteredCategories = categories.filter((c) => c.type === formData.type);
  const hasActiveFilters =
    filters.segment !== 'all' ||
    filters.dateRange !== 'current-month' ||
    filters.categoryIds.size > 0 ||
    filters.minAmount > 0 ||
    filters.maxAmount < 999999 ||
    searchTerm.length > 0;

  const [isExporting, setIsExporting] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [budgetWarning, setBudgetWarning] = useState<BudgetWarningPayload | null>(null);
  const [ocrProgress, setOcrProgress] = useState<number | null>(null);
  const ocrFileRef = useRef<HTMLInputElement>(null);

  const handleReceipt = async (file: File) => {
    setOcrProgress(0);
    try {
      const result = await runReceiptOcr(file, setOcrProgress);
      setFormData((prev) => ({
        ...prev,
        type: 'expense',
        amount: result.amount ?? prev.amount,
        description: result.merchant ?? prev.description,
        date: result.date ?? prev.date,
      }));
      if (result.amount || result.merchant) {
        toast.success(
          `Bon procesat${result.merchant ? ` — ${result.merchant}` : ''}${
            result.amount ? ` · ${result.amount.toFixed(2)} RON` : ''
          }`,
        );
      } else {
        toast.message('Bonul a fost scanat dar nu am putut extrage suma. Completează manual.');
      }
    } catch (error) {
      toast.error('Nu am putut citi bonul. Încearcă altă poză.');
    } finally {
      setOcrProgress(null);
    }
  };
  const periodRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPeriodOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) {
        setIsPeriodOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [isPeriodOpen]);

  const handleExport = async (format: 'pdf' | 'excel' = 'excel') => {
    setIsExporting(true);
    try {
      const now = new Date();
      let startDate: string;
      let endDate: string;
      if (filters.dateRange === 'custom' && filters.customStartDate && filters.customEndDate) {
        startDate = filters.customStartDate;
        endDate = filters.customEndDate;
      } else if (filters.dateRange === 'last-30-days') {
        const start = new Date(now);
        start.setDate(now.getDate() - 30);
        startDate = start.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
      } else if (filters.dateRange === 'current-year') {
        startDate = `${now.getFullYear()}-01-01`;
        endDate = `${now.getFullYear()}-12-31`;
      } else {
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const lastDay = String(new Date(y, now.getMonth() + 1, 0).getDate()).padStart(2, '0');
        startDate = `${y}-${m}-01`;
        endDate = `${y}-${m}-${lastDay}`;
      }

      const response = await api.get(`/reports/export/${format}`, {
        params: { startDate, endDate },
        responseType: 'blob',
      });
      const mime =
        format === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      const blob = new Blob([response.data], { type: mime });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `faro-tranzactii-${startDate}_${endDate}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Tranzacții exportate.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Eroare la export.');
    } finally {
      setIsExporting(false);
    }
  };

  const summaryCards = [
    { l: 'Total perioadă', v: summary.total, c: 'var(--text-1)', sub: `${summary.count} tranzacții` },
    { l: 'Venituri', v: summary.income, c: 'var(--income)', sub: `${summary.incomeCount} intrări` },
    { l: 'Cheltuieli', v: summary.expense, c: 'var(--expense)', sub: `${summary.expenseCount} ieșiri` },
    { l: 'Recurente', v: summary.recurring, c: 'var(--accent)', sub: `${summary.recurringCount} active` },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Tranzacții</div>
          <div className="page-sub">Toate veniturile și cheltuielile tale, într-un singur loc.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-secondary"
            onClick={() => setIsImportOpen(true)}
            title="Import CSV de la bancă"
          >
            <UploadIcon size={14} /> Import CSV
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handleExport('excel')}
            disabled={isExporting}
            title="Export Excel"
          >
            <Download size={14} /> {isExporting ? 'Se exportă...' : 'Export'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
          >
            <Plus size={14} /> Tranzacție nouă
          </button>
        </div>
      </div>

      <ImportCsvModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        categories={categories}
      />

      <BudgetWarningDialog
        warning={budgetWarning}
        onCancel={() => setBudgetWarning(null)}
        onConfirm={() => {
          createMutation.mutate({ data: formData, force: true });
          setBudgetWarning(null);
        }}
        isPending={createMutation.isPending}
      />

      {/* summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {summaryCards.map((s, i) => (
          <div
            key={i}
            style={{
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                fontSize: 11.5,
                color: 'var(--text-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {s.l}
            </div>
            <div
              className="num"
              style={{
                fontSize: 21,
                fontWeight: 600,
                color: s.c,
                marginTop: 4,
                letterSpacing: '-0.015em',
              }}
            >
              {fmt(s.v, 2)}{' '}
              <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 400 }}>RON</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* filter bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        <div className="seg">
          <button className={filters.segment === 'all' ? 'on' : ''} onClick={() => setFilters({ ...filters, segment: 'all' })}>
            Toate
          </button>
          <button className={filters.segment === 'income' ? 'on' : ''} onClick={() => setFilters({ ...filters, segment: 'income' })}>
            Venituri
          </button>
          <button className={filters.segment === 'expense' ? 'on' : ''} onClick={() => setFilters({ ...filters, segment: 'expense' })}>
            Cheltuieli
          </button>
          <button className={filters.segment === 'recurring' ? 'on' : ''} onClick={() => setFilters({ ...filters, segment: 'recurring' })}>
            Recurente
          </button>
        </div>

        <div style={{ flex: 1, position: 'relative', minWidth: 200, maxWidth: 320 }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-3)',
              pointerEvents: 'none',
            }}
          />
          <input
            placeholder="Caută după descriere sau sumă..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              height: 36,
              paddingLeft: 32,
              paddingRight: 12,
              border: '1px solid var(--border)',
              borderRadius: 10,
              fontSize: 13,
              fontFamily: 'inherit',
              outline: 'none',
              background: '#fff',
              color: 'var(--text-1)',
            }}
          />
        </div>

        <div ref={periodRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="chip"
            onClick={() => setIsPeriodOpen((v) => !v)}
            style={{
              background: '#fff',
              cursor: 'pointer',
              fontFamily: 'inherit',
              borderColor: isPeriodOpen ? 'var(--accent)' : undefined,
            }}
          >
            <Calendar size={12} />
            <span style={{ color: 'var(--text-1)' }}>{periodLabel(filters)}</span>
            <ChevronDown
              size={12}
              style={{
                transition: 'transform .15s',
                transform: isPeriodOpen ? 'rotate(180deg)' : 'rotate(0)',
              }}
            />
          </button>
          {isPeriodOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                minWidth: 200,
                background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: 12,
                boxShadow: 'var(--shadow-lg)',
                padding: 6,
                zIndex: 20,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {(
                [
                  { value: 'current-month', label: 'Luna curentă' },
                  { value: 'last-30-days', label: 'Ultimele 30 zile' },
                  { value: 'current-year', label: 'Anul curent' },
                ] as Array<{ value: FilterState['dateRange']; label: string }>
              ).map((opt) => {
                const on = filters.dateRange === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setFilters({ ...filters, dateRange: opt.value });
                      setCurrentPage(1);
                      setIsPeriodOpen(false);
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: 'none',
                      background: on ? 'var(--bg-subtle)' : 'transparent',
                      color: 'var(--text-1)',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontFamily: 'inherit',
                      fontWeight: on ? 600 : 500,
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <button
                type="button"
                onClick={() => {
                  setIsPeriodOpen(false);
                  setIsFilterOpen(true);
                }}
                style={{
                  textAlign: 'left',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  fontWeight: 500,
                }}
              >
                Interval personalizat…
              </button>
            </div>
          )}
        </div>

        {filters.categoryIds.size > 0 && (
          <span className="chip" style={{ background: '#fff' }}>
            <span className="chip-dot" style={{ background: '#2547f5' }} />
            <span style={{ color: 'var(--text-1)' }}>{filters.categoryIds.size} categorii</span>
            <button
              type="button"
              onClick={() => setFilters({ ...filters, categoryIds: new Set() })}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'grid', placeItems: 'center' }}
            >
              <X size={11} />
            </button>
          </span>
        )}

        <button className="btn btn-secondary btn-sm" onClick={() => setIsFilterOpen(true)}>
          <Filter size={12} /> Filtre
        </button>
      </div>

      {/* table */}
      <div
        style={{
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        {transactionsLoading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>Se încarcă...</div>
        ) : filteredTransactions.length === 0 ? (
          <div style={{ padding: 32 }}>
            <EmptyState
              icon={Inbox}
              title={hasActiveFilters ? 'Nu s-au găsit tranzacții' : 'Nu există tranzacții'}
              description={
                hasActiveFilters
                  ? 'Nicio tranzacție nu corespunde criteriilor de filtrare.'
                  : 'Adaugă prima ta tranzacție pentru a începe.'
              }
              action={
                hasActiveFilters
                  ? { label: 'Resetează filtrele', onClick: handleResetFilters }
                  : {
                      label: 'Adaugă tranzacție',
                      onClick: () => {
                        resetForm();
                        setIsAddModalOpen(true);
                      },
                    }
              }
            />
          </div>
        ) : (
          <>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 28, paddingRight: 0 }}>
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
                  <th>Tranzacție</th>
                  <th>Categorie</th>
                  <th>Data</th>
                  <th className="ta-right">Sumă</th>
                  <th style={{ width: 30 }} />
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((t) => {
                  const cat = getCategory(t.categoryId);
                  const amt = Number(t.amount);
                  const isIncome = t.type === 'income';
                  const tDate = new Date(t.date);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => handleRowClick(t)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ paddingRight: 0 }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(t.id)}
                          onChange={() => toggleSelection(t.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 9,
                              background: cat?.color ? `${cat.color}1f` : 'var(--bg-inset)',
                              color: cat?.color || 'var(--text-2)',
                              display: 'grid',
                              placeItems: 'center',
                            }}
                          >
                            <CategoryIcon icon={cat?.icon} name={cat?.name} size={16} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                              }}
                            >
                              {t.description || (isIncome ? 'Venit' : 'Cheltuială')}
                              {t.isRecurring && (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    fontSize: 10.5,
                                    color: 'var(--accent)',
                                    background: 'var(--accent-soft)',
                                    padding: '1px 7px',
                                    borderRadius: 999,
                                    fontWeight: 500,
                                  }}
                                >
                                  <Repeat size={10} />
                                  recurent
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {cat ? (
                          <span className="chip" style={{ background: '#fff' }}>
                            <span className="chip-dot" style={{ background: cat.color || '#a09c92' }} />
                            {cat.name}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: 13 }}>
                          {tDate.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }} className="mono">
                          {tDate.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td
                        className="ta-right num"
                        style={{
                          fontWeight: 600,
                          color: isIncome ? 'var(--income)' : 'var(--text-1)',
                        }}
                      >
                        {isIncome ? '+' : '−'} {fmt(Math.abs(amt))}
                        <span
                          style={{
                            color: 'var(--text-3)',
                            fontWeight: 400,
                            fontSize: 11,
                            marginLeft: 3,
                          }}
                        >
                          RON
                        </span>
                      </td>
                      <td>
                        <button
                          className="icon-btn"
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 7,
                            border: 'none',
                            background: 'transparent',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(t);
                          }}
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 18px',
                borderTop: '1px solid var(--border)',
                fontSize: 12.5,
                color: 'var(--text-2)',
              }}
            >
              <span>
                Afișează {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} din{' '}
                {filteredTransactions.length} tranzacții
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  ‹ Precedent
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p} style={{ display: 'inline-flex', gap: 4 }}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <button className="btn btn-secondary btn-sm" disabled>
                          …
                        </button>
                      )}
                      <button
                        className={`btn btn-sm ${p === currentPage ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ width: 30, padding: 0, justifyContent: 'center' }}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Următor ›
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Floating bulk-action bar */}
      {selectedIds.size > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 50,
          }}
        >
          <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>
            {selectedIds.size} selectate
          </span>
          <div style={{ width: 1, height: 22, background: 'var(--border)' }} />
          <button className="btn btn-ghost btn-sm" onClick={handleBulkDelete}>
            <Trash2 size={14} /> Șterge
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedIds(new Set())}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Add transaction modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Adaugă tranzacție"
      >
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              background: 'var(--accent-soft)',
              borderRadius: 12,
              marginBottom: 14,
              border: '1px solid rgba(37,71,245,0.18)',
            }}
          >
            <button
              type="button"
              onClick={() => ocrFileRef.current?.click()}
              disabled={ocrProgress !== null}
              className="btn btn-secondary btn-sm"
              style={{ flexShrink: 0 }}
            >
              {ocrProgress !== null ? (
                <>
                  <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                  {Math.round(ocrProgress * 100)}%
                </>
              ) : (
                <>
                  <Camera size={13} /> Scanează bon
                </>
              )}
            </button>
            <div style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.4 }}>
              {ocrProgress !== null
                ? 'Se procesează imaginea local pe dispozitivul tău... (poate dura câteva secunde)'
                : 'Încarcă poza unui bon fiscal — extragem automat suma, magazinul și data.'}
            </div>
            <input
              ref={ocrFileRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleReceipt(file);
                e.target.value = '';
              }}
            />
          </div>

          <div className="field" style={{ marginBottom: 14 }}>
            <label>Descriere</label>
            <input
              placeholder="Ex: Cumpărături Lidl"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div className="field">
              <label>Sumă (RON)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div className="field">
              <label>Data</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
              Tip
            </label>
            <div className="seg" style={{ width: '100%' }}>
              <button
                type="button"
                className={formData.type === 'expense' ? 'on' : ''}
                onClick={() => setFormData({ ...formData, type: 'expense', categoryId: '' })}
                style={{ flex: 1 }}
              >
                Cheltuială
              </button>
              <button
                type="button"
                className={formData.type === 'income' ? 'on' : ''}
                onClick={() => setFormData({ ...formData, type: 'income', categoryId: '' })}
                style={{ flex: 1 }}
              >
                Venit
              </button>
            </div>
          </div>

          <div className="field" style={{ marginBottom: 14 }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Categorie</span>
              {addSuggestion && formData.categoryId === addSuggestion.categoryId && (
                <span
                  style={{
                    fontSize: 10.5,
                    color: 'var(--accent-ink)',
                    background: 'var(--accent-soft)',
                    padding: '2px 7px',
                    borderRadius: 999,
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    textTransform: 'none',
                    letterSpacing: 0,
                  }}
                  title={`Sugerat după "${addSuggestion.matchedKeyword}"`}
                >
                  <Sparkles size={10} /> sugerat automat
                </span>
              )}
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => {
                setFormData({ ...formData, categoryId: e.target.value });
                setUserPickedCategory(true);
              }}
              required
            >
              <option value="">Selectează categoria</option>
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              padding: 14,
              border: '1px solid var(--border)',
              borderRadius: 12,
              background: 'var(--bg-subtle)',
              marginBottom: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Repeat size={13} style={{ color: 'var(--accent)' }} /> Tranzacție recurentă
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>
                  Generează automat tranzacții la intervale regulate.
                </div>
              </div>
              <button
                type="button"
                className={`toggle${formData.isRecurring ? ' on' : ''}`}
                onClick={() =>
                  setFormData({
                    ...formData,
                    isRecurring: !formData.isRecurring,
                    frequency: !formData.isRecurring ? 'monthly' : undefined,
                    repetitionCount: !formData.isRecurring ? 12 : undefined,
                  })
                }
                aria-pressed={!!formData.isRecurring}
                aria-label="Tranzacție recurentă"
              />
            </div>
            {formData.isRecurring && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div className="field">
                  <label>Frecvență</label>
                  <select
                    value={formData.frequency ?? 'monthly'}
                    onChange={(e) =>
                      setFormData({ ...formData, frequency: e.target.value as TransactionData['frequency'] })
                    }
                  >
                    <option value="daily">Zilnic</option>
                    <option value="weekly">Săptămânal</option>
                    <option value="monthly">Lunar</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
                <div className="field">
                  <label>Număr de repetări</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={formData.repetitionCount ?? ''}
                    placeholder="ex: 12"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        repetitionCount: parseInt(e.target.value, 10) || undefined,
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} style={{ flex: 1 }}>
              Anulează
            </Button>
            <Button type="submit" variant="primary" disabled={createMutation.isPending} style={{ flex: 1 }}>
              {createMutation.isPending ? 'Se salvează...' : 'Salvează'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit transaction modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTransaction(null);
        }}
        title="Editează tranzacție"
      >
        <form onSubmit={handleSubmit}>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>Descriere</label>
            <input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div className="field">
              <label>Sumă (RON)</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div className="field">
              <label>Data</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
              Tip
            </label>
            <div className="seg" style={{ width: '100%' }}>
              <button
                type="button"
                className={formData.type === 'expense' ? 'on' : ''}
                onClick={() => setFormData({ ...formData, type: 'expense', categoryId: '' })}
                style={{ flex: 1 }}
              >
                Cheltuială
              </button>
              <button
                type="button"
                className={formData.type === 'income' ? 'on' : ''}
                onClick={() => setFormData({ ...formData, type: 'income', categoryId: '' })}
                style={{ flex: 1 }}
              >
                Venit
              </button>
            </div>
          </div>

          <div className="field" style={{ marginBottom: 14 }}>
            <label>Categorie</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              required
            >
              <option value="">Selectează categoria</option>
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <Button type="button" variant="danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
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
            <Button type="submit" variant="primary" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Se salvează...' : 'Salvează'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Filter modal */}
      <Modal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filtrează tranzacțiile"
        footer={
          <>
            <Button variant="ghost" onClick={handleResetFilters}>
              Resetează
            </Button>
            <Button variant="primary" onClick={() => setIsFilterOpen(false)}>
              Aplică
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>
              Perioadă
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {[
                { value: 'current-month', label: 'Luna curentă' },
                { value: 'last-30-days', label: 'Ultimele 30 zile' },
                { value: 'current-year', label: 'Anul curent' },
                { value: 'custom', label: 'Personalizat' },
              ].map((opt) => {
                const on = filters.dateRange === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFilters({ ...filters, dateRange: opt.value as any })}
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                      background: on ? 'var(--accent-soft)' : '#fff',
                      color: on ? 'var(--accent-ink)' : 'var(--text-1)',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 500,
                      fontFamily: 'inherit',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {filters.dateRange === 'custom' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
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

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>
              Categorii
            </label>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                maxHeight: 180,
                overflowY: 'auto',
                padding: 8,
                border: '1px solid var(--border)',
                borderRadius: 10,
                background: 'var(--bg-subtle)',
              }}
            >
              {categories.map((cat) => {
                const on = filters.categoryIds.has(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      const next = new Set(filters.categoryIds);
                      if (next.has(cat.id)) {
                        next.delete(cat.id);
                      } else {
                        next.add(cat.id);
                      }
                      setFilters({ ...filters, categoryIds: next });
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 10px',
                      borderRadius: 999,
                      border: `1px solid ${on ? cat.color : 'var(--border)'}`,
                      background: on ? `${cat.color}1f` : '#fff',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontFamily: 'inherit',
                      color: 'var(--text-1)',
                    }}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>
              Interval sumă (RON)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                value={filters.maxAmount === 999999 ? '' : filters.maxAmount}
                onChange={(e) => setFilters({ ...filters, maxAmount: parseFloat(e.target.value) || 999999 })}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Recurring delete scope picker */}
      <Modal
        isOpen={showDeleteScopeModal}
        onClose={() => setShowDeleteScopeModal(false)}
        title="Ștergi seria recurentă?"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
            Această tranzacție face parte dintr-o serie recurentă
            {editingTransaction?.description ? ` („${editingTransaction.description}")` : ''}. Ce vrei
            să ștergi?
          </p>

          <button
            type="button"
            onClick={() => {
              if (editingTransaction)
                deleteMutation.mutate({ id: editingTransaction.id, deleteFuture: false });
            }}
            disabled={deleteMutation.isPending}
            style={{
              textAlign: 'left',
              padding: 14,
              border: '1px solid var(--border)',
              borderRadius: 12,
              background: '#fff',
              cursor: 'pointer',
              fontFamily: 'inherit',
              color: 'var(--text-1)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Doar această tranzacție</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
              Instanțele viitoare ale seriei rămân nemodificate.
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              if (editingTransaction)
                deleteMutation.mutate({ id: editingTransaction.id, deleteFuture: true });
            }}
            disabled={deleteMutation.isPending}
            style={{
              textAlign: 'left',
              padding: 14,
              border: '1px solid var(--expense)',
              borderRadius: 12,
              background: 'rgba(245,85,110,0.04)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              color: 'var(--text-1)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--expense)' }}>
              Această tranzacție și toate cele viitoare
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
              Șterge toate instanțele din serie cu data ≥ aceasta. Tranzacțiile anterioare rămân.
            </div>
          </button>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <Button variant="ghost" onClick={() => setShowDeleteScopeModal(false)}>
              Anulează
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
