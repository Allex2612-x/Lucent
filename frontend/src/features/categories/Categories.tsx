import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { categoriesService, CategoryData } from '../../services/categories.service';
import { statisticsService } from '../../services/statistics.service';
import { Category } from '@sasha-licenta/shared';
import { CHART_COLORS } from '../../styles/colors';
import { CategoryIcon } from '../../components/CategoryIcon';

const fmt = (n: number, dec = 0) =>
  n.toLocaleString('ro-RO', { minimumFractionDigits: dec, maximumFractionDigits: dec });

interface CardDatum {
  cat: Category;
  count: number;
  total: number;
}

function CategoryCard({
  c,
  onEdit,
  onDelete,
  canEdit,
}: {
  c: CardDatum;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
}) {
  const color = c.cat.color || '#2547f5';
  return (
    <div className="card" style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 90,
          height: 90,
          borderRadius: '50%',
          background: color,
          opacity: 0.07,
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `${color}1a`,
            color,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <CategoryIcon icon={c.cat.icon} name={c.cat.name} size={20} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {c.cat.isDefault ? (
            <span
              className="chip"
              style={{
                background: 'var(--bg-inset)',
                color: 'var(--text-3)',
                border: 'none',
                fontSize: 10,
              }}
            >
              Predefinită
            </span>
          ) : (
            <span
              className="chip"
              style={{
                background: 'var(--accent-soft)',
                color: 'var(--accent-ink)',
                border: 'none',
                fontSize: 10,
              }}
            >
              Personalizată
            </span>
          )}
        </div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{c.cat.name}</div>
      <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
        {c.count} tranzacții · luna asta
      </div>
      <div
        className="num"
        style={{
          fontSize: 22,
          fontWeight: 500,
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          letterSpacing: '-0.015em',
          marginTop: 12,
        }}
      >
        {fmt(c.total)}
        <span
          style={{
            fontSize: 11.5,
            color: 'var(--text-3)',
            fontFamily: 'var(--font-sans)',
            fontStyle: 'normal',
            marginLeft: 4,
          }}
        >
          RON
        </span>
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
        {canEdit ? (
          <button
            className="btn btn-secondary btn-sm"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={onEdit}
            title="Editează"
          >
            <Edit2 size={11} /> Editează
          </button>
        ) : (
          <div
            style={{
              flex: 1,
              fontSize: 11.5,
              color: 'var(--text-3)',
              textAlign: 'center',
              padding: '8px 10px',
              fontStyle: 'italic',
            }}
          >
            categorie sistem
          </div>
        )}
        {!c.cat.isDefault && (
          <button
            className="btn btn-secondary btn-sm"
            style={{ width: 32, padding: 0, justifyContent: 'center', color: 'var(--expense)' }}
            onClick={onDelete}
            title="Șterge"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

export function Categories() {
  const queryClient = useQueryClient();
  const now = new Date();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryData>({
    name: '',
    type: 'expense',
    color: '#2547f5',
    icon: '',
  });

  const { data: categoriesResponse, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getAll(),
  });

  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const { data: incomeStats } = useQuery({
    queryKey: ['statistics', 'by-category-income', now.getMonth() + 1, now.getFullYear()],
    queryFn: () => statisticsService.getByCategory({ startDate: monthStart, type: 'income' }),
  });
  const { data: expenseStats } = useQuery({
    queryKey: ['statistics', 'by-category-expense', now.getMonth() + 1, now.getFullYear()],
    queryFn: () => statisticsService.getByCategory({ startDate: monthStart, type: 'expense' }),
  });

  const categories: Category[] = categoriesResponse?.data?.data || [];

  const statsByCategoryId = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    [...(incomeStats?.data?.data || []), ...(expenseStats?.data?.data || [])].forEach((row: any) => {
      map[row.categoryId] = { total: Number(row.total), count: Number(row.count || 0) };
    });
    return map;
  }, [incomeStats, expenseStats]);

  const buildCards = (type: 'income' | 'expense'): CardDatum[] =>
    categories
      .filter((c) => c.type === type)
      .map((cat) => {
        const stat = statsByCategoryId[cat.id] || { total: 0, count: 0 };
        return { cat, total: stat.total, count: stat.count };
      });

  const incomeCards = buildCards('income');
  const expenseCards = buildCards('expense');

  const incomeTotal = incomeCards.reduce((s, c) => s + c.total, 0);
  const expenseTotal = expenseCards.reduce((s, c) => s + c.total, 0);

  const createMutation = useMutation({
    mutationFn: (data: CategoryData) => categoriesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsAddModalOpen(false);
      resetForm();
      toast.success('Categorie creată.');
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || 'Eroare la creare.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryData> }) =>
      categoriesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsEditModalOpen(false);
      setEditingCategory(null);
      resetForm();
      toast.success('Categorie actualizată.');
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || 'Eroare la actualizare.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categorie ștearsă.');
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || 'Eroare la ștergere.'),
  });

  const resetForm = () =>
    setFormData({ name: '', type: 'expense', color: '#2547f5', icon: '' });

  const handleAdd = () => {
    if (formData.name.trim().length < 2) {
      toast.error('Numele trebuie să aibă cel puțin 2 caractere.');
      return;
    }
    const normalized = formData.name.trim().toLowerCase();
    const dup = categories.find(
      (c) => c.name.trim().toLowerCase() === normalized && c.type === formData.type,
    );
    if (dup) {
      toast.error('Există deja o categorie cu acest nume.');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEditOpen = (category: Category) => {
    if (category.isDefault) {
      // Defensive: the UI already hides the Edit button on default categories,
      // and the backend rejects the request — this guard catches any callers
      // that bypass both.
      toast.error('Categoriile predefinite nu pot fi editate.');
      return;
    }
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color || '#2547f5',
      icon: category.icon || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (!editingCategory || formData.name.trim().length < 2) {
      toast.error('Numele trebuie să aibă cel puțin 2 caractere.');
      return;
    }
    const normalized = formData.name.trim().toLowerCase();
    const dup = categories.find(
      (c) =>
        c.id !== editingCategory.id &&
        c.name.trim().toLowerCase() === normalized &&
        c.type === formData.type,
    );
    if (dup) {
      toast.error('Există deja o categorie cu acest nume.');
      return;
    }
    updateMutation.mutate({ id: editingCategory.id, data: formData });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Sigur doriți să ștergeți această categorie?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Categorii</div>
          <div className="page-sub">
            Organizează-ți banii pe categorii predefinite sau create de tine.
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
        >
          <Plus size={14} /> Categorie nouă
        </button>
      </div>

      {isLoading ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>Se încarcă...</div>
      ) : (
        <>
          {/* Income section */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <ArrowUp size={14} style={{ color: 'var(--income)' }} />
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Venituri
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                {incomeCards.length} categorii · {fmt(incomeTotal)} RON total
              </div>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {incomeCards.map((c) => (
                <CategoryCard
                  key={c.cat.id}
                  c={c}
                  canEdit={!c.cat.isDefault}
                  onEdit={() => handleEditOpen(c.cat)}
                  onDelete={() => handleDelete(c.cat.id)}
                />
              ))}
              <button
                style={{
                  border: '1.5px dashed var(--border-strong)',
                  borderRadius: 14,
                  minHeight: 200,
                  background: 'transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  color: 'var(--text-2)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
                onClick={() => {
                  resetForm();
                  setFormData((s) => ({ ...s, type: 'income' }));
                  setIsAddModalOpen(true);
                }}
              >
                <Plus size={22} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>Adaugă categorie venit</span>
              </button>
            </div>
          </div>

          {/* Expense section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <ArrowDown size={14} style={{ color: 'var(--expense)' }} />
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Cheltuieli
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                {expenseCards.length} categorii · {fmt(expenseTotal)} RON total
              </div>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {expenseCards.map((c) => (
                <CategoryCard
                  key={c.cat.id}
                  c={c}
                  canEdit={!c.cat.isDefault}
                  onEdit={() => handleEditOpen(c.cat)}
                  onDelete={() => handleDelete(c.cat.id)}
                />
              ))}
              <button
                style={{
                  border: '1.5px dashed var(--border-strong)',
                  borderRadius: 14,
                  minHeight: 200,
                  background: 'transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  color: 'var(--text-2)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
                onClick={() => {
                  resetForm();
                  setFormData((s) => ({ ...s, type: 'expense' }));
                  setIsAddModalOpen(true);
                }}
              >
                <Plus size={22} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>Adaugă categorie cheltuială</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Adaugă categorie nouă"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Anulează
            </Button>
            <Button variant="primary" onClick={handleAdd} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Se salvează...' : 'Salvează'}
            </Button>
          </>
        }
      >
        <CategoryFormFields formData={formData} setFormData={setFormData} />
      </Modal>

      {/* Edit modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCategory(null);
          resetForm();
        }}
        title="Editează categoria"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingCategory(null);
                resetForm();
              }}
            >
              Anulează
            </Button>
            <Button variant="primary" onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Se actualizează...' : 'Actualizează'}
            </Button>
          </>
        }
      >
        <CategoryFormFields formData={formData} setFormData={setFormData} />
      </Modal>
    </>
  );
}

function CategoryFormFields({
  formData,
  setFormData,
}: {
  formData: CategoryData;
  setFormData: React.Dispatch<React.SetStateAction<CategoryData>>;
}) {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <Input
        label="Nume"
        placeholder="Ex: Transport, Mâncare, Salariu"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <Select
        label="Tip"
        value={formData.type}
        onChange={(e) =>
          setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })
        }
        options={[
          { value: 'income', label: 'Venit' },
          { value: 'expense', label: 'Cheltuială' },
        ]}
      />
      <div className="field">
        <label>Culoare</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CHART_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData({ ...formData, color })}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: color,
                border:
                  formData.color === color
                    ? '2px solid var(--text-1)'
                    : '1px solid var(--border)',
                cursor: 'pointer',
                padding: 0,
              }}
              title={color}
            />
          ))}
          <input
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            style={{
              width: 32,
              height: 32,
              border: '1px solid var(--border)',
              borderRadius: 8,
              cursor: 'pointer',
              background: '#fff',
            }}
            title="Personalizat"
          />
        </div>
      </div>
      <Input
        label="Iconiță (opțional)"
        placeholder="Ex: 🚗 🍔 💰"
        value={formData.icon}
        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
      />
    </div>
  );
}
