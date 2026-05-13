import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetsService, BudgetData } from '../../services/budgets.service';
import { categoriesService } from '../../services/categories.service';
import { statisticsService } from '../../services/statistics.service';
import { Budget, Category } from '@sasha-licenta/shared';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { DeleteConfirmationModal } from '../../components/ui/DeleteConfirmationModal';
import { Plus, Edit2, Trash2, PiggyBank } from 'lucide-react';
import { tokens } from '../../styles/colors';
import { toast } from 'sonner';

interface BudgetProgressProps {
  spent: number;
  limit: number;
}

function BudgetProgress({ spent, limit }: BudgetProgressProps) {
  const pct = Math.min((spent / limit) * 100, 100);
  const color = pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981';

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
        <span style={{ color: '#94a3b8' }}>Cheltuit: {spent.toFixed(2)} RON</span>
        <span style={{ color: '#94a3b8' }}>{pct.toFixed(1)}%</span>
      </div>
      <div style={{ background: '#334155', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
        <div 
          style={{ 
            width: `${pct}%`, 
            background: color, 
            height: '100%', 
            borderRadius: '4px',
            transition: 'width 0.3s ease'
          }} 
        />
      </div>
    </div>
  );
}

interface BudgetCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
}

function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const { data: overviewData } = useQuery({
    queryKey: ['statistics', 'overview', budget.month, budget.year],
    queryFn: () => statisticsService.getOverview({ month: budget.month, year: budget.year }),
  });

  const spent = overviewData?.data?.data?.totalExpenses || 0;
  const isTotal = (budget as any).isTotal || false;

  return (
    <Card>
      <CardHeader>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
                {getMonthName(budget.month)} {budget.year}
              </h3>
              {isTotal && (
                <span style={{ 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '1rem', 
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: 'rgba(129, 140, 248, 0.2)',
                  color: '#818cf8',
                  border: '1px solid rgba(129, 140, 248, 0.3)'
                }}>
                  BUGET TOTAL
                </span>
              )}
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
              Limită: {Number(budget.totalLimit).toFixed(2)} RON
            </p>
            {!isTotal && budget.categories && budget.categories.length > 0 && (
              <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                {budget.categories.slice(0, 3).map((bc: any) => (
                  <span 
                    key={bc.id}
                    style={{ 
                      padding: '0.125rem 0.5rem', 
                      borderRadius: '0.75rem', 
                      fontSize: '0.75rem',
                      backgroundColor: 'rgba(100, 116, 139, 0.2)',
                      color: '#cbd5e1'
                    }}
                  >
                    {bc.category?.name}
                  </span>
                ))}
                {budget.categories.length > 3 && (
                  <span style={{ 
                    padding: '0.125rem 0.5rem', 
                    fontSize: '0.75rem',
                    color: '#94a3b8'
                  }}>
                    +{budget.categories.length - 3} mai multe
                  </span>
                )}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              variant="ghost"
              onClick={() => onEdit(budget)}
              style={{ padding: '0.5rem', minWidth: 'auto' }}
            >
              <Edit2 size={16} />
            </Button>
            <Button
              variant="ghost"
              onClick={() => onDelete(budget)}
              style={{ padding: '0.5rem', minWidth: 'auto', color: '#ef4444' }}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <BudgetProgress spent={spent} limit={Number(budget.totalLimit)} />
      </CardBody>
    </Card>
  );
}

interface CategoryLimitField {
  categoryId: string;
  limitAmount: number;
}

export function Budgets() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    totalLimit: 0,
    isTotal: false,
  });

  const [categoryLimits, setCategoryLimits] = useState<CategoryLimitField[]>([
    { categoryId: '', limitAmount: 0 }
  ]);

  // Query for budgets
  const { data: budgetsResponse, isLoading, error } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => budgetsService.getAll(),
    retry: 1,
  });

  // Query for categories (expense only for budgets)
  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getAll(),
  });

  const budgets = budgetsResponse?.data?.data || [];
  const categories = categoriesResponse?.data?.data || [];
  const expenseCategories = categories.filter((cat: Category) => cat.type === 'expense');

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: BudgetData) => budgetsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setIsCreateModalOpen(false);
      resetForm();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BudgetData> }) =>
      budgetsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setIsEditModalOpen(false);
      setEditingBudget(null);
      resetForm();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => budgetsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  const resetForm = () => {
    setFormData({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      totalLimit: 0,
      isTotal: false,
    });
    setCategoryLimits([{ categoryId: '', limitAmount: 0 }]);
  };

  const handleAddCategoryLimit = () => {
    setCategoryLimits([...categoryLimits, { categoryId: '', limitAmount: 0 }]);
  };

  const handleRemoveCategoryLimit = (index: number) => {
    if (categoryLimits.length > 1) {
      setCategoryLimits(categoryLimits.filter((_, i) => i !== index));
    }
  };

  const handleCategoryLimitChange = (index: number, field: keyof CategoryLimitField, value: string | number) => {
    const updated = [...categoryLimits];
    updated[index] = { ...updated[index], [field]: value };
    setCategoryLimits(updated);
  };

  const handleCreateBudget = () => {
    if (formData.isTotal) {
      // Buget total - nu necesită categorii
      const budgetData: BudgetData = {
        month: formData.month,
        year: formData.year,
        totalLimit: formData.totalLimit,
        isTotal: true,
      };
      createMutation.mutate(budgetData);
    } else {
      // Buget pe categorii
      const validCategories = categoryLimits.filter(cl => cl.categoryId && cl.limitAmount > 0);
      
      if (validCategories.length === 0) {
        alert('Adaugă cel puțin o categorie cu o limită validă.');
        return;
      }

      const budgetData: BudgetData = {
        month: formData.month,
        year: formData.year,
        totalLimit: formData.totalLimit,
        isTotal: false,
        categories: validCategories,
      };

      createMutation.mutate(budgetData);
    }
  };

  const handleEditClick = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      month: budget.month,
      year: budget.year,
      totalLimit: Number(budget.totalLimit),
    });
    
    // Pre-populate category limits if available
    if (budget.categories && budget.categories.length > 0) {
      setCategoryLimits(
        budget.categories.map(bc => ({
          categoryId: bc.categoryId,
          limitAmount: Number(bc.limitAmount),
        }))
      );
    } else {
      setCategoryLimits([{ categoryId: '', limitAmount: 0 }]);
    }
    
    setIsEditModalOpen(true);
  };

  const handleUpdateBudget = () => {
    if (!editingBudget) return;

    const validCategories = categoryLimits.filter(cl => cl.categoryId && cl.limitAmount > 0);
    
    if (validCategories.length === 0) {
      alert('Adaugă cel puțin o categorie cu o limită validă.');
      return;
    }

    const budgetData: Partial<BudgetData> = {
      totalLimit: formData.totalLimit,
      categories: validCategories,
    };

    updateMutation.mutate({ id: editingBudget.id, data: budgetData });
  };

  const handleDeleteClick = (budget: Budget) => {
    setBudgetToDelete(budget);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (budgetToDelete) {
      deleteMutation.mutate(budgetToDelete.id);
      setIsDeleteModalOpen(false);
      setBudgetToDelete(null);
      toast.success('Buget șters cu succes!');
    }
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  return (
    <div className="budgets-container">
      <div className="page-header">
        <div>
          <h1>Bugete Lunare</h1>
          <p>Gestionează bugetele și monitorizează cheltuielile tale lunare.</p>
        </div>
        <Button variant="primary" onClick={handleOpenCreateModal}>
          <Plus size={18} style={{ marginRight: '0.5rem' }} /> Creează Buget
        </Button>
      </div>

      {isLoading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
          Se încarcă bugetele...
        </div>
      ) : error ? (
        <Card>
          <CardBody>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444', marginBottom: '1rem' }}>
                Nu s-au putut încărca datele. Încearcă din nou.
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {error instanceof Error ? error.message : 'Eroare necunoscută'}
              </p>
              <Button variant="primary" onClick={() => queryClient.invalidateQueries({ queryKey: ['budgets'] })}>
                Reîncearcă
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : budgets.length === 0 ? (
        <Card>
          <CardBody>
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <PiggyBank size={48} style={{ color: '#475569', margin: '0 auto 1rem' }} />
              <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
                Nu ai configurat niciun buget încă.
              </p>
              <Button variant="primary" onClick={handleOpenCreateModal}>
                Creează Primul Buget
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {budgets.map((budget: Budget) => (
            <BudgetCard 
              key={budget.id} 
              budget={budget} 
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Creează Buget Nou"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Anulează
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateBudget}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Se salvează...' : 'Salvează'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Select
              label="Luna"
              value={formData.month.toString()}
              onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
              options={Array.from({ length: 12 }, (_, i) => ({
                value: (i + 1).toString(),
                label: getMonthName(i + 1),
              }))}
            />
            <Input
              label="Anul"
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
            />
          </div>

          {/* Toggle pentru tip buget */}
          <div style={{ padding: '1rem', backgroundColor: 'rgba(100, 116, 139, 0.1)', borderRadius: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#e2e8f0', marginBottom: '0.75rem', display: 'block' }}>
              Tip Buget
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="budgetType"
                  checked={!formData.isTotal}
                  onChange={() => setFormData({ ...formData, isTotal: false })}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ color: '#e2e8f0' }}>Buget pe Categorii</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="budgetType"
                  checked={formData.isTotal}
                  onChange={() => setFormData({ ...formData, isTotal: true })}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ color: '#e2e8f0' }}>Buget Total Lunar</span>
              </label>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem', marginBottom: 0 }}>
              {formData.isTotal 
                ? 'Plafonul general de cheltuieli pentru întreaga lună' 
                : 'Limite separate pentru fiecare categorie de cheltuieli'}
            </p>
          </div>

          <Input
            label="Limită Totală (RON)"
            type="number"
            placeholder="0.00"
            value={formData.totalLimit || ''}
            onChange={(e) => setFormData({ ...formData, totalLimit: parseFloat(e.target.value) || 0 })}
          />

          {!formData.isTotal && (
            <div style={{ borderTop: '1px solid #334155', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#e2e8f0' }}>
                  Limite pe Categorii
                </label>
                <Button
                  variant="secondary"
                  onClick={handleAddCategoryLimit}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                >
                  <Plus size={16} style={{ marginRight: '0.25rem' }} /> Adaugă Categorie
                </Button>
              </div>

              {categoryLimits.map((cl, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <Select
                    value={cl.categoryId}
                    onChange={(e) => handleCategoryLimitChange(index, 'categoryId', e.target.value)}
                    options={expenseCategories.map((cat: Category) => ({
                      value: cat.id,
                      label: cat.name,
                    }))}
                    placeholder="Selectează categoria"
                  />
                  <Input
                    type="number"
                    placeholder="Limită (RON)"
                    value={cl.limitAmount || ''}
                    onChange={(e) => handleCategoryLimitChange(index, 'limitAmount', parseFloat(e.target.value) || 0)}
                  />
                  {categoryLimits.length > 1 && (
                    <Button
                      variant="ghost"
                      onClick={() => handleRemoveCategoryLimit(index)}
                      style={{ padding: '0.5rem', minWidth: 'auto', color: '#ef4444' }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {createMutation.isError && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '0.5rem' }}>
            <strong>Eroare la salvarea bugetului:</strong>
            <br />
            {(createMutation.error as any)?.response?.data?.message || 'Încearcă din nou.'}
          </div>
        )}
      </Modal>

      {/* Edit Budget Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingBudget(null);
          resetForm();
        }}
        title="Editează Buget"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingBudget(null);
                resetForm();
              }}
            >
              Anulează
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateBudget}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Se actualizează...' : 'Actualizează'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Select
              label="Luna"
              value={formData.month.toString()}
              disabled
              options={Array.from({ length: 12 }, (_, i) => ({
                value: (i + 1).toString(),
                label: getMonthName(i + 1),
              }))}
            />
            <Input
              label="Anul"
              type="number"
              value={formData.year}
              disabled
            />
          </div>

          <Input
            label="Limită Totală (RON)"
            type="number"
            placeholder="0.00"
            value={formData.totalLimit || ''}
            onChange={(e) => setFormData({ ...formData, totalLimit: parseFloat(e.target.value) || 0 })}
          />

          <div style={{ borderTop: '1px solid #334155', paddingTop: '1rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#e2e8f0' }}>
                Limite pe Categorii
              </label>
              <Button
                variant="secondary"
                onClick={handleAddCategoryLimit}
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                <Plus size={16} style={{ marginRight: '0.25rem' }} /> Adaugă Categorie
              </Button>
            </div>

            {categoryLimits.map((cl, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <Select
                  value={cl.categoryId}
                  onChange={(e) => handleCategoryLimitChange(index, 'categoryId', e.target.value)}
                  options={expenseCategories.map((cat: Category) => ({
                    value: cat.id,
                    label: cat.name,
                  }))}
                  placeholder="Selectează categoria"
                />
                <Input
                  type="number"
                  placeholder="Limită (RON)"
                  value={cl.limitAmount || ''}
                  onChange={(e) => handleCategoryLimitChange(index, 'limitAmount', parseFloat(e.target.value) || 0)}
                />
                {categoryLimits.length > 1 && (
                  <Button
                    variant="ghost"
                    onClick={() => handleRemoveCategoryLimit(index)}
                    style={{ padding: '0.5rem', minWidth: 'auto', color: '#ef4444' }}
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {updateMutation.isError && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '0.5rem' }}>
            Eroare la actualizarea bugetului. Încearcă din nou.
          </div>
        )}
      </Modal>

      {/* Delete Budget Modal */}
      {budgetToDelete && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setBudgetToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Șterge Buget"
          message="Sigur vrei să ștergi acest buget?"
          itemDetails={
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: tokens['text-muted'], fontSize: '0.875rem' }}>
                  Perioadă:
                </span>
                <span style={{ color: tokens['text-primary'], fontWeight: 500 }}>
                  {getMonthName(budgetToDelete.month)} {budgetToDelete.year}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: tokens['text-muted'], fontSize: '0.875rem' }}>
                  Limită totală:
                </span>
                <span style={{ color: tokens['text-primary'], fontWeight: 500 }}>
                  {Number(budgetToDelete.totalLimit).toFixed(2)} RON
                </span>
              </div>
              {budgetToDelete.categories && budgetToDelete.categories.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: tokens['text-muted'], fontSize: '0.875rem' }}>
                    Categorii:
                  </span>
                  <span style={{ color: tokens['text-primary'], fontWeight: 500 }}>
                    {budgetToDelete.categories.length}
                  </span>
                </div>
              )}
            </div>
          }
          confirmButtonText="Șterge Buget"
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}

// Helper function to get month name in Romanian
function getMonthName(month: number): string {
  const months = [
    'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
    'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
  ];
  return months[month - 1] || '';
}
