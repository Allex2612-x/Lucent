import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { tokens } from '../../styles/colors';

export interface BudgetWarning {
  categoryId: string;
  categoryName: string;
  month: number;
  year: number;
  currentSpent: number;
  budgetLimit: number;
  newTotal: number;
  overage: number;
  affectedMonths?: Array<{
    month: number;
    year: number;
    overage: number;
  }>;
}

export interface BudgetWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  warning: BudgetWarning | null;
}

const MONTH_NAMES = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'RON',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatMonth(month: number, year: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function BudgetWarningModal({
  isOpen,
  onClose,
  onConfirm,
  warning,
}: BudgetWarningModalProps) {
  if (!warning) return null;

  const hasMultipleMonths = warning.affectedMonths && warning.affectedMonths.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Atenție: Buget Depășit"
      footer={
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>
            Anulează
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            Confirmă
          </Button>
        </div>
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
            backgroundColor: tokens['accent-warning-soft'],
            border: `1px solid ${tokens['accent-warning']}`,
            borderRadius: '0.5rem',
          }}
        >
          <AlertTriangle
            size={24}
            style={{ color: tokens['accent-warning'], flexShrink: 0, marginTop: '0.125rem' }}
            aria-label="Avertizare buget"
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
              Această tranzacție depășește bugetul categoriei
            </p>
            <p
              style={{
                margin: 0,
                color: tokens['text-muted'],
                fontSize: '0.875rem',
              }}
            >
              Poți continua, dar vei depăși limita stabilită.
            </p>
          </div>
        </div>

        {/* Budget Information */}
        <div
          style={{
            padding: '1rem',
            backgroundColor: tokens['bg-elevated'],
            border: `1px solid ${tokens['border-default']}`,
            borderRadius: '0.5rem',
          }}
        >
          <div style={{ marginBottom: '0.75rem' }}>
            <p
              style={{
                margin: 0,
                color: tokens['text-secondary'],
                fontSize: '0.875rem',
                marginBottom: '0.25rem',
              }}
            >
              Categorie
            </p>
            <p
              style={{
                margin: 0,
                color: tokens['text-primary'],
                fontWeight: 500,
                fontSize: '1rem',
              }}
            >
              {warning.categoryName}
            </p>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <p
              style={{
                margin: 0,
                color: tokens['text-secondary'],
                fontSize: '0.875rem',
                marginBottom: '0.25rem',
              }}
            >
              Lună
            </p>
            <p
              style={{
                margin: 0,
                color: tokens['text-primary'],
                fontWeight: 500,
                fontSize: '1rem',
              }}
            >
              {formatMonth(warning.month, warning.year)}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: `1px solid ${tokens['border-default']}`,
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  color: tokens['text-secondary'],
                  fontSize: '0.875rem',
                  marginBottom: '0.25rem',
                }}
              >
                Cheltuit curent
              </p>
              <p
                style={{
                  margin: 0,
                  color: tokens['text-primary'],
                  fontWeight: 500,
                  fontSize: '1rem',
                }}
              >
                {formatCurrency(warning.currentSpent)}
              </p>
            </div>

            <div>
              <p
                style={{
                  margin: 0,
                  color: tokens['text-secondary'],
                  fontSize: '0.875rem',
                  marginBottom: '0.25rem',
                }}
              >
                Limită buget
              </p>
              <p
                style={{
                  margin: 0,
                  color: tokens['text-primary'],
                  fontWeight: 500,
                  fontSize: '1rem',
                }}
              >
                {formatCurrency(warning.budgetLimit)}
              </p>
            </div>

            <div>
              <p
                style={{
                  margin: 0,
                  color: tokens['text-secondary'],
                  fontSize: '0.875rem',
                  marginBottom: '0.25rem',
                }}
              >
                Total nou
              </p>
              <p
                style={{
                  margin: 0,
                  color: tokens['accent-danger'],
                  fontWeight: 600,
                  fontSize: '1rem',
                }}
              >
                {formatCurrency(warning.newTotal)}
              </p>
            </div>

            <div>
              <p
                style={{
                  margin: 0,
                  color: tokens['text-secondary'],
                  fontSize: '0.875rem',
                  marginBottom: '0.25rem',
                }}
              >
                Depășire
              </p>
              <p
                style={{
                  margin: 0,
                  color: tokens['accent-danger'],
                  fontWeight: 600,
                  fontSize: '1rem',
                }}
              >
                +{formatCurrency(warning.overage)}
              </p>
            </div>
          </div>
        </div>

        {/* Affected Months List (for recurring transactions) */}
        {hasMultipleMonths && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: tokens['bg-elevated'],
              border: `1px solid ${tokens['border-default']}`,
              borderRadius: '0.5rem',
            }}
          >
            <p
              style={{
                margin: 0,
                color: tokens['text-primary'],
                fontWeight: 500,
                marginBottom: '0.75rem',
              }}
            >
              Luni afectate de tranzacția recurentă
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {warning.affectedMonths!.map((month, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem',
                    backgroundColor: tokens['bg-surface'],
                    borderRadius: '0.375rem',
                  }}
                >
                  <span
                    style={{
                      color: tokens['text-secondary'],
                      fontSize: '0.875rem',
                    }}
                  >
                    {formatMonth(month.month, month.year)}
                  </span>
                  <span
                    style={{
                      color: tokens['accent-danger'],
                      fontWeight: 500,
                      fontSize: '0.875rem',
                    }}
                  >
                    +{formatCurrency(month.overage)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
