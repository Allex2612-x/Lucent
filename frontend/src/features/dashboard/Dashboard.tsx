import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowUp, ArrowDown, Download, Plus, MoreHorizontal, Repeat, Sparkles, AlertTriangle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { statisticsService } from '../../services/statistics.service';
import { transactionsService, TransactionData } from '../../services/transactions.service';
import { categoriesService } from '../../services/categories.service';
import { budgetsService } from '../../services/budgets.service';
import { api } from '../../services/api';
import { Category } from '@sasha-licenta/shared';
import { CHART_COLORS } from '../../styles/colors';
import { useAuthStore } from '../../store/useAuthStore';
import { useCategorySuggestion } from '../../hooks/useCategorySuggestion';
import { CategoryIcon } from '../../components/CategoryIcon';
import { BudgetWarningDialog, BudgetWarningPayload } from '../../components/BudgetWarningDialog';

const fmt = (n: number, dec = 2) =>
  n.toLocaleString('ro-RO', { minimumFractionDigits: dec, maximumFractionDigits: dec });

const MONTH_NAMES = [
  'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
  'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie',
];

function HeroAmount({
  value,
  currency = 'RON',
  delta,
  deltaPositive,
  deltaInverse,
}: {
  value: number;
  currency?: string;
  delta?: string | null;
  deltaPositive?: boolean;
  deltaInverse?: boolean;
}) {
  const [intPart, decPart = '00'] = fmt(value).split(',');
  const showDelta = delta !== undefined && delta !== null;
  const positive = deltaInverse ? !deltaPositive : !!deltaPositive;
  return (
    <div>
      <div
        className="serif num"
        style={{ fontSize: 40, letterSpacing: '-0.025em', lineHeight: 1, fontStyle: 'italic' }}
      >
        <span>{intPart}</span>
        <span style={{ color: 'var(--text-3)' }}>,{decPart}</span>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontStyle: 'normal',
            fontSize: 14,
            color: 'var(--text-3)',
            marginLeft: 8,
            letterSpacing: '0.04em',
          }}
        >
          {currency}
        </span>
      </div>
      {showDelta && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
          <span
            style={{
              color: positive ? 'var(--income)' : 'var(--expense)',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            {positive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {delta}
          </span>
          <span style={{ color: 'var(--text-3)' }}>vs luna trecută</span>
        </div>
      )}
    </div>
  );
}

