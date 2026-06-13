import { Fragment } from 'react';
import { AlertTriangle, X } from 'lucide-react';
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
  affectedMonths?: Array<{ month: number; year: number; overage: number }>;
}

const MONTH_NAMES = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'];

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
  // Custom overlay (instead of using <Modal/>) so we can sit above other
  // open modals (e.g. the Add Transaction form that's still on screen when
  // the budget warning surfaces). Modal uses z-index 1000; we use 1100.
  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 1100 }}
      onClick={onCancel}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Atenție — bugetul va fi depășit</h3>
          <button className="modal-close-btn" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
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

              {warning.affectedMonths && warning.affectedMonths.length > 1 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 8 }}>
                    Luni afectate de tranzacția recurentă
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 6, columnGap: 12, fontSize: 12.5 }}>
                    {warning.affectedMonths.map((m) => (
                      <Fragment key={`${m.year}-${m.month}`}>
                        <span style={{ color: 'var(--text-2)' }}>{MONTH_NAMES[m.month - 1]} {m.year}</span>
                        <span className="num" style={{ color: 'var(--expense)', fontWeight: 600 }}>+ {fmt(m.overage)} RON</span>
                      </Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
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
        </div>
      </div>
    </div>
  );
}
