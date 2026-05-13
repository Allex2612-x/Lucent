import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { tokens } from '../../styles/colors';

export interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deleteFuture?: boolean) => void;
  title: string;
  message: string;
  itemDetails?: React.ReactNode;
  warningText?: string;
  confirmButtonText?: string;
  confirmButtonVariant?: 'danger' | 'primary';
  isLoading?: boolean;
  isRecurring?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemDetails,
  warningText,
  confirmButtonText,
  confirmButtonVariant = 'danger',
  isLoading = false,
  isRecurring = false,
}: DeleteConfirmationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        isRecurring ? (
          // Recurring transaction: show two action buttons
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={onClose} disabled={isLoading}>
              Anulează
            </Button>
            <Button
              variant="danger"
              onClick={() => onConfirm(false)}
              disabled={isLoading}
            >
              {isLoading ? 'Se șterge...' : 'Șterge doar această tranzacție'}
            </Button>
            <Button
              variant="danger"
              onClick={() => onConfirm(true)}
              disabled={isLoading}
            >
              {isLoading ? 'Se șterge...' : 'Șterge această tranzacție și toate viitoare'}
            </Button>
          </div>
        ) : (
          // Non-recurring transaction: show standard single delete button
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={onClose} disabled={isLoading}>
              Anulează
            </Button>
            <Button
              variant={confirmButtonVariant}
              onClick={() => onConfirm()}
              disabled={isLoading}
            >
              {isLoading ? 'Se șterge...' : confirmButtonText || 'Șterge'}
            </Button>
          </div>
        )
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Warning Alert */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '1rem',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '0.5rem',
          }}
        >
          <AlertTriangle
            size={24}
            style={{ color: '#F59E0B', flexShrink: 0, marginTop: '0.125rem' }}
            aria-label="Avertizare"
          />
          <div style={{ flex: 1 }}>
            <p
              style={{
                margin: 0,
                color: tokens['text-primary'],
                fontWeight: 500,
                marginBottom: '0.25rem',
              }}
            >
              {message}
            </p>
            <p
              style={{
                margin: 0,
                color: tokens['text-muted'],
                fontSize: '0.875rem',
              }}
            >
              Această acțiune nu poate fi anulată.
            </p>
          </div>
        </div>

        {/* Item Details */}
        {itemDetails && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: tokens['bg-elevated'],
              border: `1px solid ${tokens['border-default']}`,
              borderRadius: '0.5rem',
            }}
          >
            {itemDetails}
          </div>
        )}

        {/* Warning Text */}
        {warningText && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(245, 158, 11, 0.05)',
              border: `1px solid rgba(245, 158, 11, 0.2)`,
              borderRadius: '0.5rem',
            }}
          >
            <AlertTriangle
              size={16}
              style={{ color: '#F59E0B', flexShrink: 0, marginTop: '0.125rem' }}
            />
            <p
              style={{
                margin: 0,
                color: tokens['text-secondary'],
                fontSize: '0.875rem',
              }}
            >
              {warningText}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
