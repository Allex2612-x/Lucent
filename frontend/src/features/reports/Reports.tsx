import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, FileText, Sheet } from 'lucide-react';
import { toast } from 'sonner';
import { statisticsService } from '../../services/statistics.service';
import { categoriesService } from '../../services/categories.service';
import { api } from '../../services/api';
import { CHART_COLORS } from '../../styles/colors';
import { Category } from '@sasha-licenta/shared';

const fmt = (n: number, dec = 2) =>
  n.toLocaleString('ro-RO', { minimumFractionDigits: dec, maximumFractionDigits: dec });

const ROMANIAN_MONTHS = [
  'ian', 'feb', 'mar', 'apr', 'mai', 'iun',
  'iul', 'aug', 'sep', 'oct', 'noi', 'dec',
];

function MiniBar({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length === 0) {
    return <div style={{ height: 40 }} />;
  }
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 40 }}>
      {data.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            background: color,
            opacity: 0.25 + 0.75 * (v / max),
            borderRadius: 2,
            height: `${(v / max) * 100 || 4}%`,
            minHeight: 2,
            transformOrigin: 'bottom',
            animation: 'growBar 0.45s cubic-bezier(.2,.8,.2,1) both',
            animationDelay: `${i * 28}ms`,
          }}
        />
      ))}
    </div>
  );
}

type ReportType = 'income' | 'expense' | 'all';
type Preset = 'this-month' | 'last-30' | 'this-quarter' | 'ytd' | 'last-year' | 'custom';

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function rangeForPreset(preset: Preset): { start: string; end: string } {
  const now = new Date();
  const today = toIsoDate(now);
  if (preset === 'this-month') {
    return {
      start: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
      end: today,
    };
  }
  if (preset === 'last-30') {
    const start = new Date(now);
    start.setDate(now.getDate() - 30);
    return { start: toIsoDate(start), end: today };
  }
  if (preset === 'this-quarter') {
    const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
    return {
      start: toIsoDate(new Date(now.getFullYear(), qStartMonth, 1)),
      end: today,
    };
  }
  if (preset === 'ytd') {
    return {
      start: toIsoDate(new Date(now.getFullYear(), 0, 1)),
      end: today,
    };
  }
  if (preset === 'last-year') {
    return {
      start: toIsoDate(new Date(now.getFullYear() - 1, 0, 1)),
      end: toIsoDate(new Date(now.getFullYear() - 1, 11, 31)),
    };
  }
  return { start: today, end: today };
}

