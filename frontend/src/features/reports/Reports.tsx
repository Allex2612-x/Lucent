import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FileText, Download, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { statisticsService } from '../../services/statistics.service';
import { api } from '../../services/api';

const MONTH_NAMES = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];

const COLORS = ['#818cf8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function Reports() {
  // Initialize with current month and 6 months ago
  const currentDate = new Date();
  const startDateDefault = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1);
  const endDateDefault = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  const [startDate, setStartDate] = useState(
    `${startDateDefault.getFullYear()}-${String(startDateDefault.getMonth() + 1).padStart(2, '0')}`
  );
  const [endDate, setEndDate] = useState(
    `${endDateDefault.getFullYear()}-${String(endDateDefault.getMonth() + 1).padStart(2, '0')}`
  );

  // Convert month input (YYYY-MM) to full date string for API
  const startDateFull = startDate ? `${startDate}-01` : undefined;
  const endDateFull = endDate ? `${endDate}-01` : undefined;

  const { data: categoryData, isLoading: categoryLoading, error: categoryError } = useQuery({
    queryKey: ['statistics', 'by-category', startDateFull, endDateFull],
    queryFn: () => statisticsService.getByCategory({ 
      startDate: startDateFull, 
      endDate: endDateFull, 
      type: 'expense' 
    }),
  });

  const { data: trendData, isLoading: trendLoading, error: trendError } = useQuery({
    queryKey: ['statistics', 'monthly-trend'],
    queryFn: () => statisticsService.getMonthlyTrend({ months: 12 }),
  });

  const categoryChartData = categoryData?.data?.data?.map((item: any) => ({
    name: item.categoryName,
    value: item.total,
    percentage: item.percentage,
    color: item.categoryColor,
  })) || [];

  const trendChartData = trendData?.data?.data?.map((item: any) => ({
    name: MONTH_NAMES[item.month - 1],
    income: item.income,
    expenses: item.expenses,
  })) || [];

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
      
      const fileName = `raport-financiar-${startDate || 'all'}.pdf`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Eroare la exportul PDF. Încearcă din nou.');
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.get('/reports/export/excel', {
        params: { startDate: startDateFull, endDate: endDateFull },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = `raport-financiar-${startDate || 'all'}.xlsx`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Eroare la exportul Excel. Încearcă din nou.');
    }
  };

  return (
    <div className="reports-container">
      <div className="page-header">
        <div>
          <h1>Rapoarte Financiare</h1>
          <p>Analizează și exportă datele tale financiare.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="secondary" onClick={handleExportPDF}>
            <Download size={18} style={{ marginRight: '0.5rem' }} />
            Export PDF
          </Button>
          <Button variant="primary" onClick={handleExportExcel}>
            <Download size={18} style={{ marginRight: '0.5rem' }} />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <CardBody>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} className="text-indigo-400" />
              <span style={{ fontWeight: 500 }}>Selectează Perioada:</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label htmlFor="startDate" style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                De la:
              </label>
              <input
                id="startDate"
                type="month"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '0.5rem',
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label htmlFor="endDate" style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                Până la:
              </label>
              <input
                id="endDate"
                type="month"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '0.5rem',
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Charts Grid */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
        {/* Pie Chart - Distribution by Category */}
        <Card style={{ padding: '0' }}>
          <CardHeader style={{ padding: '1.5rem 1.5rem 0', borderBottom: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChartIcon size={20} className="text-indigo-400" />
              <h3>Distribuție Cheltuieli pe Categorii</h3>
            </div>
          </CardHeader>
          <CardBody>
            {categoryLoading ? (
              <p>Se încarcă...</p>
            ) : categoryError ? (
              <p style={{ color: '#ef4444' }}>Nu s-au putut încărca datele graficului.</p>
            ) : categoryChartData.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>Nu există cheltuieli în perioada selectată.</p>
            ) : (
              <div style={{ width: '100%', height: 350, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryChartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                      }}
                      itemStyle={{ color: '#f8fafc' }}
                      formatter={(value: any) => `${Number(value).toFixed(2)} RON`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Bar Chart - Monthly Trend */}
        <Card style={{ padding: '0' }}>
          <CardHeader style={{ padding: '1.5rem 1.5rem 0', borderBottom: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={20} className="text-indigo-400" />
              <h3>Venituri și Cheltuieli Lunare</h3>
            </div>
          </CardHeader>
          <CardBody>
            {trendLoading ? (
              <p>Se încarcă...</p>
            ) : trendError ? (
              <p style={{ color: '#ef4444' }}>Nu s-au putut încărca datele graficului.</p>
            ) : trendChartData.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>Nu există date pentru ultimele 12 luni.</p>
            ) : (
              <div style={{ width: '100%', height: 350, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `${val}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                      }}
                      itemStyle={{ color: '#f8fafc' }}
                      formatter={(value: any) => `${Number(value).toFixed(2)} RON`}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                      formatter={(value) => (value === 'income' ? 'Venituri' : 'Cheltuieli')}
                    />
                    <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="expenses" fill="#ef4444" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
