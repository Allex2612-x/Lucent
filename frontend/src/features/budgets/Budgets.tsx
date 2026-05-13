import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import { Wallet as WalletIcon } from 'lucide-react';

import { budgetsService, BudgetData } from '../../services/budgets.service';
import { categoriesService } from '../../services/categories.service';
import { statisticsService } from '../../services/statistics.service';
import { Budget, Category } from '@sasha-licenta/shared';

const fmt = (n: number, dec = 0) =>
  n.toLocaleString('ro-RO', { minimumFractionDigits: dec, maximumFractionDigits: dec });

const MONTHS = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
];

function getMonthName(month: number) {
  return MONTHS[month - 1] || '';
}

function BudgetRing({
  pct,
  color,
  size = 96,
  stroke = 8,
}: {
  pct: number;
  color: string;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const fill = Math.min(pct, 100) / 100;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-inset)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - fill)}
      />
    </svg>
  );
}

interface BudgetCardData {
  id: string;
  rootBudgetId: string;
  name: string;
  icon: string;
  spent: number;
  limit: number;
  color: string;
}

function BudgetCardView({
  b,
  onEdit,
  onDelete,
}: {
  b: BudgetCardData;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const pct = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
  const status = pct >= 100 ? 'over' : pct >= 80 ? 'near' : 'ok';
  const ringColor =
    status === 'over' ? 'var(--expense)' : status === 'near' ? 'var(--warn)' : 'var(--income)';
  const statusLabel = { ok: 'În limită', near: 'Aproape de limită', over: 'Depășit' }[status];
  const statusBg = { ok: 'var(--income-soft)', near: 'var(--warn-soft)', over: 'var(--expense-soft)' }[status];
  const statusFg = { ok: 'var(--income)', near: 'var(--warn)', over: 'var(--expense)' }[status];

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ position: 'relative' }}>
          <BudgetRing pct={pct} color={ringColor} />
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
            <div>
              <div className="num serif" style={{ fontSize: 19, fontStyle: 'italic', lineHeight: 1 }}>
                {Math.round(pct)}%
              </div>
              <div
                style={{
                  fontSize: 9.5,
                  color: 'var(--text-3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginTop: 2,
                }}
              >
                din buget
              </div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{b.icon}</span> {b.name}
              </div>
              <div
                className="chip"
                style={{
                  marginTop: 6,
                  background: statusBg,
                  color: statusFg,
                  border: 'none',
                  fontWeight: 600,
                }}
              >
                <span className="chip-dot" style={{ background: statusFg }} /> {statusLabel}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={onEdit}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-3)',
                  padding: 4,
                  borderRadius: 6,
                }}
                title="Editează"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={onDelete}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-3)',
                  padding: 4,
                  borderRadius: 6,
                }}
                title="Șterge"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-3)' }}>Cheltuit / Limită</div>
          <div className="num" style={{ marginTop: 2 }}>
            <span
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: status === 'over' ? 'var(--expense)' : 'var(--text-1)',
              }}
            >
              {fmt(b.spent)}
            </span>
            <span style={{ color: 'var(--text-3)', fontSize: 13 }}>
              {' '}
              / {fmt(b.limit)} RON
            </span>
          </div>
          {status === 'over' ? (
            <div style={{ marginTop: 6, fontSize: 11.5, color: 'var(--expense)', fontWeight: 500 }}>
              ↑ Depășit cu {fmt(b.spent - b.limit)} RON
            </div>
          ) : (
            <div style={{ marginTop: 6, fontSize: 11.5, color: 'var(--text-3)' }}>
              {fmt(b.limit - b.spent)} RON rămași în această lună
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface CategoryLimitField {
  categoryId: string;
  limitAmount: number;
}

function daysLeftInMonth(month: number, year: number) {
  const now = new Date();
  if (now.getMonth() + 1 !== month || now.getFullYear() !== year) {
    const lastDay = new Date(year, month, 0).getDate();
    return lastDay;
  }
  const lastDay = new Date(year, month, 0).getDate();
  return Math.max(0, lastDay - now.getDate());
}

export function Budgets() {
  const queryClient = useQueryClient();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear] = useState(now.getFullYear());

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const [formData, setFormData] = useState({
    month: selectedMonth,
    year: selectedYear,
    totalLimit: 0,
    isTotal: false,
  });
  const [categoryLimits, setCategoryLimits] = useState<CategoryLimitField[]>([
    { categoryId: '', limitAmount: 0 },
  ]);

  const { data: budgetsResponse, isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => budgetsService.getAll(),
  });

  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getAll(),
  });

  const { data: overviewData } = useQuery({
    queryKey: ['statistics', 'overview', selectedMonth, selectedYear],
    queryFn: () => statisticsService.getOverview({ month: selectedMonth, year: selectedYear }),
  });

  const { data: byCategoryData } = useQuery({
    queryKey: ['statistics', 'by-category', selectedMonth, selectedYear],
    queryFn: () =>
      statisticsService.getByCategory({
        startDate: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`,
        type: 'expense',
      }),
  });

  const budgets: Budget[] = budgetsResponse?.data?.data || [];
  const categories: Category[] = categoriesResponse?.data?.data || [];
  const expenseCategories = categories.filter((cat) => cat.type === 'expense');
  const spentTotalMonth: number = overviewData?.data?.data?.totalExpenses ?? 0;
  const byCategorySpent: Record<string, number> = useMemo(() => {
    const rows = byCategoryData?.data?.data || [];
    const map: Record<string, number> = {};
    rows.forEach((r: any) => {
      map[r.categoryId] = Number(r.total);
    });
    return map;
  }, [byCategoryData]);

  const monthBudgets = budgets.filter(
    (b: Budget) => b.month === selectedMonth && b.year === selectedYear,
  );

  const cards: BudgetCardData[] = monthBudgets.flatMap((b: Budget) => {
    if ((b as any).isTotal || !b.categories || b.categories.length === 0) {
      return [
        {
          id: b.id,
          rootBudgetId: b.id,
          name: `Buget total · ${getMonthName(b.month)}`,
          icon: '💰',
          spent: Number(b.month === selectedMonth ? spentTotalMonth : 0),
          limit: Number(b.totalLimit),
          color: '#2547f5',
        },
      ];
    }
    return b.categories.map((bc: any) => ({
      id: `${b.id}__${bc.id}`,
      rootBudgetId: b.id,
      name: bc.category?.name || 'Categorie',
      icon: bc.category?.icon || '📁',
      spent: byCategorySpent[bc.categoryId] || 0,
      limit: Number(bc.limitAmount),
      color: bc.category?.color || '#2547f5',
    }));
  });

  const totalSpent = cards.reduce((s, c) => s + c.spent, 0);
  const totalLimit = cards.reduce((s, c) => s + c.limit, 0);
  const totalPct = totalLimit > 0 ? Math.min((totalSpent / totalLimit) * 100, 100) : 0;
  const stats = cards.reduce(
    (acc, c) => {
      const ratio = c.limit > 0 ? c.spent / c.limit : 0;
      if (ratio >= 1) acc.over++;
      else if (ratio >= 0.8) acc.near++;
      else acc.ok++;
      return acc;
    },
    { over: 0, near: 0, ok: 0 },
  );
  const daysLeft = daysLeftInMonth(selectedMonth, selectedYear);

  const createMutation = useMutation({
    mutationFn: (data: BudgetData) => budgetsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setIsCreateModalOpen(false);
      resetForm();
      toast.success('Buget creat cu succes!');
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || 'Eroare la crearea bugetului.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BudgetData> }) =>
      budgetsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setIsEditModalOpen(false);
      setEditingBudget(null);
      resetForm();
      toast.success('Buget actualizat cu succes!');
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || 'Eroare la actualizare.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => budgetsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Buget șters.');
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || 'Eroare la ștergere.'),
  });

  const resetForm = () => {
    setFormData({
      month: selectedMonth,
      year: selectedYear,
      totalLimit: 0,
      isTotal: false,
    });
    setCategoryLimits([{ categoryId: '', limitAmount: 0 }]);
  };

  const handleAddCategoryLimit = () =>
    setCategoryLimits([...categoryLimits, { categoryId: '', limitAmount: 0 }]);
  const handleRemoveCategoryLimit = (index: number) => {
    if (categoryLimits.length > 1) {
      setCategoryLimits(categoryLimits.filter((_, i) => i !== index));
    }
  };
  const handleCategoryLimitChange = (
    index: number,
    field: keyof CategoryLimitField,
    value: string | number,
  ) => {
    const updated = [...categoryLimits];
    updated[index] = { ...updated[index], [field]: value };
    setCategoryLimits(updated);
  };

  const handleCreateBudget = () => {
    if (!(formData.totalLimit > 0)) {
      toast.error('Limita totală trebuie să fie pozitivă.');
      return;
    }
    if (formData.isTotal) {
      const data: BudgetData = {
        month: formData.month,
        year: formData.year,
        totalLimit: formData.totalLimit,
        isTotal: true,
      };
      createMutation.mutate(data);
      return;
    }
    const valid = categoryLimits.filter((cl) => cl.categoryId && cl.limitAmount > 0);
    if (valid.length === 0) {
      toast.error('Adaugă cel puțin o categorie cu o limită validă.');
      return;
    }
    createMutation.mutate({
      month: formData.month,
      year: formData.year,
      totalLimit: formData.totalLimit,
      isTotal: false,
      categories: valid,
    });
  };

  const handleEditClick = (b: Budget) => {
    setEditingBudget(b);
    setFormData({
      month: b.month,
      year: b.year,
      totalLimit: Number(b.totalLimit),
      isTotal: (b as any).isTotal || false,
    });
    if (b.categories && b.categories.length > 0) {
      setCategoryLimits(
        b.categories.map((bc: any) => ({
          categoryId: bc.categoryId,
          limitAmount: Number(bc.limitAmount),
        })),
      );
    } else {
      setCategoryLimits([{ categoryId: '', limitAmount: 0 }]);
    }
    setIsEditModalOpen(true);
  };

  const handleUpdateBudget = () => {
    if (!editingBudget) return;
    const valid = categoryLimits.filter((cl) => cl.categoryId && cl.limitAmount > 0);
    if (!formData.isTotal && valid.length === 0) {
      toast.error('Adaugă cel puțin o categorie cu o limită validă.');
      return;
    }
    updateMutation.mutate({
      id: editingBudget.id,
      data: {
        totalLimit: formData.totalLimit,
        ...(formData.isTotal ? {} : { categories: valid }),
      },
    });
  };

  const handleDeleteClick = (rootBudgetId: string) => {
    if (window.confirm('Sigur doriți să ștergeți acest buget?')) {
      deleteMutation.mutate(rootBudgetId);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Bugete</div>
          <div className="page-sub">
            Stabilește limite lunare și fii la curent cu felul în care îți cheltui banii.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="seg">
            {[selectedMonth - 1, selectedMonth, selectedMonth + 1]
              .filter((m) => m >= 1 && m <= 12)
              .map((m) => (
                <button
                  key={m}
                  className={m === selectedMonth ? 'on' : ''}
                  onClick={() => setSelectedMonth(m)}
                >
                  {getMonthName(m).slice(0, 3)} {m === selectedMonth ? selectedYear : ''}
                </button>
              ))}
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setIsCreateModalOpen(true);
            }}
          >
            <Plus size={14} /> Buget nou
          </button>
        </div>
      </div>

      {/* Total budget hero */}
      <div
        style={{
          background: 'linear-gradient(140deg, #0e0e10 0%, #1a1d2b 100%)',
          color: '#fff',
          borderRadius: 18,
          padding: 28,
          marginBottom: 20,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,71,245,0.5), transparent 65%)',
            filter: 'blur(8px)',
          }}
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 40,
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11.5,
                color: '#a09c92',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Buget total · {getMonthName(selectedMonth).toLowerCase()} {selectedYear}
            </div>
            <div
              className="serif num"
              style={{
                fontSize: 52,
                lineHeight: 1,
                marginTop: 8,
                fontStyle: 'italic',
                letterSpacing: '-0.02em',
              }}
            >
              {fmt(totalSpent)}
              <span style={{ color: '#a09c92', fontStyle: 'italic' }}> / {fmt(totalLimit)}</span>
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontStyle: 'normal',
                  fontSize: 18,
                  color: '#a09c92',
                  marginLeft: 10,
                }}
              >
                RON
              </span>
            </div>
            <div
              style={{
                marginTop: 18,
                height: 8,
                borderRadius: 999,
                background: 'rgba(255,255,255,0.08)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${totalPct}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #0ab39c, #2547f5)',
                  borderRadius: 999,
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 10,
                fontSize: 12,
                color: '#a09c92',
              }}
            >
              <span>
                {Math.round(totalPct)}% utilizat · {daysLeft} zile rămase din lună
              </span>
              <span>
                Rămași: <b style={{ color: '#fff' }}>{fmt(Math.max(0, totalLimit - totalSpent))} RON</b>
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: '#d6d8e3' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
              {cards.length} categorii active
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--expense)' }} />
              {stats.over} depășite
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warn)' }} />
              {stats.near} aproape de limită
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--income)' }} />
              {stats.ok} în limite sănătoase
            </div>
          </div>
        </div>
      </div>

      {/* Per-category cards */}
      {isLoading ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>Se încarcă...</div>
      ) : cards.length === 0 ? (
        <div className="card" style={{ padding: 0 }}>
          <EmptyState
            icon={WalletIcon}
            title="Nu există bugete pentru această lună"
            description="Creează un buget total sau pe categorii pentru a-ți planifica luna."
            action={{
              label: 'Creează primul buget',
              onClick: () => {
                resetForm();
                setIsCreateModalOpen(true);
              },
            }}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {cards.map((c) => (
            <BudgetCardView
              key={c.id}
              b={c}
              onEdit={() => {
                const root = budgets.find((b) => b.id === c.rootBudgetId);
                if (root) handleEditClick(root);
              }}
              onDelete={() => handleDeleteClick(c.rootBudgetId)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Creează buget nou"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Anulează
            </Button>
            <Button variant="primary" onClick={handleCreateBudget} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Se salvează...' : 'Salvează'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select
              label="Luna"
              value={formData.month.toString()}
              onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value, 10) })}
              options={Array.from({ length: 12 }, (_, i) => ({
                value: (i + 1).toString(),
                label: getMonthName(i + 1),
              }))}
            />
            <Input
              label="Anul"
              type="number"
              value={formData.year}
              onChange={(e) =>
                setFormData({ ...formData, year: parseInt(e.target.value, 10) || now.getFullYear() })
              }
            />
          </div>

          <div
            style={{
              padding: 14,
              background: 'var(--bg-subtle)',
              borderRadius: 12,
              border: '1px solid var(--border)',
            }}
          >
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 8 }}>
              Tip buget
            </label>
            <div style={{ display: 'flex', gap: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="radio"
                  name="budgetType"
                  checked={!formData.isTotal}
                  onChange={() => setFormData({ ...formData, isTotal: false })}
                  style={{ accentColor: 'var(--accent)' }}
                />
                Buget pe categorii
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="radio"
                  name="budgetType"
                  checked={formData.isTotal}
                  onChange={() => setFormData({ ...formData, isTotal: true })}
                  style={{ accentColor: 'var(--accent)' }}
                />
                Buget total lunar
              </label>
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 8, marginBottom: 0 }}>
              {formData.isTotal
                ? 'Plafonul general de cheltuieli pentru întreaga lună.'
                : 'Limite separate pentru fiecare categorie de cheltuieli.'}
            </p>
          </div>

          <Input
            label="Limită totală (RON)"
            type="number"
            placeholder="0.00"
            value={formData.totalLimit || ''}
            onChange={(e) => setFormData({ ...formData, totalLimit: parseFloat(e.target.value) || 0 })}
          />

          {!formData.isTotal && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}
              >
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>
                  Limite pe categorii
                </label>
                <Button variant="secondary" onClick={handleAddCategoryLimit}>
                  <Plus size={12} /> Adaugă categorie
                </Button>
              </div>

              {categoryLimits.map((cl, index) => (
                <div
                  key={index}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr auto',
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <Select
                    value={cl.categoryId}
                    onChange={(e) => handleCategoryLimitChange(index, 'categoryId', e.target.value)}
                    options={expenseCategories.map((cat) => ({ value: cat.id, label: `${cat.icon || ''} ${cat.name}`.trim() }))}
                    placeholder="Selectează categoria"
                  />
                  <Input
                    type="number"
                    placeholder="Limită"
                    value={cl.limitAmount || ''}
                    onChange={(e) =>
                      handleCategoryLimitChange(index, 'limitAmount', parseFloat(e.target.value) || 0)
                    }
                  />
                  {categoryLimits.length > 1 && (
                    <button
                      onClick={() => handleRemoveCategoryLimit(index)}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        cursor: 'pointer',
                        color: 'var(--expense)',
                        padding: 6,
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingBudget(null);
          resetForm();
        }}
        title="Editează buget"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingBudget(null);
                resetForm();
              }}
            >
              Anulează
            </Button>
            <Button variant="primary" onClick={handleUpdateBudget} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Se actualizează...' : 'Actualizează'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select
              label="Luna"
              value={formData.month.toString()}
              disabled
              options={Array.from({ length: 12 }, (_, i) => ({
                value: (i + 1).toString(),
                label: getMonthName(i + 1),
              }))}
            />
            <Input label="Anul" type="number" value={formData.year} disabled />
          </div>

          <Input
            label="Limită totală (RON)"
            type="number"
            placeholder="0.00"
            value={formData.totalLimit || ''}
            onChange={(e) => setFormData({ ...formData, totalLimit: parseFloat(e.target.value) || 0 })}
          />

          {!formData.isTotal && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}
              >
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>
                  Limite pe categorii
                </label>
                <Button variant="secondary" onClick={handleAddCategoryLimit}>
                  <Plus size={12} /> Adaugă
                </Button>
              </div>

              {categoryLimits.map((cl, index) => (
                <div
                  key={index}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr auto',
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <Select
                    value={cl.categoryId}
                    onChange={(e) => handleCategoryLimitChange(index, 'categoryId', e.target.value)}
                    options={expenseCategories.map((cat) => ({ value: cat.id, label: `${cat.icon || ''} ${cat.name}`.trim() }))}
                    placeholder="Selectează categoria"
                  />
                  <Input
                    type="number"
                    placeholder="Limită"
                    value={cl.limitAmount || ''}
                    onChange={(e) =>
                      handleCategoryLimitChange(index, 'limitAmount', parseFloat(e.target.value) || 0)
                    }
                  />
                  {categoryLimits.length > 1 && (
                    <button
                      onClick={() => handleRemoveCategoryLimit(index)}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        cursor: 'pointer',
                        color: 'var(--expense)',
                        padding: 6,
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
