import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeftRight,
  Calendar,
  Cog,
  FileText,
  Sheet,
  Sparkles,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { statisticsService } from '../../services/statistics.service';
import { categoriesService } from '../../services/categories.service';
import { api } from '../../services/api';
import { CHART_COLORS } from '../../styles/colors';
import { Category } from '../../types/shared';
import { CategoryIcon } from '../../components/CategoryIcon';

const fmt = (n: number, dec = 2) =>
  n.toLocaleString('ro-RO', { minimumFractionDigits: dec, maximumFractionDigits: dec });

const ROMANIAN_MONTHS = [
  'ian', 'feb', 'mar', 'apr', 'mai', 'iun',
  'iul', 'aug', 'sep', 'oct', 'noi', 'dec',
];

type ReportType = 'income' | 'expense' | 'all';
type Preset = 'this-month' | 'last-30' | 'this-quarter' | 'ytd' | 'last-year' | 'custom';

function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function rangeForPreset(preset: Preset) {
  const now = new Date();
  const today = toIsoDate(now);
  if (preset === 'this-month') {
    return { start: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)), end: today };
  }
  if (preset === 'last-30') {
    const s = new Date(now);
    s.setDate(now.getDate() - 30);
    return { start: toIsoDate(s), end: today };
  }
  if (preset === 'this-quarter') {
    return {
      start: toIsoDate(new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)),
      end: today,
    };
  }
  if (preset === 'ytd') {
    return { start: toIsoDate(new Date(now.getFullYear(), 0, 1)), end: today };
  }
  if (preset === 'last-year') {
    return {
      start: toIsoDate(new Date(now.getFullYear() - 1, 0, 1)),
      end: toIsoDate(new Date(now.getFullYear() - 1, 11, 31)),
    };
  }
  return { start: today, end: today };
}

function MiniLine({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length === 0) return <div style={{ height: 38 }} />;
  const W = 160;
  const H = 38;
  const padY = 4;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = data.length > 1 ? W / (data.length - 1) : 0;
  const y = (v: number) => padY + (1 - (v - min) / range) * (H - 2 * padY);
  const pts = data.map((v, i) => `${(i * step).toFixed(1)},${y(v).toFixed(1)}`);
  const line = `M ${pts.join(' L ')}`;
  const last = data[data.length - 1]!;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: H, display: 'block' }}>
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => (
        <circle key={i} cx={(i * step).toFixed(1)} cy={y(v).toFixed(1)} r={1.5} fill={color} opacity={0.5} />
      ))}
      <circle cx={((data.length - 1) * step).toFixed(1)} cy={y(last).toFixed(1)} r={2.5} fill="#fff" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