function Sparkline({ points, color }: { points: number[]; color: string }) {
  if (!points || points.length < 2) {
    return <div style={{ height: 56 }} />;
  }
  const W = 280;
  const H = 56;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = W / (points.length - 1);
  const path = points
    .map(
      (v, i) =>
        `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(1)} ${(
          H - ((v - min) / range) * (H - 6) - 3
        ).toFixed(1)}`,
    )
    .join(' ');
  const area = path + ` L ${W} ${H} L 0 ${H} Z`;
  const id = `grad-${color.replace('#', '')}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 56, display: 'block' }}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.5" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function KpiCard({
  label,
  value,
  delta,
  deltaPositive,
  deltaInverse,
  sparkColor,
  points,
}: {
  label: string;
  value: number;
  delta?: string | null;
  deltaPositive?: boolean;
  deltaInverse?: boolean;
  sparkColor: string;
  points: number[];
}) {
  return (
    <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12.5, color: 'var(--text-2)', fontWeight: 500 }}>{label}</div>
        <MoreHorizontal size={16} style={{ color: 'var(--text-3)' }} />
      </div>
      <HeroAmount value={value} delta={delta} deltaPositive={deltaPositive} deltaInverse={deltaInverse} />
      <Sparkline points={points} color={sparkColor} />
    </div>
  );
}

interface EvolutionPoint {
  name: string;
  income: number;
  expenses: number;
}

function EvolutionChart({ data }: { data: EvolutionPoint[] }) {
  if (data.length === 0) {
    return (
      <div style={{ height: 240, display: 'grid', placeItems: 'center', color: 'var(--text-3)' }}>
        Nu există date pentru afișare.
      </div>
    );
  }
  const W = 720;
  const H = 240;
  const padL = 44;
  const padR = 12;
  const padT = 12;
  const padB = 28;

  const income = data.map((d) => d.income);
  const expense = data.map((d) => d.expenses);
  const all = [...income, ...expense];
  const maxRaw = Math.max(...all, 0);
  const max = Math.max(1000, Math.ceil(maxRaw / 1000) * 1000);
  const minRaw = Math.min(...all, 0);
  const min = Math.min(0, Math.floor(minRaw / 1000) * 1000);

  const xStep = data.length > 1 ? (W - padL - padR) / (data.length - 1) : 0;
  const y = (v: number) => padT + (1 - (v - min) / (max - min)) * (H - padT - padB);
  const lineFor = (arr: number[]) =>
    arr
      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${(padL + i * xStep).toFixed(1)} ${y(v).toFixed(1)}`)
      .join(' ');
  const areaFor = (arr: number[]) =>
    lineFor(arr) +
    ` L ${(padL + (arr.length - 1) * xStep).toFixed(1)} ${H - padB} L ${padL} ${H - padB} Z`;

  const gridSteps = 4;
  const gridLines = Array.from({ length: gridSteps + 1 }, (_, i) =>
    Math.round(min + ((max - min) / gridSteps) * i),
  );

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 240, display: 'block' }}>
      <defs>
        <linearGradient id="ev-inc" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#0ab39c" stopOpacity="0.18" />
          <stop offset="1" stopColor="#0ab39c" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ev-exp" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f5556e" stopOpacity="0.16" />
          <stop offset="1" stopColor="#f5556e" stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridLines.map((v) => (
        <g key={v}>
          <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="#e7e3d9" strokeDasharray="2 4" />
          <text x={padL - 8} y={y(v) + 4} textAnchor="end" fontSize="10.5" fill="#8c8879" fontFamily="var(--font-mono)">
            {v.toLocaleString('ro-RO')}
          </text>
        </g>
      ))}
      <path d={areaFor(income)} fill="url(#ev-inc)" />
      <path d={areaFor(expense)} fill="url(#ev-exp)" />
      <path d={lineFor(income)} fill="none" stroke="#0ab39c" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <path d={lineFor(expense)} fill="none" stroke="#f5556e" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {[
        { a: income, c: '#0ab39c' },
        { a: expense, c: '#f5556e' },
      ].map(({ a, c }, k) => (
        <circle
          key={k}
          cx={padL + (a.length - 1) * xStep}
          cy={y(a[a.length - 1])}
          r="4"
          fill="#fff"
          stroke={c}
          strokeWidth="2"
        />
      ))}
      {data.map((d, i) =>
        i % Math.max(1, Math.floor(data.length / 6)) === 0 ? (
          <text
            key={`${d.name}-${i}`}
            x={padL + i * xStep}
            y={H - 8}
            textAnchor="middle"
            fontSize="10.5"
            fill="#8c8879"
          >
            {d.name}
          </text>
        ) : null,
      )}
    </svg>
  );
}

interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

