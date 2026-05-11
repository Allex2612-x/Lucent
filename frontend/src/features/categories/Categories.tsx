import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesService, CategoryData } from '../../services/categories.service';
import { Category } from '@sasha-licenta/shared';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export function Categories() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryData>({
    name: '',
    type: 'expense',
    color: '#818cf8',
    icon: '',
  });

  // Query for categories
  const { data: categoriesResponse, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getAll(),
  });

  const categories = categoriesResponse?.data?.data || [];

  // Filter categories
  const defaultCategories = categories.filter((cat: Category) => cat.isDefault === true);
  const userCategories = categories.filter((cat: Category) => cat.isDefault === false);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CategoryData) => categoriesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsAddModalOpen(false);
      resetForm();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryData> }) =>
      categoriesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsEditModalOpen(false);
      setEditingCategory(null);
      resetForm();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'expense',
      color: '#818cf8',
      icon: '',
    });
  };

  const handleAddCategory = () => {
    if (formData.name.length < 2) {
      return;
    }
    
    // Check for duplicates (case-insensitive, trimmed)
    const normalizedName = formData.name.trim().toLowerCase();
    const duplicate = categories.find((cat: Category) => 
      cat.name.trim().toLowerCase() === normalizedName && 
      cat.type === formData.type
    );
    
    if (duplicate) {
      alert(`Există deja o categorie cu numele "${formData.name}" pentru tipul selectat.`);
      return;
    }
    
    createMutation.mutate(formData);
  };

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color || '#818cf8',
      icon: category.icon || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateCategory = () => {
    if (editingCategory && formData.name.length >= 2) {
      // Check for duplicates (excluding current category)
      const normalizedName = formData.name.trim().toLowerCase();
      const duplicate = categories.find((cat: Category) => 
        cat.id !== editingCategory.id &&
        cat.name.trim().toLowerCase() === normalizedName && 
        cat.type === formData.type
      );
      
      if (duplicate) {
        alert(`Există deja o categorie cu numele "${formData.name}" pentru tipul selectat.`);
        return;
      }
      
      updateMutation.mutate({ id: editingCategory.id, data: formData });
    }
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm('Sigur doriți să ștergeți această categorie?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const renderCategoryCard = (category: Category, isDefault: boolean) => (
    <div
      key={category.id}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem',
        backgroundColor: '#1e293b',
        borderRadius: '0.5rem',
        border: '1px solid #334155',
        transition: 'border-color 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Color square with icon */}
        <div
          style={{
            width: '3rem',
            height: '3rem',
            backgroundColor: category.color || '#818cf8',
            borderRadius: '0.5rem',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
          }}
        >
          {category.icon || '📁'}
        </div>
        
        {/* Name and type badge */}
        <div>
          <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.375rem', color: '#f8fafc' }}>
            {category.name}
          </div>
          <span
            style={{
              display: 'inline-block',
              padding: '0.125rem 0.625rem',
              borderRadius: '1rem',
              fontSize: '0.75rem',
              fontWeight: 500,
              backgroundColor: category.type === 'income' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: category.type === 'income' ? '#10b981' : '#ef4444',
              border: `1px solid ${category.type === 'income' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            }}
          >
            {category.type === 'income' ? 'Venit' : 'Cheltuială'}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button
          variant="ghost"
          onClick={() => handleEditClick(category)}
          disabled={isDefault}
          style={{ 
            padding: '0.5rem', 
            minWidth: 'auto',
            opacity: isDefault ? 0.5 : 1,
            cursor: isDefault ? 'not-allowed' : 'pointer'
          }}
          title={isDefault ? 'Categoriile implicite nu pot fi editate' : 'Editează categoria'}
        >
          <Edit2 size={16} />
        </Button>
        <Button
          variant="ghost"
          onClick={() => handleDeleteClick(category.id)}
          disabled={isDefault}
          style={{ 
            padding: '0.5rem', 
            minWidth: 'auto', 
            color: isDefault ? '#64748b' : '#ef4444',
            opacity: isDefault ? 0.5 : 1,
            cursor: isDefault ? 'not-allowed' : 'pointer'
          }}
          title={isDefault ? 'Categoriile implicite nu pot fi șterse' : 'Șterge categoria'}
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="categories-container">
      <div className="page-header">
        <div>
          <h1>Categorii</h1>
          <p>Gestionează categoriile de venituri și cheltuieli.</p>
        </div>
        <Button variant="primary" onClick={handleOpenAddModal}>
          <Plus size={18} className="mr-2" style={{ marginRight: '0.5rem' }} /> Adaugă Categorie
        </Button>
      </div>

      {isLoading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
          Se încarcă categoriile...
        </div>
      ) : error ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
          Nu s-au putut încărca datele. Încearcă din nou.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Default Categories Section */}
          <Card>
            <CardHeader>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
                Categorii Implicite
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                Categorii predefinite care nu pot fi modificate sau șterse
              </p>
            </CardHeader>
            <CardBody>
              {defaultCategories.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>
                  Nu există categorii implicite.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {defaultCategories.map((cat: Category) => renderCategoryCard(cat, true))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* User Categories Section */}
          <Card>
            <CardHeader>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
                Categoriile Mele
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                Categorii personalizate create de tine
              </p>
            </CardHeader>
            <CardBody>
              {userCategories.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>
                  Nu ai creat încă categorii personalizate.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {userCategories.map((cat: Category) => renderCategoryCard(cat, false))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Add Category Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Adaugă Categorie Nouă"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Anulează
            </Button>
            <Button
              variant="primary"
              onClick={handleAddCategory}
              disabled={createMutation.isPending || formData.name.length < 2}
            >
              {createMutation.isPending ? 'Se salvează...' : 'Salvează'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          <Input
            label="Nume"
            placeholder="Ex: Transport, Mâncare, Salariu"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formData.name.length > 0 && formData.name.length < 2 ? 'Numele trebuie să aibă minim 2 caractere' : undefined}
          />
          <Select
            label="Tip"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
            options={[
              { value: 'income', label: 'Venit' },
              { value: 'expense', label: 'Cheltuială' },
            ]}
          />
          <div className="input-wrapper">
            <label className="input-label">Culoare</label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              style={{
                width: '100%',
                height: '3rem',
                border: '1px solid #334155',
                borderRadius: '0.5rem',
                backgroundColor: '#0f172a',
                cursor: 'pointer',
              }}
            />
          </div>
          <Input
            label="Iconiță (opțional)"
            placeholder="Ex: 🚗, 🍔, 💰"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
          />
        </div>
        {createMutation.isError && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              borderRadius: '0.5rem',
            }}
          >
            Eroare la salvarea categoriei. Încearcă din nou.
          </div>
        )}
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCategory(null);
          resetForm();
        }}
        title="Editează Categorie"
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
            <Button
              variant="primary"
              onClick={handleUpdateCategory}
              disabled={updateMutation.isPending || formData.name.length < 2}
            >
              {updateMutation.isPending ? 'Se actualizează...' : 'Actualizează'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          <Input
            label="Nume"
            placeholder="Ex: Transport, Mâncare, Salariu"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formData.name.length > 0 && formData.name.length < 2 ? 'Numele trebuie să aibă minim 2 caractere' : undefined}
          />
          <Select
            label="Tip"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
            options={[
              { value: 'income', label: 'Venit' },
              { value: 'expense', label: 'Cheltuială' },
            ]}
          />
          <div className="input-wrapper">
            <label className="input-label">Culoare</label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              style={{
                width: '100%',
                height: '3rem',
                border: '1px solid #334155',
                borderRadius: '0.5rem',
                backgroundColor: '#0f172a',
                cursor: 'pointer',
              }}
            />
          </div>
          <Input
            label="Iconiță (opțional)"
            placeholder="Ex: 🚗, 🍔, 💰"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
          />
        </div>
        {updateMutation.isError && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              borderRadius: '0.5rem',
            }}
          >
            Eroare la actualizarea categoriei. Încearcă din nou.
          </div>
        )}
      </Modal>
    </div>
  );
}