export function Reports() {
  const now = new Date();

  // ===== Builder state =====
  const [reportType, setReportType] = useState<ReportType>('expense');
  const [preset, setPreset] = useState<Preset>('ytd');
  const ytd = rangeForPreset('ytd');
  const [startDate, setStartDate] = useState(ytd.start);
  const [endDate, setEndDate] = useState(ytd.end);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
  const [categoriesInitialized, setCategoriesInitialized] = useState(false);
  const applyPreset = (p: Preset) => {
    setPreset(p);
    if (p !== 'custom') {
      const r = rangeForPreset(p);
      setStartDate(r.start);
      setEndDate(r.end);
    }
  };

  // ===== Data =====
  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getAll(),
  });
  const allCategories: Category[] = categoriesResponse?.data?.data || [];

  // Initialize selection to "all" the first time categories are loaded
  useEffect(() => {
    if (!categoriesInitialized && allCategories.length > 0) {
      setSelectedCategoryIds(new Set(allCategories.map((c) => c.id)));
      setCategoriesInitialized(true);
    }
  }, [allCategories, categoriesInitialized]);

  // Categories available for the chosen report type
  const eligibleCategories = useMemo(() => {
    if (reportType === 'all') return allCategories;
    return allCategories.filter((c) => c.type === reportType);
  }, [allCategories, reportType]);

  const fetchType: 'income' | 'expense' | undefined =
    reportType === 'all' ? undefined : reportType;

  const { data: categoryData, isLoading: categoryLoading, refetch: refetchCategory } = useQuery({
    queryKey: ['statistics', 'by-category', startDate, endDate, fetchType ?? 'all'],
    queryFn: () =>
      statisticsService.getByCategory({
        startDate,
        endDate,
        type: fetchType,
      }),
  });

  const { data: trendData, refetch: refetchTrend } = useQuery({
    queryKey: ['statistics', 'monthly-trend', startDate, endDate],
    queryFn: () => statisticsService.getMonthlyTrend({ startDate, endDate }),
  });

  const trendPoints: Array<{ month: number; year: number; income: number; expenses: number }> =
    trendData?.data?.data || [];

  // ===== Derived rows =====
  const rows = useMemo(() => {
    const list = (categoryData?.data?.data || []) as Array<{
      categoryId: string;
      categoryName: string;
      categoryIcon?: string;
      categoryColor?: string;
      total: number;
      count: number;
      percentage: number;
    }>;
    const filtered = list.filter((r) => selectedCategoryIds.has(r.categoryId));
    const total = filtered.reduce((s, r) => s + Number(r.total), 0);
    return filtered.map((r, idx) => {
      const cat = allCategories.find((c) => c.id === r.categoryId);
      const series =
        fetchType === 'income'
          ? trendPoints.map((p) => p.income)
          : fetchType === 'expense'
          ? trendPoints.map((p) => p.expenses)
          : trendPoints.map((p) => p.income + p.expenses);
      return {
        catId: r.categoryId,
        cat: r.categoryName,
        icon: cat?.icon || r.categoryIcon || '📁',
        color: cat?.color || r.categoryColor || CHART_COLORS[idx % CHART_COLORS.length],
        type: cat?.type ?? 'expense',
        count: Number(r.count || 0),
        subtotal: Number(r.total),
        share: total > 0 ? (Number(r.total) / total) * 100 : 0,
        spark: series.slice(-12),
      };
    });
  }, [categoryData, allCategories, trendPoints, fetchType, selectedCategoryIds]);

  const total = rows.reduce((s, r) => s + r.subtotal, 0);
  const count = rows.reduce((s, r) => s + r.count, 0);
  const avg = count > 0 ? total / count : 0;
  const topCategory = [...rows].sort((a, b) => b.subtotal - a.subtotal)[0];

  // ===== Period helpers =====
  const periodDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return Math.max(1, Math.floor((+new Date(endDate) - +new Date(startDate)) / 86_400_000) + 1);
  }, [startDate, endDate]);
  const periodMonths = Math.max(1, Math.round(periodDays / 30));
  const periodWeeks = Math.max(1, Math.round(periodDays / 7));

  const reportTitle = useMemo(() => {
    const label = reportType === 'income' ? 'Raport venituri' : reportType === 'expense' ? 'Raport cheltuieli' : 'Raport complet';
    const ms = new Date(startDate).getMonth();
    const me = new Date(endDate).getMonth();
    const ys = new Date(startDate).getFullYear();
    const ye = new Date(endDate).getFullYear();
    if (ys === ye) {
      return `${label} · ${ROMANIAN_MONTHS[ms]}–${ROMANIAN_MONTHS[me]} ${ys}`;
    }
    return `${label} · ${ROMANIAN_MONTHS[ms]} ${ys}–${ROMANIAN_MONTHS[me]} ${ye}`;
  }, [reportType, startDate, endDate]);

  // ===== Actions =====
  const regenerate = async () => {
    await Promise.all([refetchCategory(), refetchTrend()]);
    toast.success('Raport regenerat.');
  };

  const download = async (format: 'pdf' | 'excel') => {
    try {
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
      link.setAttribute('download', `raport-financiar-${startDate}_${endDate}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`Raport ${format.toUpperCase()} descărcat.`);
    } catch {
      toast.error(`Eroare la exportul ${format.toUpperCase()}.`);
    }
  };

  const toggleCategory = (id: string) =>
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectAllCategories = () =>
    setSelectedCategoryIds(new Set(eligibleCategories.map((c) => c.id)));
  const invertCategoriesSelection = () => {
    setSelectedCategoryIds((prev) => {
      const next = new Set<string>();
      for (const c of eligibleCategories) if (!prev.has(c.id)) next.add(c.id);
      return next;
    });
  };

  // When report type changes, prune selection to eligible categories
  useEffect(() => {
    setSelectedCategoryIds((prev) => {
      const next = new Set<string>();
      for (const c of eligibleCategories) if (prev.has(c.id)) next.add(c.id);
      // if everything got pruned, default to all eligible
      if (next.size === 0 && eligibleCategories.length > 0) {
        for (const c of eligibleCategories) next.add(c.id);
      }
      return next;
    });
  }, [reportType, eligibleCategories.length]);

  // ===== Render =====
  const stepLabelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-2)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 10,
  };
  const stepNumberStyle: React.CSSProperties = {
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: 'var(--accent)',
    color: '#fff',
    display: 'grid',
    placeItems: 'center',
    fontSize: 10,
    fontWeight: 700,
  };

  const typeButton = (
    type: ReportType,
    label: string,
    Icon: typeof ArrowUp,
    color: string,
  ) => {
    const on = reportType === type;
    return (
      <button
        type="button"
        onClick={() => setReportType(type)}
        style={{
          flex: 1,
          padding: '14px 8px',
          borderRadius: 12,
          border: `1px solid ${on ? color : 'var(--border)'}`,
          background: on ? `${color}14` : '#fff',
          cursor: 'pointer',
          fontFamily: 'inherit',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          transition: 'all .12s',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: on ? color : 'var(--bg-inset)',
            color: on ? '#fff' : 'var(--text-3)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Icon size={16} />
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: on ? color : 'var(--text-1)' }}>
          {label}
        </div>
      </button>
    );
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Rapoarte</div>
          <div className="page-sub">
            Configurează un raport în 3 pași, vizualizează rezultatul, exportă în formatul dorit.
          </div>
        </div>
      </div>

      <div className="reports-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 18, alignItems: 'flex-start' }}>
        {/* ===== RIGHT — BUILDER (order:2 in grid) ===== */}
        <div
          className="card reports-builder"
          style={{
            padding: 0,
            position: 'sticky',
            top: 18,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 96px)',
            order: 2,
          }}
        >
          {/* Builder header */}
          <div
            style={{
              padding: '16px 18px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                background: 'var(--bg-inset)',
                color: 'var(--text-2)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Cog size={15} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Generator raport</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                Configurează ce vrei să exporți
              </div>
            </div>
          </div>

          {/* Steps scrollable area */}
          <div style={{ overflowY: 'auto', flex: 1, padding: 18 }}>
            {/* Step 1: Tip raport */}
            <div style={{ marginBottom: 20 }}>
              <div style={stepLabelStyle}>
                <span style={stepNumberStyle}>1</span>Tip raport
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {typeButton('income', 'Venituri', ArrowUp, '#0ab39c')}
                {typeButton('expense', 'Cheltuieli', ArrowDown, '#f5556e')}
                {typeButton('all', 'Complet', ArrowLeftRight, '#2547f5')}
              </div>
            </div>

            {/* Step 2: Perioadă */}
            <div style={{ marginBottom: 20 }}>
              <div style={stepLabelStyle}>
                <span style={stepNumberStyle}>2</span>Perioadă
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {(
                  [
                    { value: 'this-month', label: 'Luna curentă' },
                    { value: 'last-30', label: 'Ultimele 30 zile' },
                    { value: 'this-quarter', label: 'Trimestrul curent' },
                    { value: 'ytd', label: 'Anul curent' },
                    { value: 'last-year', label: 'Anul trecut' },
                    { value: 'custom', label: 'Personalizat' },
                  ] as Array<{ value: Preset; label: string }>
                ).map((opt) => {
                  const on = preset === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => applyPreset(opt.value)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                        background: on ? 'var(--accent-soft)' : '#fff',
                        color: on ? 'var(--accent-ink)' : 'var(--text-2)',
                        fontSize: 11.5,
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  className="chip"
                  style={{ background: '#fff', padding: '3px 8px', flex: 1, gap: 6 }}
                >
                  <Calendar size={11} />
                  <input
                    type="date"
                    value={startDate}
                    max={endDate || undefined}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPreset('custom');
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      fontFamily: 'inherit',
                      fontSize: 11.5,
                      color: 'var(--text-1)',
                      outline: 'none',
                      flex: 1,
                      width: '100%',
                    }}
                  />
                </span>
                <span style={{ color: 'var(--text-3)' }}>→</span>
                <span
                  className="chip"
                  style={{ background: '#fff', padding: '3px 8px', flex: 1, gap: 6 }}
                >
                  <Calendar size={11} />
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    max={toIsoDate(now)}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPreset('custom');
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      fontFamily: 'inherit',
                      fontSize: 11.5,
                      color: 'var(--text-1)',
                      outline: 'none',
                      flex: 1,
                      width: '100%',
                    }}
                  />
                </span>
              </div>
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-3)' }}>
                {periodDays} zile · {periodMonths} {periodMonths === 1 ? 'lună' : 'luni'} · ~{periodWeeks} săpt.
              </div>
            </div>

            {/* Step 3: Categorii */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={stepLabelStyle as any}>
                  <span style={stepNumberStyle}>3</span>Categorii
                </div>
                <span style={{ fontSize: 10.5, color: 'var(--text-3)' }}>
                  {selectedCategoryIds.size}/{eligibleCategories.length} selectate
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 8, fontSize: 11.5 }}>
                <button
                  type="button"
                  onClick={selectAllCategories}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    padding: 0,
                    fontFamily: 'inherit',
                    fontSize: 11.5,
                    fontWeight: 500,
                  }}
                >
                  Selectează toate
                </button>
                <button
                  type="button"
                  onClick={invertCategoriesSelection}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-2)',
                    cursor: 'pointer',
                    padding: 0,
                    fontFamily: 'inherit',
                    fontSize: 11.5,
                    fontWeight: 500,
                  }}
                >
                  Inversează
                </button>
              </div>
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  maxHeight: 200,
                  overflowY: 'auto',
                  background: 'var(--bg-subtle)',
                }}
              >
                {eligibleCategories.length === 0 ? (
                  <div style={{ padding: 12, fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>
                    Nicio categorie disponibilă.
                  </div>
                ) : (
                  eligibleCategories.map((cat) => {
                    const checked = selectedCategoryIds.has(cat.id);
                    const stat = (categoryData?.data?.data ?? []).find((r: any) => r.categoryId === cat.id);
                    const tx = stat ? Number(stat.count || 0) : 0;
                    return (
                      <label
                        key={cat.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'auto 1fr auto',
                          gap: 8,
                          alignItems: 'center',
                          padding: '8px 12px',
                          fontSize: 12.5,
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--border)',
                          background: checked ? '#fff' : 'transparent',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCategory(cat.id)}
                          style={{ accentColor: 'var(--accent)' }}
                        />
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span>{cat.icon || '📁'}</span>
                          <span>{cat.name}</span>
                        </span>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                          {tx} tx
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* Builder footer */}
          <div
            style={{
              padding: 16,
              borderTop: '1px solid var(--border)',
              background: 'var(--bg-subtle)',
            }}
          >
            <button
              type="button"
              onClick={regenerate}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', height: 40 }}
            >
              <Sparkles size={14} /> Generează raport
            </button>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 14,
                marginTop: 10,
                fontSize: 11.5,
              }}
            >
              <button
                type="button"
                onClick={() => download('pdf')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 11.5,
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <FileText size={11} /> PDF
              </button>
              <button
                type="button"
                onClick={() => download('excel')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 11.5,
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Sheet size={11} /> Excel
              </button>
            </div>
          </div>
        </div>

        {/* ===== LEFT — PREVIEW (order:1 in grid) ===== */}
        <div className="reports-preview" style={{ display: 'flex', flexDirection: 'column', gap: 16, order: 1 }}>
          {/* Preview header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <span
                className="chip"
                style={{
                  background: 'var(--income-soft)',
                  color: 'var(--income)',
                  border: 'none',
                  marginBottom: 6,
                }}
              >
                <span className="chip-dot" style={{ background: 'var(--income)' }} />
                Previzualizare raport · proaspăt generat
              </span>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>
                {reportTitle}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-secondary btn-sm" onClick={regenerate}>
                <Sparkles size={12} /> Regenerează
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => download('pdf')}>
                <Eye size={12} /> Previzualizare PDF
              </button>
            </div>
          </div>

          {/* KPI row */}
          <div className="r-grid-4">
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Total {reportType === 'income' ? 'venituri' : reportType === 'expense' ? 'cheltuieli' : 'operațiuni'}
              </div>
              <div
                className="serif num"
                style={{ fontSize: 26, fontStyle: 'italic', letterSpacing: '-0.02em', marginTop: 4 }}
              >
                {fmt(total)}{' '}
                <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-sans)', fontStyle: 'normal' }}>
                  RON
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                în {periodDays} zile selectate
              </div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Tranzacții
              </div>
              <div className="serif num" style={{ fontSize: 26, fontStyle: 'italic', marginTop: 4 }}>
                {count}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                ~{Math.round(count / periodMonths)} pe lună
              </div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Medie / tranzacție
              </div>
              <div className="serif num" style={{ fontSize: 26, fontStyle: 'italic', marginTop: 4 }}>
                {fmt(avg)}{' '}
                <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-sans)', fontStyle: 'normal' }}>
                  RON
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                în linie cu media
              </div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Cea mai mare categorie
              </div>
              <div
                className="serif"
                style={{
                  fontSize: 22,
                  fontStyle: 'italic',
                  marginTop: 4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: topCategory?.color ?? 'var(--text-1)',
                }}
              >
                {topCategory?.cat ?? '—'}
              </div>
              <div
                className="num"
                style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}
              >
                {topCategory ? `${fmt(topCategory.subtotal, 0)} RON` : 'fără date'}
              </div>
            </div>
          </div>

          {/* Detail table */}
          <div
            style={{
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div>
                  <div className="card-title">Detaliu pe categorii</div>
                  <div className="card-sub">
                    {rows.length} categorii · sortate după sumă
                  </div>
                </div>
                <button className="btn btn-secondary btn-sm">Sortează: Sumă ↓</button>
              </div>

              {categoryLoading ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>
                  Se încarcă...
                </div>
              ) : rows.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>
                  Nu există date pentru perioada și categoriile selectate.
                </div>
              ) : (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Categorie</th>
                      <th style={{ width: 60 }}>TX</th>
                      <th style={{ width: 180 }}>Evoluție lunară</th>
                      <th className="ta-right" style={{ width: 170 }}>% din total</th>
                      <th className="ta-right" style={{ width: 140 }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows
                      .sort((a, b) => b.subtotal - a.subtotal)
                      .map((r) => (
                        <tr key={r.catId}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 8,
                                  background: `${r.color}1a`,
                                  color: r.color,
                                  display: 'grid',
                                  placeItems: 'center',
                                }}
                              >
                                <CategoryIcon icon={r.icon} name={r.cat} size={14} />
                              </div>
                              <div>
                                <div style={{ fontWeight: 500, fontSize: 13 }}>{r.cat}</div>
                                <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>
                                  {r.type === 'income' ? 'venituri' : 'cheltuieli'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="num" style={{ color: 'var(--text-2)' }}>{r.count}</td>
                          <td>
                            <MiniLine data={r.spark} color={r.color} />
                          </td>
                          <td className="ta-right">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                              <div className="pbar" style={{ width: 70 }}>
                                <span style={{ width: `${Math.min(r.share, 100)}%`, background: r.color }} />
                              </div>
                              <span className="num" style={{ width: 42, textAlign: 'right' }}>
                                {r.share.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="ta-right num" style={{ fontWeight: 600 }}>
                            {fmt(r.subtotal)}{' '}
                            <span style={{ color: 'var(--text-3)', fontWeight: 400, fontSize: 11 }}>RON</span>
                          </td>
                        </tr>
                      ))}
                    <tr style={{ background: 'var(--bg-subtle)' }}>
                      <td style={{ fontWeight: 600 }}>Total general</td>
                      <td className="num" style={{ fontWeight: 600 }}>{count}</td>
                      <td />

                      <td className="ta-right num" style={{ fontWeight: 600 }}>100%</td>
                      <td className="ta-right num" style={{ fontWeight: 700, fontSize: 14 }}>
                        {fmt(total)}{' '}
                        <span style={{ color: 'var(--text-3)', fontWeight: 400, fontSize: 11 }}>RON</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
          </div>

          {rows.length > 0 && (
            <div className="card" style={{ padding: 18 }}>
              <div className="card-title" style={{ marginBottom: 12 }}>
                Distribuție pe categorii
              </div>
              <DonutChart rows={rows} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Minimal SVG donut for the optional include.donut section
function DonutChart({
  rows,
}: {
  rows: Array<{ catId: string; cat: string; color: string; subtotal: number; icon?: string; count?: number }>;
}) {
  const total = rows.reduce((s, r) => s + r.subtotal, 0);
  const [hoverId, setHoverId] = useState<string | null>(null);
  if (total === 0) return null;

  // Use a single SVG circle per segment + stroke-dasharray so we get the modern
  // donut look with small gaps between segments. Linecap "butt" keeps edges
  // sharp; we offset each segment along the circumference.
  const STROKE = 22; // donut thickness
  const SIZE = 220;
  const RADIUS = SIZE / 2 - STROKE / 2 - 4;
  const C = 2 * Math.PI * RADIUS;
  // Only inset a gap between slices when there's more than one slice —
  // otherwise a single 100% category renders as a not-quite-closed ring
  // with a thin notch at the top of the donut.
  const GAP = rows.length > 1 ? 0.012 * C : 0;

  let offset = 0;
  const segments = rows.map((d, i) => {
    const share = d.subtotal / total;
    const arc = Math.max(0, share * C - GAP);
    const seg = {
      ...d,
      idx: i,
      share,
      arc,
      // dashoffset rotates the start of the stroke to where this segment begins
      dashOffset: -offset,
    };
    offset += share * C;
    return seg;
  });

  const hovered = segments.find((s) => s.catId === hoverId);
  const center = hovered
    ? {
        label: hovered.cat,
        value: hovered.subtotal,
        share: hovered.share,
        color: hovered.color,
      }
    : {
        label: 'Total',
        value: total,
        share: 1,
        color: 'var(--text-1)',
      };

  return (
    <div className="donut-row" style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          width={SIZE}
          height={SIZE}
          style={{ display: 'block', transform: 'rotate(-90deg)' }}
        >
          <defs>
            <filter id="donut-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
            </filter>
          </defs>
          {/* track */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--bg-inset)"
            strokeWidth={STROKE}
          />
          {segments.map((s) => {
            const isHover = hoverId === s.catId;
            const dim = hoverId !== null && !isHover;
            return (
              <circle
                key={s.catId}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={s.color}
                strokeWidth={STROKE + (isHover ? 4 : 0)}
                strokeDasharray={`${s.arc} ${C - s.arc}`}
                strokeDashoffset={s.dashOffset}
                strokeLinecap="butt"
                style={{
                  opacity: dim ? 0.35 : 1,
                  transition: 'opacity .15s, stroke-width .15s',
                  cursor: 'pointer',
                  filter: isHover ? 'url(#donut-shadow)' : undefined,
                  animation: `donutGrow .6s ease-out both`,
                  animationDelay: `${s.idx * 60}ms`,
                  transformOrigin: 'center',
                }}
                onMouseEnter={() => setHoverId(s.catId)}
                onMouseLeave={() => setHoverId(null)}
              />
            );
          })}
        </svg>
        {/* center label */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              color: 'var(--text-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 2,
            }}
          >
            {center.label}
          </div>
          <div
            className="serif num"
            style={{
              fontSize: 26,
              fontStyle: 'italic',
              color: center.color,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {Math.round(center.value).toLocaleString('ro-RO')}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 4 }}>
            RON · {(center.share * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* legend */}
      <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {rows
          .slice()
          .sort((a, b) => b.subtotal - a.subtotal)
          .map((d) => {
            const isHover = hoverId === d.catId;
            const share = d.subtotal / total;
            return (
              <button
                key={d.catId}
                type="button"
                onMouseEnter={() => setHoverId(d.catId)}
                onMouseLeave={() => setHoverId(null)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '14px 1fr auto auto',
                  gap: 10,
                  alignItems: 'center',
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: isHover ? 'var(--bg-subtle)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  transition: 'background .12s',
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: d.color,
                    boxShadow: isHover ? `0 0 0 3px ${d.color}33` : 'none',
                    transition: 'box-shadow .15s',
                  }}
                />
                <span
                  style={{
                    fontSize: 12.5,
                    color: 'var(--text-1)',
                    fontWeight: isHover ? 600 : 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {d.icon ? `${d.icon} ` : ''}
                  {d.cat}
                </span>
                <span
                  className="num"
                  style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}
                >
                  {Math.round(d.subtotal).toLocaleString('ro-RO')}
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: 'var(--text-3)',
                    width: 44,
                    textAlign: 'right',
                  }}
                >
                  {(share * 100).toFixed(1)}%
                </span>
              </button>
            );
          })}
      </div>
    </div>
  );
}