function CategoryDonut({ data, monthLabel }: { data: DonutSlice[]; monthLabel: string }) {
  if (data.length === 0) {
    return (
      <div style={{ height: 170, display: 'grid', placeItems: 'center', color: 'var(--text-3)' }}>
        Nu există cheltuieli.
      </div>
    );
  }
  const total = data.reduce((s, d) => s + d.value, 0);
  const R = 80;
  const r = 56;
  const cx = 100;
  const cy = 100;
  let acc = -Math.PI / 2;
  const arcs = data.map((d) => {
    const a = (d.value / total) * Math.PI * 2;
    const x1 = cx + R * Math.cos(acc);
    const y1 = cy + R * Math.sin(acc);
    const x2 = cx + R * Math.cos(acc + a);
    const y2 = cy + R * Math.sin(acc + a);
    const xi2 = cx + r * Math.cos(acc + a);
    const yi2 = cy + r * Math.sin(acc + a);
    const xi1 = cx + r * Math.cos(acc);
    const yi1 = cy + r * Math.sin(acc);
    const large = a > Math.PI ? 1 : 0;
    const path = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${r} ${r} 0 ${large} 0 ${xi1} ${yi1} Z`;
    acc += a;
    return { ...d, path };
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
      <svg viewBox="0 0 200 200" width="170" height="170" style={{ flex: '0 0 170px' }}>
        {arcs.map((a, i) => (
          <path key={i} d={a.path} fill={a.color} />
        ))}
        <text x="100" y="92" textAnchor="middle" fontSize="11" fill="#8c8879" letterSpacing="0.04em">
          CHELTUIELI
        </text>
        <text x="100" y="115" textAnchor="middle" fontSize="22" fontFamily="var(--font-serif)" fontStyle="italic" fill="#0e0e10">
          {fmt(total, 0)}
        </text>
        <text x="100" y="130" textAnchor="middle" fontSize="10" fill="#8c8879">
          RON · {monthLabel}
        </text>
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: d.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--text-2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {d.name}
            </span>
            <span className="num" style={{ fontWeight: 500 }}>{fmt(d.value, 0)}</span>
            <span
              className="mono"
              style={{ color: 'var(--text-3)', fontSize: 11.5, width: 38, textAlign: 'right' }}
            >
              {Math.round((d.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthLabel = `${MONTH_NAMES[currentMonth - 1]} ${currentYear}`;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [budgetWarning, setBudgetWarning] = useState<BudgetWarningPayload | null>(null);
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

  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['statistics', 'overview', currentMonth, currentYear],
    queryFn: () => statisticsService.getOverview({ month: currentMonth, year: currentYear }),
  });

  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const { data: prevOverviewData } = useQuery({
    queryKey: ['statistics', 'overview', prevMonth, prevYear],
    queryFn: () => statisticsService.getOverview({ month: prevMonth, year: prevYear }),
  });

  const { data: trendData } = useQuery({
    queryKey: ['statistics', 'monthly-trend'],
    queryFn: () => statisticsService.getMonthlyTrend({ months: 12 }),
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', 'recent'],
    queryFn: () => transactionsService.getAll(),
    select: (data) => data.data.data.slice(0, 5),
  });

  const { data: categoryStats } = useQuery({
    queryKey: ['statistics', 'by-category', currentMonth, currentYear],
    queryFn: () =>
      statisticsService.getByCategory({
        startDate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
        type: 'expense',
      }),
  });

  const { data: anomaliesData } = useQuery({
    queryKey: ['statistics', 'anomalies'],
    queryFn: () => statisticsService.getAnomalies(),
    select: (res) => res.data?.data ?? [],
  });
  const [dismissedAnomalies, setDismissedAnomalies] = useState<Set<string>>(new Set());
  const visibleAnomalies = (anomaliesData ?? []).filter((a) => !dismissedAnomalies.has(a.id));

  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getAll(),
  });

  const { data: budgetsResponse } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => budgetsService.getAll(),
  });

  const overview = overviewData?.data?.data;
  const prevOverview = prevOverviewData?.data?.data;
  const recentTransactions = transactionsData || [];
  const categories: Category[] = categoriesResponse?.data?.data || [];
  const budgets = budgetsResponse?.data?.data || [];

  const balance = overview?.balance ?? 0;
  const totalIncome = overview?.totalIncome ?? 0;
  const totalExpenses = overview?.totalExpenses ?? 0;

  const calcDelta = (current: number, previous: number) => {
    if (!previous) return null;
    const pct = ((current - previous) / Math.abs(previous)) * 100;
    return {
      label: `${Math.abs(pct).toFixed(1).replace('.', ',')}%`,
      positive: pct >= 0,
    };
  };

  const balanceDelta = prevOverview ? calcDelta(balance, prevOverview.balance) : null;
  const incomeDelta = prevOverview ? calcDelta(totalIncome, prevOverview.totalIncome) : null;
  const expenseDelta = prevOverview ? calcDelta(totalExpenses, prevOverview.totalExpenses) : null;

  const trendPoints = (trendData?.data?.data || []) as Array<{
    month: number;
    year: number;
    income: number;
    expenses: number;
    balance: number;
  }>;
  // Show every month in the 12-month window, even zero-only ones, so a
  // brand-new user with data only in the current month still sees a line
  // (otherwise a single non-zero point has no segment to draw).
  const evolutionData: EvolutionPoint[] = trendPoints.map((p) => ({
    name: `${MONTH_NAMES[p.month - 1].slice(0, 3)}`,
    income: p.income,
    expenses: p.expenses,
  }));

  const sparkBalance = trendPoints.map((p) => p.balance);
  const sparkIncome = trendPoints.map((p) => p.income);
  const sparkExpense = trendPoints.map((p) => p.expenses);

  const donutSlices: DonutSlice[] = (categoryStats?.data?.data || []).map((row: any, idx: number) => ({
    name: row.categoryName,
    value: Number(row.total),
    color: row.categoryColor || CHART_COLORS[idx % CHART_COLORS.length],
  }));

  const spentByCategoryId: Record<string, number> = (categoryStats?.data?.data || []).reduce(
    (acc: Record<string, number>, row: any) => {
      acc[row.categoryId] = Number(row.total);
      return acc;
    },
    {},
  );

  const budgetItems: Array<{ name: string; spent: number; limit: number; color: string }> = budgets
    .filter((b: any) => b.month === currentMonth && b.year === currentYear)
    .flatMap((b: any) => {
      if (b.isTotal || !b.categories || b.categories.length === 0) {
        return [
          {
            name: `Buget total · ${MONTH_NAMES[b.month - 1]}`,
            spent: totalExpenses,
            limit: Number(b.totalLimit ?? 0),
            color: CHART_COLORS[0],
          },
        ];
      }
      return b.categories.map((bc: any) => ({
        name: bc.category?.name || 'Categorie',
        spent: spentByCategoryId[bc.categoryId] || 0,
        limit: Number(bc.limitAmount ?? 0),
        color: bc.category?.color || CHART_COLORS[0],
      }));
    })
    .slice(0, 3);

  const createMutation = useMutation({
    mutationFn: ({ data, force }: { data: TransactionData; force?: boolean }) =>
      transactionsService.create(data, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
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
        setBudgetWarning(payload.warning ?? { categoryName: 'Necunoscut' });
        return;
      }
      const message = payload?.message || 'Eroare la salvarea tranzacției. Încearcă din nou.';
      toast.error(message);
    },
  });

  const submitNewTransaction = () => {
    if (!formData.categoryId || formData.amount <= 0) {
      toast.error('Completează suma și categoria.');
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
    createMutation.mutate({ data: payload });
  };

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

  const filteredCategories = categories.filter((cat) => cat.type === formData.type);
  const getCategory = (id: string) => categories.find((c) => c.id === id);

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(currentYear, currentMonth, 0).getDate();
      const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const response = await api.get('/reports/export/pdf', {
        params: { startDate, endDate },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `faro-dashboard-${currentYear}-${String(currentMonth).padStart(2, '0')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Raport exportat.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Eroare la exportul raportului.');
    } finally {
      setIsExporting(false);
    }
  };

  const currentUser = useAuthStore((s) => s.user);
  const firstName = currentUser?.firstName?.trim() || '';
  const { greeting, motto } = (() => {
    const hour = new Date().getHours();
    if (hour < 5) return { greeting: 'Bună seara', motto: 'Noaptea numără — un bilanț scurt înainte de odihnă.' };
    if (hour < 12) return { greeting: 'Bună dimineața', motto: 'O cafea, o privire calmă peste banii tăi.' };
    if (hour < 18) return { greeting: 'Bună ziua', motto: 'Banii la zi — fără filtre, fără surprize.' };
    return { greeting: 'Bună seara', motto: 'Bilanțul de seară — calm, complet, clar.' };
  })();
  const fullGreeting = firstName ? `${greeting}, ${firstName}` : greeting;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">{fullGreeting}</div>
          <div className="page-sub">{motto}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="seg">
            <button>7z</button>
            <button className="on">30z</button>
            <button>90z</button>
            <button>An</button>
          </div>
          <button className="btn btn-secondary" onClick={handleExport} disabled={isExporting}>
            <Download size={14} /> {isExporting ? 'Se exportă...' : 'Export'}
          </button>
          <button
            className="btn btn-primary"
            // Single source of truth for "Adaugă tranzacție" — the full
            // form (with OCR receipt scan + AI category suggestion) lives
            // on /transactions. Navigate there with ?add=true so the
            // modal opens automatically.
            onClick={() => navigate('/transactions?add=true')}
          >
            <Plus size={14} /> Tranzacție
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginBottom: 18 }}>
        <KpiCard
          label="Sold curent"
          value={overviewLoading ? 0 : balance}
          delta={balanceDelta?.label ?? null}
          deltaPositive={balanceDelta?.positive}
          sparkColor="#2547f5"
          points={sparkBalance}
        />
        <KpiCard
          label="Venituri (luna curentă)"
          value={overviewLoading ? 0 : totalIncome}
          delta={incomeDelta?.label ?? null}
          deltaPositive={incomeDelta?.positive}
          sparkColor="#0ab39c"
          points={sparkIncome}
        />
        <KpiCard
          label="Cheltuieli (luna curentă)"
          value={overviewLoading ? 0 : totalExpenses}
          delta={expenseDelta?.label ?? null}
          deltaPositive={expenseDelta?.positive}
          deltaInverse
          sparkColor="#f5556e"
          points={sparkExpense}
        />
      </div>

      {visibleAnomalies.length > 0 && (
        <div
          className="card"
          style={{
            marginBottom: 18,
            border: '1px solid rgba(232,155,28,0.3)',
            background:
              'linear-gradient(135deg, rgba(232,155,28,0.06) 0%, rgba(232,155,28,0.02) 100%)',
            padding: 18,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'var(--warn-soft)',
                color: 'var(--warn)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {visibleAnomalies.length === 1
                      ? '1 tranzacție neobișnuită'
                      : `${visibleAnomalies.length} tranzacții neobișnuite`}{' '}
                    detectate
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                    Sume considerabil peste media istorică a categoriei (Z-score ≥ 2).
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {visibleAnomalies.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '32px 1fr auto auto',
                      gap: 12,
                      alignItems: 'center',
                      padding: '10px 12px',
                      background: '#fff',
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 9,
                        background: `${a.categoryColor || '#a09c92'}1a`,
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 14,
                      }}
                    >
                      {a.categoryIcon || '⚠️'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {a.description || a.categoryName}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>
                        Media „{a.categoryName}":{' '}
                        <span className="num">{fmt(a.meanAmount, 0)} RON</span> ·{' '}
                        {new Date(a.date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <div
                      className="num"
                      style={{ fontWeight: 600, fontSize: 14, color: 'var(--expense)' }}
                    >
                      {fmt(a.amount, 0)}
                      <span style={{ color: 'var(--text-3)', fontWeight: 400, fontSize: 11, marginLeft: 3 }}>
                        RON
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDismissedAnomalies((prev) => {
                          const next = new Set(prev);
                          next.add(a.id);
                          return next;
                        })
                      }
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-3)',
                        padding: 4,
                        borderRadius: 6,
                      }}
                      title="Ignoră"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {visibleAnomalies.length > 3 && (
                  <button
                    type="button"
                    onClick={() => navigate('/transactions')}
                    className="btn btn-ghost btn-sm"
                    style={{ alignSelf: 'flex-start', color: 'var(--accent)' }}
                  >
                    Vezi toate {visibleAnomalies.length} →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18, marginBottom: 18 }}>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Evoluție venituri & cheltuieli</div>
              <div className="card-sub">12 luni · trend lunar</div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span className="chip-dot" style={{ background: '#0ab39c' }} /> Venituri
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span className="chip-dot" style={{ background: '#f5556e' }} /> Cheltuieli
              </span>
            </div>
          </div>
          <EvolutionChart data={evolutionData} />
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Distribuție pe categorii</div>
              <div className="card-sub">Cheltuieli · {monthLabel}</div>
            </div>
          </div>
          <CategoryDonut data={donutSlices} monthLabel={monthLabel} />
        </div>
      </div>

      {/* Recent + budgets */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18 }}>
        <div className="card" style={{ padding: 0 }}>
          <div
            style={{
              padding: '18px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div>
              <div className="card-title">Tranzacții recente</div>
              <div className="card-sub">Ultimele 5 mișcări</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/transactions')}>
              Vezi toate →
            </button>
          </div>
          <div>
            {transactionsLoading ? (
              <div style={{ padding: 24, color: 'var(--text-3)' }}>Se încarcă...</div>
            ) : recentTransactions.length === 0 ? (
              <div style={{ padding: 24, color: 'var(--text-3)' }}>Nu există tranzacții încă.</div>
            ) : (
              recentTransactions.map((t: any, i: number) => {
                const cat = getCategory(t.categoryId);
                const amt = Number(t.amount);
                const isIncome = t.type === 'income';
                return (
                  <div
                    key={t.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '36px 1fr auto',
                      gap: 14,
                      alignItems: 'center',
                      padding: '14px 20px',
                      borderBottom: i < recentTransactions.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: cat?.color ? `${cat.color}1f` : 'var(--bg-inset)',
                        color: cat?.color || 'var(--text-2)',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <CategoryIcon icon={cat?.icon} name={cat?.name} size={17} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 500,
                          fontSize: 13.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {t.description || (isIncome ? 'Venit' : 'Cheltuială')}
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: 'var(--text-3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginTop: 2,
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <span className="chip-dot" style={{ background: cat?.color || '#a09c92' }} />
                          {cat?.name || 'Fără categorie'}
                        </span>
                        <span style={{ color: 'var(--text-3)' }}>·</span>
                        <span>
                          {new Date(t.date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                    <div
                      className="num"
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color: isIncome ? 'var(--income)' : 'var(--text-1)',
                      }}
                    >
                      {isIncome ? '+' : '−'} {fmt(Math.abs(amt))}
                      <span style={{ color: 'var(--text-3)', fontWeight: 400, marginLeft: 4, fontSize: 11.5 }}>
                        RON
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Bugete — {monthLabel}</div>
              <div className="card-sub">Progres pe categorii</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/budgets')}>
              Gestionează →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {budgetItems.length === 0 ? (
              <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Nu ai configurat bugete pentru această perioadă.</div>
            ) : (
              budgetItems.map((b, i) => {
                const pct = b.limit ? Math.min((b.spent / b.limit) * 100, 130) : 0;
                const over = b.spent > b.limit && b.limit > 0;
                return (
                  <div key={i}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{b.name}</span>
                      <span className="num" style={{ fontSize: 12, color: 'var(--text-2)' }}>
                        <b style={{ color: over ? 'var(--expense)' : 'var(--text-1)' }}>{fmt(b.spent, 0)}</b>
                        <span style={{ color: 'var(--text-3)' }}> / {fmt(b.limit, 0)} RON</span>
                      </span>
                    </div>
                    <div className="pbar">
                      <span style={{ width: `${Math.min(pct, 100)}%`, background: over ? 'var(--expense)' : b.color }} />
                    </div>
                    {over && (
                      <div style={{ fontSize: 11, color: 'var(--expense)', marginTop: 4 }}>
                        Depășit cu {fmt(b.spent - b.limit, 0)} RON
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Adaugă tranzacție nouă"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Anulează
            </Button>
            <Button
              variant="primary"
              onClick={submitNewTransaction}
              disabled={createMutation.isPending || !formData.categoryId || formData.amount <= 0}
            >
              {createMutation.isPending ? 'Se salvează...' : 'Salvează'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <Input
              label="Descriere"
              placeholder="Ex: Cumpărături supermarket"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <Input
            label="Sumă (RON)"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.amount || ''}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
          />
          <Input
            label="Data"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
          <Select
            label="Tip"
            value={formData.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value as 'income' | 'expense',
                categoryId: '',
              })
            }
            options={[
              { value: 'income', label: 'Venit' },
              { value: 'expense', label: 'Cheltuială' },
            ]}
          />
          <div className="input-wrapper" style={{ marginBottom: 0 }}>
            <label
              className="input-label"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
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
                  }}
                  title={`Sugerat după "${addSuggestion.matchedKeyword}"`}
                >
                  <Sparkles size={10} /> sugerat automat
                </span>
              )}
            </label>
            <select
              className="input-field"
              value={formData.categoryId}
              onChange={(e) => {
                setFormData({ ...formData, categoryId: e.target.value });
                setUserPickedCategory(true);
              }}
            >
              <option value="">Selectează categoria</option>
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {`${cat.icon || ''} ${cat.name}`.trim()}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              gridColumn: '1 / -1',
              padding: 14,
              border: '1px solid var(--border)',
              borderRadius: 12,
              background: 'var(--bg-subtle)',
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
                <Select
                  label="Frecvență"
                  value={formData.frequency ?? 'monthly'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      frequency: e.target.value as TransactionData['frequency'],
                    })
                  }
                  options={[
                    { value: 'daily', label: 'Zilnic' },
                    { value: 'weekly', label: 'Săptămânal' },
                    { value: 'monthly', label: 'Lunar' },
                    { value: 'yearly', label: 'Anual' },
                  ]}
                />
                <Input
                  label="Număr de repetări"
                  type="number"
                  min={1}
                  max={365}
                  placeholder="ex: 12"
                  value={formData.repetitionCount ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      repetitionCount: parseInt(e.target.value, 10) || undefined,
                    })
                  }
                />
              </div>
            )}
          </div>
        </div>
      </Modal>

      <BudgetWarningDialog
        warning={budgetWarning}
        onCancel={() => setBudgetWarning(null)}
        onConfirm={() => {
          createMutation.mutate({ data: formData, force: true });
          setBudgetWarning(null);
        }}
        isPending={createMutation.isPending}
      />
    </>
  );
}
