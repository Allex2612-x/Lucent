import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsService, TransactionData } from '../../services/transactions.service';
import { categoriesService } from '../../services/categories.service';
import { Transaction, Category } from '@sasha-licenta/shared';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Filter, Edit2, Trash2 } from 'lucide-react';

export function Transactions() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState<TransactionData>({
    description: '',
    amount: 0,
    type: 'expense',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Query for transactions
  const { data: transactionsResponse, isLoading, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionsService.getAll(),
  });

  // Query for categories
  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getAll(),
  });

  const transactions = transactionsResponse?.data?.data || [];
  const categories = categoriesResponse?.data?.data || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: TransactionData) => transactionsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      setIsAddModalOpen(false);
      resetForm();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TransactionData> }) =>
      transactionsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      setIsEditModalOpen(false);
      setEditingTransaction(null);
      resetForm();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => transactionsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
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

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      description: transaction.description || '',
      amount: Number(transaction.amount),
      type: transaction.type,
      categoryId: transaction.categoryId,
      date: new Date(transaction.date).toISOString().split('T')[0],
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateTransaction = () => {
    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data: formData });
    }
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm('Sigur doriți să ștergeți această tranzacție?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  // Filter categories based on selected type
  const filteredCategories = categories.filter(
    (cat: Category) => cat.type === formData.type
  );

  return (
    <div className="transactions-container">
      <div className="page-header">
        <div>
          <h1>Tranzacții</h1>
          <p>Gestionează și urmărește istoricul tranzacțiilor tale.</p>
        </div>
        <Button variant="primary" onClick={handleOpenAddModal}>
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
          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Se încarcă tranzacțiile...</div>
          ) : error ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
              Nu s-au putut încărca datele. Încearcă din nou.
            </div>
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
                    <th style={{ textAlign: 'center' }}>Acțiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t: Transaction) => (
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
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <Button
                            variant="ghost"
                            onClick={() => handleEditClick(t)}
                            style={{ padding: '0.5rem', minWidth: 'auto' }}
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleDeleteClick(t.id)}
                            style={{ padding: '0.5rem', minWidth: 'auto', color: '#ef4444' }}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

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
              disabled={createMutation.isPending}
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
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '0.5rem' }}>
            Eroare la salvarea tranzacției. Încearcă din nou.
          </div>
        )}
      </Modal>

      {/* Edit Transaction Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTransaction(null);
          resetForm();
        }} 
        title="Editează Tranzacție"
        footer={
          <>
            <Button variant="ghost" onClick={() => {
              setIsEditModalOpen(false);
              setEditingTransaction(null);
              resetForm();
            }}>Anulează</Button>
            <Button 
              variant="primary" 
              onClick={handleUpdateTransaction}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Se actualizează...' : 'Actualizează'}
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
        {updateMutation.isError && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '0.5rem' }}>
            Eroare la actualizarea tranzacției. Încearcă din nou.
          </div>
        )}
      </Modal>
    </div>
  );
}
