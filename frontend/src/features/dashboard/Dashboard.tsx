import { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, CreditCard } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockChartData = [
  { name: 'Jan', balance: 4000 },
  { name: 'Feb', balance: 3000 },
  { name: 'Mar', balance: 2000 },
  { name: 'Apr', balance: 2780 },
  { name: 'May', balance: 1890 },
  { name: 'Jun', balance: 2390 },
  { name: 'Jul', balance: 3490 },
];

const mockTransactions = [
  { id: 1, title: 'Salariu', amount: 3500, type: 'income', date: '2026-04-10' },
  { id: 2, title: 'Utilități', amount: 150, type: 'expense', date: '2026-04-12' },
  { id: 3, title: 'Cumpărături', amount: 320, type: 'expense', date: '2026-04-15' },
];

export function Dashboard() {
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    // Simulate API loading
    const timer = setTimeout(() => setDataLoaded(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1>Dashboard Personal</h1>
          <p>Supervizează-ți finanțele dintr-o singură privire.</p>
        </div>
        <Button variant="primary">Adaugă Tranzacție</Button>
      </div>
      
      <div className="dashboard-grid">
        <Card className="bg-gradient-to-br from-indigo-900 to-slate-900 border-indigo-500/30">
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Sold Curent</p>
              <h2 className="text-2xl font-bold text-white">4,850.00 RON</h2>
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
              <h2 className="text-2xl font-bold text-white">3,500.00 RON</h2>
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
              <h2 className="text-2xl font-bold text-white">470.00 RON</h2>
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
            <div style={{ width: '100%', height: 300, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Line type="monotone" dataKey="balance" stroke="#818cf8" strokeWidth={3} dot={{ fill: '#818cf8', r: 4 }} activeDot={{ r: 6, fill: '#c084fc' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
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
            {dataLoaded ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {mockTransactions.map((tx) => (
                  <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem' }}>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: 500 }}>{tx.title}</h4>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{tx.date}</span>
                    </div>
                    <div style={{ fontWeight: 600, color: tx.type === 'income' ? '#10b981' : '#ef4444' }}>
                      {tx.type === 'income' ? '+' : '-'}{tx.amount.toFixed(2)} RON
                    </div>
                  </div>
                ))}
                <Button variant="ghost" fullWidth style={{ marginTop: '0.5rem' }}>Vezi Toate</Button>
              </div>
            ) : (
              <p>Se încarcă tranzacțiile...</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