export function Reports() {
  const now = new Date();

  const [reportType, setReportType] = useState<ReportType>('expense');
  const [preset, setPreset] = useState<Preset>('ytd');
  const initial = rangeForPreset('ytd');
  const [startDate, setStartDate] = useState<string>(initial.start);
  const [endDate, setEndDate] = useState<string>(initial.end);

  const applyPreset = (p: Preset) => {
    setPreset(p);
    if (p !== 'custom') {
      const range = rangeForPreset(p);
      setStartDate(range.start);
      setEndDate(range.end);
    }
  };

  const startDateFull = startDate || undefined;
  const endDateFull = endDate || undefined;

  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getAll(),
  });
  const categories: Category[] = categoriesResponse?.data?.data || [];

  const fetchType = reportType === 'all' ? 'expense' : reportType;
  const { data: categoryData, isLoading: categoryLoading } = useQuery({
    queryKey: ['statistics', 'by-category', startDateFull, endDateFull, fetchType],
    queryFn: () =>
      statisticsService.getByCategory({
        startDate: startDateFull,
        endDate: endDateFull,
        type: fetchType,
      }),
  });

  const { data: trendData } = useQuery({
    queryKey: ['statistics', 'monthly-trend', startDateFull, endDateFull],
    queryFn: () =>
      statisticsService.getMonthlyTrend({ startDate: startDateFull, endDate: endDateFull }),
  });

  const trendPoints: Array<{
    month: number;
    year: number;
    income: number;
    expenses: number;
  }> = trendData?.data?.data || [];

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
    const total = list.reduce((s, r) => s + Number(r.total), 0);
    return list.map((r, idx) => {
      const cat = categories.find((c) => c.id === r.categoryId);
      const spark = trendPoints.map((p) => (fetchType === 'income' ? p.income : p.expenses)).slice(-12);
      return {
        catId: r.categoryId,
        cat: r.categoryName,
        icon: cat?.icon || r.categoryIcon || '📁',
        color: cat?.color || r.categoryColor || CHART_COLORS[idx % CHART_COLORS.length],
        count: Number(r.count || 0),
        subtotal: Number(r.total),
        share: total > 0 ? (Number(r.total) / total) * 100 : Number(r.percentage || 0),
        spark,
      };
    });
  }, [categoryData, categories, trendPoints, fetchType]);

  const total = rows.reduce((s, r) => s + r.subtotal, 0);
  const count = rows.reduce((s, r) => s + r.count, 0);
  const avg = count > 0 ? total / count : 0;

  const periodDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diff);
  }, [startDate, endDate]);
  const periodMonths = useMemo(() => Math.max(1, periodDays / 30), [periodDays]);

  const handleExportPDF = async () => {
    try {
      const response = await api.get('/reports/export/pdf', {
        params: { startDate: startDateFull, endDate: endDateFull },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `raport-financiar-${startDate}_${endDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Eroare la exportul PDF.');
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.get('/reports/export/excel', {
        params: { startDate: startDateFull, endDate: endDateFull },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `raport-financiar-${startDate}_${endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Eroare la exportul Excel.');
    }
  };

  const formatDateDisplay = (iso: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    return `${d} ${ROMANIAN_MONTHS[m! - 1] || ''} ${y}`;
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Rapoarte</div>
          <div className="page-sub">Generează, vizualizează și exportă rapoarte detaliate.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={handleExportPDF} title="Descarcă raportul ca PDF">
            <FileText size={14} /> PDF
          </button>
          <button className="btn btn-primary" onClick={handleExportExcel} title="Descarcă raportul ca Excel">
            <Sheet size={14} /> Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: 24,
            alignItems: 'center',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 6,
              }}
            >
              Tip raport
            </div>
            <div className="seg">
              <button className={reportType === 'income' ? 'on' : ''} onClick={() => setReportType('income')}>
                Venituri
              </button>
              <button className={reportType === 'expense' ? 'on' : ''} onClick={() => setReportType('expense')}>
                Cheltuieli
              </button>
              <button className={reportType === 'all' ? 'on' : ''} onClick={() => setReportType('all')}>
                Complet
              </button>
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 6,
              }}
            >
              Perioadă
            </div>

            {/* Preset chips */}
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
                      padding: '5px 11px',
                      borderRadius: 999,
                      border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                      background: on ? 'var(--accent-soft)' : '#fff',
                      color: on ? 'var(--accent-ink)' : 'var(--text-2)',
                      fontSize: 12,
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span
                className="chip"
                style={{ background: '#fff', padding: '4px 10px', gap: 6 }}
              >
                <Calendar size={12} />
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
                    fontSize: 12,
                    color: 'var(--text-1)',
                    outline: 'none',
                  }}
                />
              </span>
              <span style={{ color: 'var(--text-3)' }}>→</span>
              <span
                className="chip"
                style={{ background: '#fff', padding: '4px 10px', gap: 6 }}
              >
                <Calendar size={12} />
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
                    fontSize: 12,
                    color: 'var(--text-1)',
                    outline: 'none',
                  }}
                />
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                {formatDateDisplay(startDate)} → {formatDateDisplay(endDate)} · {periodDays}{' '}
                {periodDays === 1 ? 'zi' : 'zile'}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Hero summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 18 }}>
        <div className="card" style={{ padding: 20 }}>
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--text-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Total {reportType === 'income' ? 'venituri' : 'cheltuieli'}
          </div>
          <div
            className="serif num"
            style={{ fontSize: 36, fontStyle: 'italic', letterSpacing: '-0.02em', marginTop: 6 }}
          >
            {fmt(total)}{' '}
            <span
              style={{
                fontSize: 14,
                color: 'var(--text-3)',
                fontFamily: 'var(--font-sans)',
                fontStyle: 'normal',
              }}
            >
              RON
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
            {periodDays} {periodDays === 1 ? 'zi' : 'zile'} ·{' '}
            {periodMonths < 1.2 ? '~1 lună' : `~${periodMonths.toFixed(0)} luni`}
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--text-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Număr tranzacții
          </div>
          <div className="serif num" style={{ fontSize: 36, fontStyle: 'italic', marginTop: 6 }}>
            {count}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
            ~{periodMonths > 0 ? Math.round(count / periodMonths) : 0} pe lună
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--text-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Medie pe tranzacție
          </div>
          <div
            className="serif num"
            style={{ fontSize: 36, fontStyle: 'italic', marginTop: 6 }}
          >
            {fmt(avg)}{' '}
            <span
              style={{
                fontSize: 14,
                color: 'var(--text-3)',
                fontFamily: 'var(--font-sans)',
                fontStyle: 'normal',
              }}
            >
              RON
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
            calculată din {count} tranzacții
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
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div>
            <div className="card-title">Detaliu pe categorii</div>
            <div className="card-sub">
              {rows.length} categorii ·{' '}
              {reportType === 'income' ? 'venituri' : reportType === 'expense' ? 'cheltuieli' : 'sumar'}{' '}
              {formatDateDisplay(startDate)} – {formatDateDisplay(endDate)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm">Sortează: Sumă ↓</button>
          </div>
        </div>

        {categoryLoading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>
            Se încarcă...
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>
            Nu există date pentru perioada selectată.
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Categorie</th>
                <th>Tranzacții</th>
                <th>Evoluție lunară</th>
                <th className="ta-right">% din total</th>
                <th className="ta-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.catId}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background: `${r.color}1a`,
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 14,
                        }}
                      >
                        {r.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{r.cat}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                          {reportType === 'income' ? 'venituri' : 'cheltuieli'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="num" style={{ color: 'var(--text-2)' }}>
                    {r.count}
                  </td>
                  <td style={{ width: 200 }}>
                    <MiniBar data={r.spark} color={r.color} />
                  </td>
                  <td className="ta-right" style={{ width: 180 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        justifyContent: 'flex-end',
                      }}
                    >
                      <div className="pbar" style={{ width: 80 }}>
                        <span style={{ width: `${Math.min(r.share, 100)}%`, background: r.color }} />
                      </div>
                      <span className="num" style={{ width: 42, textAlign: 'right' }}>
                        {r.share.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="ta-right num" style={{ fontWeight: 600 }}>
                    {fmt(r.subtotal)}{' '}
                    <span style={{ color: 'var(--text-3)', fontWeight: 400, fontSize: 11 }}>
                      RON
                    </span>
                  </td>
                </tr>
              ))}
              <tr style={{ background: 'var(--bg-subtle)' }}>
                <td style={{ fontWeight: 600 }}>Total general</td>
                <td className="num" style={{ fontWeight: 600 }}>
                  {count}
                </td>
                <td />
                <td className="ta-right num" style={{ fontWeight: 600 }}>
                  100%
                </td>
                <td className="ta-right num" style={{ fontWeight: 700, fontSize: 14 }}>
                  {fmt(total)}{' '}
                  <span style={{ color: 'var(--text-3)', fontWeight: 400, fontSize: 11 }}>RON</span>
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
