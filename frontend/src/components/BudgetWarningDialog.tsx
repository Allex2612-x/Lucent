import { AlertTriangle } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

export interface BudgetWarningPayload {
  categoryId?: string;
  categoryName: string;
  month?: number;
  year?: number;
  currentSpent?: number;
  budgetLimit?: number;
  newTotal?: number;
  overage?: number;
}

interface BudgetWarningDialogProps {
  warning: BudgetWarningPayload | null;
  onCancel: () => void;
  onConfirm: () => void;
  isPending?: boolean;
}

const fmt = (n: number) =>
  n.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function BudgetWarningDialog({
  warning,
  onCancel,
  onConfirm,
  isPending,
}: BudgetWarningDialogProps) {
  if (!warning) return null;
  const overage = warning.overage ?? 0;
  return (
    <Modal
      isOpen={!!warning}
      onClose={onCancel}
      title="Atenție — bugetul va fi depășit"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={isPending}>
            Anulează
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={isPending}
            style={{ background: 'var(--expense)', color: '#fff', borderColor: 'var(--expense)' }}
          >
            {isPending ? 'Se salvează...' : 'Continuă oricum'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'var(--warn-soft)',
            color: 'var(--warn)',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.55 }}>
            Această tranzacție va trece categoria{' '}
            <b style={{ color: 'var(--text-1)' }}>{warning.categoryName}</b>{' '}
            peste limita lunară.
          </div>

          <div
            style={{
              marginTop: 14,
              padding: 14,
              background: 'var(--bg-subtle)',
              borderRadius: 12,
              fontSize: 12.5,
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              rowGap: 8,
              columnGap: 12,
            }}
          >
            {warning.currentSpent !== undefined && (
              <>
                <span style={{ color: 'var(--text-2)' }}>Cheltuit până acum</span>
                <span className="num">{fmt(warning.currentSpent)} RON</span>
              </>
            )}
            {warning.budgetLimit !== undefined && (
              <>
                <span style={{ color: 'var(--text-2)' }}>Limita lunară</span>
                <span className="num">{fmt(warning.budgetLimit)} RON</span>
              </>
            )}
            {warning.newTotal !== undefined && (
              <>
                <span
                  style={{
                    color: 'var(--text-2)',
                    borderTop: '1px dashed var(--border-strong)',
                    paddingTop: 8,
                  }}
                >
                  Total prognozat
                </span>
                <span
                  className="num"
                  style={{
                    color: 'var(--expense)',
                    fontWeight: 600,
                    borderTop: '1px dashed var(--border-strong)',
                    paddingTop: 8,
                  }}
                >
                  {fmt(warning.newTotal)} RON
                </span>
              </>
            )}
            {overage > 0 && (
              <>
                <span style={{ color: 'var(--text-2)' }}>Depășire</span>
                <span className="num" style={{ color: 'var(--expense)', fontWeight: 600 }}>
                  + {fmt(overage)} RON
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
