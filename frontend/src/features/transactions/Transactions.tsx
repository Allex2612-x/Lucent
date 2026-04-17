import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Transaction } from '@sasha-licenta/shared';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Filter } from 'lucide-react';

const MOCK_TRANSACTIONS = [
  { id: '1', amount: 3500, type: 'income', description: 'Salariu', date: new Date('2026-04-10').toISOString(), categoryId: 'cat-1', userId: 'user-1', isRecurring: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '2', amount: 150, type: 'expense', description: 'Utilități', date: new Date('2026-04-12').toISOString(), categoryId: 'cat-2', userId: 'user-1', isRecurring: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '3', amount: 320, type: 'expense', description: 'Cumpărături', date: new Date('2026-04-15').toISOString(), categoryId: 'cat-3', userId: 'user-1', isRecurring: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data.data.length ? res.data.data : MOCK_TRANSACTIONS);
    } catch (error) {
      console.warn('Backend connection failed or empty, using mock data.');
      setTransactions(MOCK_TRANSACTIONS as unknown as Transaction[]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transactions-container">
      <div className="page-header">
        <div>
          <h1>Tranzacții</h1>
          <p>Gestionează și urmărește istoricul tranzacțiilor tale.</p>
        </div>
        <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} className="mr-2" style={{ marginRight: '0.5rem' }} /> Adaugă Tranzacție
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: '500px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <Input placeholder="Caută tranzacții..." style={{ paddingLeft: '2.5rem', marginBottom: 0 }} fullWidth />
              </div>
              <Button variant="secondary" style={{ marginBottom: 0 }}>
                <Filter size={18} style={{ marginRight: '0.5rem' }} /> Filtre
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Se încarcă tranzacțiile...</div>
          ) : transactions.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Nu există tranzacții înregistrate.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Dată</th>
                    <th>Descriere</th>
                    <th>Tip</th>
                    <th style={{ textAlign: 'right' }}>Sumă</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id}>
                      <td style={{ color: '#94a3b8' }}>{new Date(t.date).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 500 }}>{t.description || '-'}</td>
                      <td>
                        <span style={{ 
                          padding: '0.25rem 0.75rem', 
                          borderRadius: '1rem', 
                          fontSize: '0.85rem',
                          backgroundColor: t.type === 'income' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: t.type === 'income' ? '#10b981' : '#ef4444'
                        }}>
                          {t.type === 'income' ? 'Venit' : 'Cheltuială'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: t.type === 'income' ? '#10b981' : 'inherit' }}>
                        {t.type === 'income' ? '+' : '-'}{Number(t.amount).toFixed(2)} RON
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Adaugă Tranzacție Nouă"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Anulează</Button>
            <Button variant="primary">Salvează</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <Input label="Descriere" placeholder="Ex: Cumpărături supermarket" />
          </div>
          <Input label="Sumă (RON)" type="number" placeholder="0.00" />
          <Input label="Data" type="date" />
        </div>
      </Modal>
    </div>
  );
}
