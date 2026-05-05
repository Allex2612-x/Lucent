import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, CreditCard } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { statisticsService } from '../../services/statistics.service';
import { transactionsService } from '../../services/transactions.service';

const MONTH_NAMES = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];

export function Dashboard() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const { data: overviewData, isLoading: overviewLoading, error: overviewError } = useQuery({
    queryKey: ['statistics', 'overview', currentMonth, currentYear],
    queryFn: () => statisticsService.getOverview({ month: currentMonth, year: currentYear }),
  });

  const { data: trendData, isLoading: trendLoading, error: trendError } = useQuery({
    queryKey: ['statistics', 'monthly-trend'],
    queryFn: () => statisticsService.getMonthlyTrend({ months: 7 }),
  });

  const { data: transactionsData, isLoading: transactionsLoading, error: transactionsError } = useQuery({
    queryKey: ['transactions', 'recent'],
    queryFn: () => transactionsService.getAll(),
    select: (data) => data.data.data.slice(0, 5),
  });

  const overview = overviewData?.data?.data;
  const chartData = trendData?.data?.data?.map((item: any) => ({
    name: MONTH_NAMES[item.month - 1],
    income: item.income,
    expenses: item.expenses,
    balance: item.balance,
  })) || [];
  const recentTransactions = transactionsData || [];

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1>Dashboard Personal</h1>
          <p>Supervizează-ți finanțele dintr-o singură privire.</p>
        </div>
        <Button variant="primary">Adaugă Tranzacție</Button>
      </div>
      
      {overviewError && (
        <div style={{ padding: '1rem', background: '#ef4444', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          Nu s-au putut încărca datele. Încearcă din nou.
        </div>
      )}

      <div className="dashboard-grid">
        <Card className="bg-gradient-to-br from-indigo-900 to-slate-900 border-indigo-500/30">
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Sold Curent</p>
              <h2 className="text-2xl font-bold text-white">
                {overviewLoading ? 'Se încarcă...' : `${(overview?.balance || 0).toFixed(2)} RON`}
              </h2>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
              <ArrowUpRight size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Venituri (Luna aceasta)</p>
              <h2 className="text-2xl font-bold text-white">
                {overviewLoading ? 'Se încarcă...' : `${(overview?.totalIncome || 0).toFixed(2)} RON`}
              </h2>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-red-500/20 rounded-xl text-red-500">
              <ArrowDownRight size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Cheltuieli (Luna aceasta)</p>
              <h2 className="text-2xl font-bold text-white">
                {overviewLoading ? 'Se încarcă...' : `${(overview?.totalExpenses || 0).toFixed(2)} RON`}
              </h2>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="dashboard-grid mt-6" style={{ gridTemplateColumns: 'revert' }}>
        <Card style={{ padding: '0' }}>
          <CardHeader style={{ padding: '1.5rem 1.5rem 0', borderBottom: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} className="text-indigo-400" />
              <h3>Evoluție Sold</h3>
            </div>
          </CardHeader>
          <CardBody>
            {trendLoading ? (
              <p>Se încarcă...</p>
            ) : trendError ? (
              <p style={{ color: '#ef4444' }}>Nu s-au putut încărca datele graficului.</p>
            ) : (
              <div style={{ width: '100%', height: 300, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem' }}
                      itemStyle={{ color: '#f8fafc' }}
                    />
                    <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 3 }} />
                    <Line type="monotone" dataKey="balance" stroke="#818cf8" strokeWidth={3} dot={{ fill: '#818cf8', r: 4 }} activeDot={{ r: 6, fill: '#c084fc' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={20} className="text-indigo-400" />
              <h3>Ultimele Tranzacții</h3>
            </div>
          </CardHeader>
          <CardBody>
            {transactionsLoading ? (
              <p>Se încarcă tranzacțiile...</p>
            ) : transactionsError ? (
              <p style={{ color: '#ef4444' }}>Nu s-au putut încărca tranzacțiile.</p>
            ) : recentTransactions.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>Nu există tranzacții.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recentTransactions.map((tx: any) => (
                  <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem' }}>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: 500 }}>{tx.description}</h4>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(tx.date).toLocaleDateString('ro-RO')}</span>
                    </div>
                    <div style={{ fontWeight: 600, color: tx.type === 'income' ? '#10b981' : '#ef4444' }}>
                      {tx.type === 'income' ? '+' : '-'}{tx.amount.toFixed(2)} RON
                    </div>
                  </div>
                ))}
                <Button variant="ghost" fullWidth style={{ marginTop: '0.5rem' }}>Vezi Toate</Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
