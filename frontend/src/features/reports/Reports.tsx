import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Download, FileText, Sheet } from 'lucide-react';
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
          }}
        />
      ))}
    </div>
  );
}

type ReportType = 'income' | 'expense' | 'all';

export function Reports() {
  const now = new Date();
  const yearStart = `${now.getFullYear()}-01`;
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [reportType, setReportType] = useState<ReportType>('expense');
  const [startMonth, setStartMonth] = useState(yearStart);
  const [endMonth, setEndMonth] = useState(currentMonth);

  const startDateFull = startMonth ? `${startMonth}-01` : undefined;
  const endDateFull = endMonth ? `${endMonth}-28` : undefined;

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
    if (!startMonth || !endMonth) return 0;
    const [sy, sm] = startMonth.split('-').map(Number);
    const [ey, em] = endMonth.split('-').map(Number);
    return (ey - sy) * 12 + (em - sm) + 1;
  }, [startMonth, endMonth]);

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
      link.setAttribute('download', `raport-financiar-${startMonth || 'all'}.pdf`);
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
      link.setAttribute('download', `raport-financiar-${startMonth || 'all'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Eroare la exportul Excel.');
    }
  };

  const formatMonthDisplay = (ym: string) => {
    if (!ym) return '';
    const [y, m] = ym.split('-').map(Number);
    return `${ROMANIAN_MONTHS[m - 1] || ''} ${y}`;
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Rapoarte</div>
          <div className="page-sub">Generează, vizualizează și exportă rapoarte detaliate.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={handleExportPDF}>
            <FileText size={14} /> PDF
          </button>
          <button className="btn btn-secondary" onClick={handleExportExcel}>
            <Sheet size={14} /> Excel
          </button>
          <button className="btn btn-primary" onClick={handleExportPDF}>
            <Download size={14} /> Exportă
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span
                className="chip"
                style={{ background: '#fff', padding: '4px 10px', gap: 6 }}
              >
                <Calendar size={12} />
                <input
                  type="month"
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
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
                  type="month"
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
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
                {formatMonthDisplay(startMonth)} → {formatMonthDisplay(endMonth)}
              </span>
            </div>
          </div>

          <button className="btn btn-primary btn-sm" onClick={handleExportPDF}>
            Generează
          </button>
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
            {periodDays} {periodDays === 1 ? 'lună' : 'luni'} selectate
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
            ~{periodDays > 0 ? Math.round(count / periodDays) : 0} pe lună
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
              {formatMonthDisplay(startMonth)} – {formatMonthDisplay(endMonth)}
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
