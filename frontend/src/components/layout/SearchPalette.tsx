import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, List, Tag, ArrowRight } from 'lucide-react';
import { transactionsService } from '../../services/transactions.service';
import { categoriesService } from '../../services/categories.service';
import { formatFullDate } from '../../utils/dateFormat';

interface SearchPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  date: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
}

interface Result {
  kind: 'transaction' | 'category';
  id: string;
  primary: string;
  secondary?: string;
  href: string;
  icon: React.ReactNode;
  rightSlot?: React.ReactNode;
}

const fmt = (n: number) =>
  n.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function SearchPalette({ open, onClose }: SearchPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Reset state each time the palette opens
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      // Focus the input on the next frame so the modal is mounted
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const { data: txData } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionsService.getAll(),
    enabled: open,
    staleTime: 60_000,
  });
  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getAll(),
    enabled: open,
    staleTime: 60_000,
  });

  const transactions: Transaction[] = txData?.data?.data ?? [];
  const categories: Category[] = catData?.data?.data ?? [];
  const catById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const results: Result[] = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) {
      // Empty query → show a few recent transactions + all categories
      const recentTx: Result[] = transactions.slice(0, 5).map((t) => {
        const cat = catById.get(t.categoryId);
        return {
          kind: 'transaction',
          id: t.id,
          primary: t.description || (cat?.name ?? 'Tranzacție'),
          secondary: `${cat?.name ?? '—'} · ${formatFullDate(t.date)}`,
          href: '/transactions',
          icon: <List size={14} />,
          rightSlot: (
            <span
              className="num"
              style={{
                fontWeight: 600,
                fontSize: 12.5,
                color: t.type === 'income' ? 'var(--income)' : 'var(--text-1)',
              }}
            >
              {t.type === 'income' ? '+' : '−'} {fmt(Number(t.amount))}
            </span>
          ),
        };
      });
      return recentTx;
    }
    const out: Result[] = [];
    for (const c of categories) {
      if (normalize(c.name).includes(q)) {
        out.push({
          kind: 'category',
          id: c.id,
          primary: `${c.icon || '📁'} ${c.name}`,
          secondary: c.type === 'income' ? 'Categorie venit' : 'Categorie cheltuială',
          href: '/categories',
          icon: <Tag size={14} />,
        });
      }
    }
    for (const t of transactions) {
      const cat = catById.get(t.categoryId);
      const haystack = `${t.description ?? ''} ${cat?.name ?? ''} ${t.amount}`;
      if (normalize(haystack).includes(q)) {
        out.push({
          kind: 'transaction',
          id: t.id,
          primary: t.description || cat?.name || 'Tranzacție',
          secondary: `${cat?.name ?? '—'} · ${formatFullDate(t.date)}`,
          href: '/transactions',
          icon: <List size={14} />,
          rightSlot: (
            <span
              className="num"
              style={{
                fontWeight: 600,
                fontSize: 12.5,
                color: t.type === 'income' ? 'var(--income)' : 'var(--text-1)',
              }}
            >
              {t.type === 'income' ? '+' : '−'} {fmt(Number(t.amount))}
            </span>
          ),
        });
      }
      if (out.length >= 30) break;
    }
    return out.slice(0, 30);
  }, [query, transactions, categories, catById]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, results.length]);

  // Keep the keyboard-highlighted row visible when arrowing past the fold.
  useEffect(() => {
    rowRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const onResultPick = (r: Result) => {
    navigate(r.href);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const pick = results[activeIndex];
      if (pick) onResultPick(pick);
    }
  };

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,15,16,0.4)',
        backdropFilter: 'blur(2px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(640px, 92vw)',
          background: 'var(--bg-surface)',
          borderRadius: 14,
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 18px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <Search size={16} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Caută tranzacții, categorii…"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 14,
              fontFamily: 'inherit',
              color: 'var(--text-1)',
            }}
          />
          <kbd
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10.5,
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: '1px 6px',
              color: 'var(--text-3)',
            }}
          >
            ESC
          </kbd>
        </div>

        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {results.length === 0 ? (
            <div
              style={{
                padding: 32,
                textAlign: 'center',
                color: 'var(--text-3)',
                fontSize: 13,
              }}
            >
              {query
                ? `Niciun rezultat pentru „${query}"`
                : 'Tastează ca să cauți tranzacții și categorii…'}
            </div>
          ) : (
            results.map((r, i) => (
              <button
                key={`${r.kind}-${r.id}`}
                ref={(el) => { rowRefs.current[i] = el; }}
                type="button"
                onClick={() => onResultPick(r)}
                onMouseEnter={() => setActiveIndex(i)}
                style={{
                  width: '100%',
                  display: 'grid',
                  gridTemplateColumns: '28px 1fr auto',
                  gap: 12,
                  alignItems: 'center',
                  padding: '11px 18px',
                  border: 'none',
                  background: i === activeIndex ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  borderLeft:
                    i === activeIndex
                      ? '2px solid var(--accent)'
                      : '2px solid transparent',
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: 'var(--bg-inset)',
                    color: 'var(--text-2)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  {r.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 500,
                      color: 'var(--text-1)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {r.primary}
                  </div>
                  {r.secondary && (
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                      {r.secondary}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {r.rightSlot}
                  <ArrowRight size={12} style={{ color: 'var(--text-3)' }} />
                </div>
              </button>
            ))
          )}
        </div>

        <div
          style={{
            padding: '8px 18px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: 14,
            fontSize: 10.5,
            color: 'var(--text-3)',
            background: 'var(--bg-subtle)',
          }}
        >
          <span>↑↓ navighează</span>
          <span>↵ deschide</span>
          <span>esc închide</span>
        </div>
      </div>
    </div>
  );
}
