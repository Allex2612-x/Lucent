import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  TrendingUp, 
  CreditCard, 
  ArrowRight,
  Percent,
  AlertTriangle,
  TrendingDown
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { statisticsService } from '../../services/statistics.service';
import { transactionsService, TransactionData } from '../../services/transactions.service';
import { categoriesService } from '../../services/categories.service';
import { budgetsService } from '../../services/budgets.service';
import { Category } from '@sasha-licenta/shared';
import { tokens } from '../../styles/colors';

const MONTH_NAMES = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];

// Mini sparkline component
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length === 0) return null;
  
  const chartData = data.map((value, index) => ({ value, index }));
  
  return (
    <div style={{ width: '100%', height: '40px', marginTop: '0.5rem' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2} 
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// KPI Card Component
interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  sparklineData?: number[];
  sparklineColor?: string;
  emphasized?: boolean;
}

function KPICard({ icon, label, value, delta, sparklineData, sparklineColor, emphasized }: KPICardProps) {
  const cardStyle: React.CSSProperties = emphasized ? {
    background: `linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, rgba(10, 14, 26, 0) 100%)`,
    border: `1px solid ${tokens['accent-primary']}`,
    gridColumn: 'span 2',
  } : {};

  return (
    <Card style={cardStyle}>
      <CardBody style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ 
            padding: '0.75rem', 
            backgroundColor: emphasized ? 'rgba(20, 184, 166, 0.15)' : 'var(--bg-elevated)', 
            borderRadius: '0.75rem',
            color: emphasized ? tokens['accent-primary'] : tokens['text-muted']
          }}>
            {icon}
          </div>
          {delta && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.25rem',
              fontSize: '0.85rem',
              color: delta.isPositive ? tokens['accent-success'] : tokens['accent-danger'],
              fontWeight: 500
            }}>
              {delta.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {Math.abs(delta.value).toFixed(1)}%
            </div>
          )}
        </div>
        <div>
          <p style={{ 
            fontSize: '0.875rem', 
            color: tokens['text-muted'], 
            marginBottom: '0.5rem',
            fontWeight: 500
          }}>
            {label}
          </p>
          <h2 style={{ 
            fontSize: emphasized ? '2.5rem' : '2rem', 
            fontWeight: 700, 
            color: tokens['text-primary'],
            margin: 0,
            lineHeight: 1
          }}>
            {value}
          </h2>
          {delta && (
            <p style={{ 
              fontSize: '0.75rem', 
              color: tokens['text-muted'], 
              marginTop: '0.5rem',
              marginBottom: 0
            }}>
              {delta.label}
            </p>
          )}
        </div>
        {sparklineData && sparklineColor && (
          <MiniSparkline data={sparklineData} color={sparklineColor} />
        )}
      </CardBody>
    </Card>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState<TransactionData>({
    description: '',
    amount: 0,
    type: 'expense',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Fetch current month overview
  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['statistics', 'overview', currentMonth, currentYear],
    queryFn: () => statisticsService.getOverview({ month: currentMonth, year: currentYear }),
  });

  // Fetch previous month for delta calculation
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  
  const { data: prevOverviewData } = useQuery({
    queryKey: ['statistics', 'overview', prevMonth, prevYear],
    queryFn: () => statisticsService.getOverview({ month: prevMonth, year: prevYear }),
  });

  // Fetch last 7 days for sparklines
  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['statistics', 'monthly-trend'],
    queryFn: () => statisticsService.getMonthlyTrend({ months: 7 }),
  });

  // Fetch recent transactions
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', 'recent'],
    queryFn: () => transactionsService.getAll(),
    select: (data) => data.data.data.slice(0, 5),
  });

  // Fetch categories
  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getAll(),
  });

  // Fetch budgets at risk
  const { data: budgetsData } = useQuery({
    queryKey: ['budgets', 'at-risk'],
    queryFn: async () => {
      const response = await budgetsService.getAll();
      return response.data.data;
    },
  });

  const overview = overviewData?.data?.data;
  const prevOverview = prevOverviewData?.data?.data;
  const recentTransactions = transactionsData || [];
  const categories = categoriesResponse?.data?.data || [];

  // Calculate deltas
  const calculateDelta = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, isPositive: current >= 0 };
    const delta = ((current - previous) / previous) * 100;
    return { value: delta, isPositive: delta >= 0 };
  };

  const balanceDelta = prevOverview ? calculateDelta(overview?.balance || 0, prevOverview.balance) : null;
  const incomeDelta = prevOverview ? calculateDelta(overview?.totalIncome || 0, prevOverview.totalIncome) : null;
  const expensesDelta = prevOverview ? calculateDelta(overview?.totalExpenses || 0, prevOverview.totalExpenses) : null;

  // Calculate savings rate
  const savingsRate = overview?.totalIncome > 0 
    ? ((overview.totalIncome - overview.totalExpenses) / overview.totalIncome) * 100 
    : 0;

  // Prepare sparkline data (last 7 months)
  const sparklineData = trendData?.data?.data?.slice(-7) || [];
  const balanceSparkline = sparklineData.map((item: any) => item.balance);
  const incomeSparkline = sparklineData.map((item: any) => item.income);
  const expensesSparkline = sparklineData.map((item: any) => item.expenses);

  // Filter chart data to show only months with data
  const chartData = (trendData?.data?.data || [])
    .filter((item: any) => item.income > 0 || item.expenses > 0)
    .map((item: any) => ({
      name: MONTH_NAMES[item.month - 1],
      income: item.income,
      expenses: item.expenses,
      balance: item.balance,
    }));

  // Find budgets at risk (>80% consumed)
  const budgetsAtRisk = (budgetsData || []).filter((budget: any) => {
    // This would need actual spent calculation from backend
    // For now, we'll show a placeholder
    return false; // TODO: Implement budget risk calculation
  });

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
      toast.error('Eroare la salvarea tranzacției. Încearcă din nou.');
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

  const handleAddTransaction = () => {
    createMutation.mutate(formData);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const filteredCategories = categories.filter(
    (cat: Category) => cat.type === formData.type
  );

  // Get category for transaction
  const getCategoryForTransaction = (categoryId: string) => {
    return categories.find((cat: Category) => cat.id === categoryId);
  };

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1 style={{ fontSize: '2rem' }}>Dashboard Personal</h1>
          <p>Supervizează-ți finanțele dintr-o singură privire</p>
        </div>
        <div className="page-header-actions">
          <Button variant="primary" onClick={handleOpenAddModal} className="btn-compact">
            Adaugă Tranzacție
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <KPICard
          icon={<Wallet size={24} />}
          label="Sold Curent"
          value={overviewLoading ? '...' : `${(overview?.balance || 0).toFixed(2)} RON`}
          delta={balanceDelta ? {
            value: balanceDelta.value,
            isPositive: balanceDelta.isPositive,
            label: 'față de luna trecută'
          } : undefined}
          sparklineData={balanceSparkline}
          sparklineColor={tokens['accent-primary']}
          emphasized
        />
        
        <KPICard
          icon={<ArrowUpRight size={24} />}
          label="Venituri"
          value={overviewLoading ? '...' : `${(overview?.totalIncome || 0).toFixed(2)} RON`}
          delta={incomeDelta ? {
            value: incomeDelta.value,
            isPositive: incomeDelta.isPositive,
            label: 'față de luna trecută'
          } : undefined}
          sparklineData={incomeSparkline}
          sparklineColor={tokens['accent-success']}
        />
        
        <KPICard
          icon={<ArrowDownRight size={24} />}
          label="Cheltuieli"
          value={overviewLoading ? '...' : `${(overview?.totalExpenses || 0).toFixed(2)} RON`}
          delta={expensesDelta ? {
            value: expensesDelta.value,
            isPositive: !expensesDelta.isPositive, // Inverted: lower expenses is positive
            label: 'față de luna trecută'
          } : undefined}
          sparklineData={expensesSparkline}
          sparklineColor={tokens['accent-danger']}
        />
        
        <KPICard
          icon={<Percent size={24} />}
          label="Rată Economisire"
          value={overviewLoading ? '...' : `${savingsRate.toFixed(1)}%`}
          delta={undefined}
          sparklineData={undefined}
          sparklineColor={undefined}
        />
      </div>

      {/* Budgets at Risk Alert */}
      {budgetsAtRisk.length > 0 && (
        <Card style={{ 
          marginBottom: '2rem',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)'
        }}>
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                padding: '0.75rem', 
                backgroundColor: 'rgba(245, 158, 11, 0.2)', 
                borderRadius: '0.75rem',
                color: tokens['accent-warning']
              }}>
                <AlertTriangle size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: tokens['text-primary'] }}>
                  Bugete în Pericol
                </h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: tokens['text-muted'] }}>
                  Ai {budgetsAtRisk.length} buget(e) cu peste 80% consumat
                </p>
              </div>
              <Button variant="secondary" onClick={() => navigate('/budgets')}>
                Vezi Bugete
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Charts Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '2fr 1fr', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Evolution Chart */}
        <Card style={{ padding: '0' }}>
          <CardHeader style={{ 
            padding: '1.5rem', 
            borderBottom: `1px solid ${tokens['border-default']}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} style={{ color: tokens['accent-primary'] }} />
              <h3 style={{ margin: 0 }}>Evoluție Sold</h3>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: tokens['accent-success'] 
                }} />
                <span style={{ color: tokens['text-muted'] }}>Venituri</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: tokens['accent-danger'] 
                }} />
                <span style={{ color: tokens['text-muted'] }}>Cheltuieli</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: tokens['accent-primary'] 
                }} />
                <span style={{ color: tokens['text-muted'] }}>Sold Net</span>
              </div>
            </div>
          </CardHeader>
          <CardBody style={{ padding: '1.5rem' }}>
            {trendLoading ? (
              <p style={{ color: tokens['text-muted'] }}>Se încarcă...</p>
            ) : chartData.length === 0 ? (
              <p style={{ color: tokens['text-muted'] }}>Nu există date pentru afișare.</p>
            ) : (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={tokens['border-default']} vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke={tokens['text-muted']} 
                      tick={{ fill: tokens['text-muted'], fontSize: 12 }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      stroke={tokens['text-muted']} 
                      tick={{ fill: tokens['text-muted'], fontSize: 12 }} 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(val) => `${val}`} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: tokens['bg-elevated'], 
                        borderColor: tokens['border-default'], 
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem'
                      }}
                      itemStyle={{ color: tokens['text-primary'] }}
                      formatter={(value: any) => `${Number(value).toFixed(2)} RON`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke={tokens['accent-success']} 
                      strokeWidth={2} 
                      dot={{ fill: tokens['accent-success'], r: 3 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke={tokens['accent-danger']} 
                      strokeWidth={2} 
                      dot={{ fill: tokens['accent-danger'], r: 3 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="balance" 
                      stroke={tokens['accent-primary']} 
                      strokeWidth={3} 
                      dot={{ fill: tokens['accent-primary'], r: 4 }} 
                      activeDot={{ r: 6, fill: tokens['accent-secondary'] }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Recent Transactions */}
        <Card style={{ padding: '0' }}>
          <CardHeader style={{ 
            padding: '1.5rem', 
            borderBottom: `1px solid ${tokens['border-default']}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={20} style={{ color: tokens['accent-primary'] }} />
              <h3 style={{ margin: 0 }}>Ultimele Tranzacții</h3>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/transactions')}
              style={{ 
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              Vezi Toate
              <ArrowRight size={16} />
            </Button>
          </CardHeader>
          <CardBody style={{ padding: '0' }}>
            {transactionsLoading ? (
              <p style={{ padding: '1.5rem', color: tokens['text-muted'] }}>Se încarcă...</p>
            ) : recentTransactions.length === 0 ? (
              <p style={{ padding: '1.5rem', color: tokens['text-muted'] }}>Nu există tranzacții.</p>
            ) : (
              <div>
                {recentTransactions.map((tx: any) => {
                  const category = getCategoryForTransaction(tx.categoryId);
                  return (
                    <div 
                      key={tx.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem 1.5rem',
                        borderBottom: `1px solid ${tokens['border-default']}`,
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = tokens['bg-hover']}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      onClick={() => {
                        // TODO: Open transaction detail/edit modal
                        toast.info('Funcționalitate în dezvoltare');
                      }}
                    >
                      {/* Category Icon */}
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '0.5rem',
                        backgroundColor: category?.color || tokens['bg-elevated'],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        flexShrink: 0
                      }}>
                        {category?.icon || '📁'}
                      </div>
                      
                      {/* Description and Date */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ 
                          margin: 0, 
                          fontWeight: 500, 
                          fontSize: '0.95rem',
                          color: tokens['text-primary'],
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {tx.description}
                        </h4>
                        <span style={{ 
                          fontSize: '0.8rem', 
                          color: tokens['text-muted'] 
                        }}>
                          {new Date(tx.date).toLocaleDateString('ro-RO', { 
                            day: 'numeric', 
                            month: 'short' 
                          })}
                        </span>
                      </div>
                      
                      {/* Amount */}
                      <div style={{ 
                        fontWeight: 600, 
                        fontSize: '0.95rem',
                        color: tx.type === 'income' ? tokens['accent-success'] : tokens['accent-danger'],
                        flexShrink: 0
                      }}>
                        {tx.type === 'income' ? '+' : '-'}{tx.amount.toFixed(2)} RON
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Add Transaction Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Adaugă Tranzacție Nouă"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Anulează</Button>
            <Button 
              variant="primary" 
              onClick={handleAddTransaction}
              disabled={createMutation.isPending || !formData.categoryId}
            >
              {createMutation.isPending ? 'Se salvează...' : 'Salvează'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
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
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense', categoryId: '' })}
            options={[
              { value: 'income', label: 'Venit' },
              { value: 'expense', label: 'Cheltuială' },
            ]}
          />
          <Select
            label="Categorie"
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            options={filteredCategories.map((cat: Category) => ({
              value: cat.id,
              label: cat.name,
            }))}
            placeholder="Selectează categoria"
          />
        </div>
        {createMutation.isError && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem', 
            backgroundColor: 'rgba(244, 63, 94, 0.1)', 
            color: tokens['accent-danger'], 
            borderRadius: '0.5rem',
            border: `1px solid rgba(244, 63, 94, 0.2)`
          }}>
            Eroare la salvarea tranzacției. Încearcă din nou.
          </div>
        )}
      </Modal>
    </div>
  );
}
