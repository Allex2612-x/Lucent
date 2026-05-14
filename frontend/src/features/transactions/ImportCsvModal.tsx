import { useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, ArrowRight, AlertCircle, Check } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { toast } from 'sonner';
import { transactionsService } from '../../services/transactions.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type FieldKey = 'date' | 'description' | 'amount' | 'type' | 'categoryName' | 'ignore';

const FIELD_LABELS: Record<FieldKey, string> = {
  date: 'Data',
  description: 'Descriere',
  amount: 'Sumă',
  type: 'Tip (venit/cheltuială)',
  categoryName: 'Categorie',
  ignore: '— Ignoră coloana —',
};

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
}

type Step = 'upload' | 'mapping' | 'review' | 'result';

interface ParsedRow {
  raw: Record<string, string>;
  amount: number;
  type: 'income' | 'expense' | null;
  description: string;
  date: string | null;
  categoryId: string | null;
  categoryRawName: string;
  error: string | null;
}

function parseRomanianDate(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  // ISO yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  // dd.mm.yyyy or dd/mm/yyyy or dd-mm-yyyy
  const m = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
  if (m) {
    const day = m[1]!.padStart(2, '0');
    const month = m[2]!.padStart(2, '0');
    let year = m[3]!;
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }
  // Fallback: let Date constructor try
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${da}`;
  }
  return null;
}

function parseAmount(raw: string): { value: number; signedType: 'income' | 'expense' | null } {
  if (!raw) return { value: NaN, signedType: null };
  const normalized = raw
    .replace(/\s/g, '')
    .replace(/[^\d.,+-]/g, '')
    .replace(/\.(?=\d{3}(?:[^\d]|$))/g, '') // remove thousands separators (1.234,56)
    .replace(',', '.');
  const value = parseFloat(normalized);
  if (isNaN(value)) return { value: NaN, signedType: null };
  if (value < 0) return { value: Math.abs(value), signedType: 'expense' };
  if (value > 0) return { value, signedType: 'income' };
  return { value: 0, signedType: null };
}

function detectType(raw: string): 'income' | 'expense' | null {
  if (!raw) return null;
  const t = raw.trim().toLowerCase();
  if (['income', 'venit', 'credit', 'incasare', 'încasare'].includes(t)) return 'income';
  if (['expense', 'cheltuiala', 'cheltuială', 'debit', 'plata', 'plată'].includes(t)) return 'expense';
  return null;
}

export function ImportCsvModal({ isOpen, onClose, categories }: ImportCsvModalProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, FieldKey>>({});
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>('');
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [result, setResult] = useState<{
    total: number;
    succeededCount: number;
    failedCount: number;
    failed: Array<{ index: number; reason: string }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('upload');
    setFileName('');
    setHeaders([]);
    setRows([]);
    setMapping({});
    setDefaultCategoryId('');
    setParsed([]);
    setResult(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const importMutation = useMutation({
    mutationFn: (payload: Parameters<typeof transactionsService.bulkImport>[0]) =>
      transactionsService.bulkImport(payload),
    onSuccess: (res) => {
      const data = res.data?.data;
      if (!data) return;
      setResult({
        total: data.total,
        succeededCount: data.succeededCount,
        failedCount: data.failedCount,
        failed: data.failed,
      });
      setStep('result');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      if (data.succeededCount > 0) {
        toast.success(`${data.succeededCount} tranzacții importate.`);
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Eroare la import.');
    },
  });

  const handleFile = (file: File) => {
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const hdrs = (results.meta.fields ?? []).filter(Boolean);
        if (hdrs.length === 0) {
          toast.error('Nu am găsit niciun header în fișier.');
          return;
        }
        setHeaders(hdrs);
        setRows(results.data.slice(0, 1000));
        // auto-guess mapping
        const guess: Record<string, FieldKey> = {};
        for (const h of hdrs) {
          const norm = h.toLowerCase();
          if (/data|date/.test(norm)) guess[h] = 'date';
          else if (/sum|amount|valoare|suma/.test(norm)) guess[h] = 'amount';
          else if (/descr|detali|denumire|narrative|memo/.test(norm)) guess[h] = 'description';
          else if (/categ|category/.test(norm)) guess[h] = 'categoryName';
          else if (/tip|type|debit|credit/.test(norm)) guess[h] = 'type';
          else guess[h] = 'ignore';
        }
        setMapping(guess);
        setStep('mapping');
      },
      error: () => toast.error('Nu am putut citi fișierul CSV.'),
    });
  };

  const buildParsedRows = (): ParsedRow[] => {
    const fieldToHeader: Partial<Record<FieldKey, string>> = {};
    for (const [header, field] of Object.entries(mapping)) {
      if (field !== 'ignore') fieldToHeader[field] = header;
    }
    return rows.map((raw): ParsedRow => {
      const dateRaw = fieldToHeader.date ? raw[fieldToHeader.date] : '';
      const amountRaw = fieldToHeader.amount ? raw[fieldToHeader.amount] : '';
      const description = fieldToHeader.description ? raw[fieldToHeader.description] ?? '' : '';
      const typeRaw = fieldToHeader.type ? raw[fieldToHeader.type] : '';
      const categoryRawName = fieldToHeader.categoryName
        ? raw[fieldToHeader.categoryName] ?? ''
        : '';

      const date = parseRomanianDate(dateRaw ?? '');
      const { value: amount, signedType } = parseAmount(amountRaw ?? '');
      const explicitType = detectType(typeRaw ?? '');
      const type = explicitType ?? signedType;

      // resolve category by name
      let categoryId: string | null = null;
      if (categoryRawName && type) {
        const norm = categoryRawName.trim().toLowerCase();
        const found = categories.find(
          (c) => c.name.trim().toLowerCase() === norm && c.type === type,
        );
        if (found) categoryId = found.id;
      }
      if (!categoryId && defaultCategoryId && type) {
        const def = categories.find((c) => c.id === defaultCategoryId);
        if (def && def.type === type) categoryId = defaultCategoryId;
      }

      let error: string | null = null;
      if (!date) error = 'Dată invalidă';
      else if (!amount || amount <= 0 || isNaN(amount)) error = 'Sumă invalidă';
      else if (!type) error = 'Tip nedetectat (venit/cheltuială)';
      else if (!categoryId) error = 'Categorie nepotrivită';

      return {
        raw,
        amount,
        type,
        description,
        date,
        categoryId,
        categoryRawName,
        error,
      };
    });
  };

  const goReview = () => {
    setParsed(buildParsedRows());
    setStep('review');
  };

  const submit = () => {
    const valid = parsed.filter((r) => !r.error && r.date && r.type && r.categoryId);
    if (valid.length === 0) {
      toast.error('Niciun rând valid de importat.');
      return;
    }
    importMutation.mutate(
      valid.map((r) => ({
        amount: r.amount,
        type: r.type!,
        description: r.description?.trim() || undefined,
        date: r.date!,
        categoryId: r.categoryId!,
      })),
    );
  };

  const requiredFieldsCovered = useMemo(() => {
    const fields = new Set(Object.values(mapping));
    return fields.has('date') && fields.has('amount');
  }, [mapping]);

  const previewStats = useMemo(() => {
    const ok = parsed.filter((r) => !r.error).length;
    return { ok, fail: parsed.length - ok };
  }, [parsed]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import tranzacții din CSV">
      {step === 'upload' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>
            Încarcă un fișier CSV exportat din banca ta (ING, BCR, BT, Revolut etc.). În pasul
            următor mapezi coloanele.
          </p>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
            style={{
              border: '2px dashed var(--border-strong)',
              borderRadius: 14,
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              background: 'var(--bg-subtle)',
              color: 'var(--text-2)',
              transition: 'border-color .15s, color .15s',
            }}
          >
            <Upload size={28} />
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              Click pentru a alege fișierul sau trage-l aici
            </div>
            <div style={{ fontSize: 11.5 }}>CSV separat prin virgulă, primul rând cu antetele.</div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
        </div>
      )}

      {step === 'mapping' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={16} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>{fileName}</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>· {rows.length} rânduri detectate</span>
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-3)' }}>
            Mapează fiecare coloană din CSV la câmpul corespunzător din Sasha. Data și suma sunt
            obligatorii — celelalte pot rămâne pe „Ignoră".
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {headers.map((h) => (
              <div
                key={h}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr',
                  gap: 12,
                  alignItems: 'center',
                  padding: 10,
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  background: '#fff',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 500 }}>{h}</div>
                <ArrowRight size={14} style={{ color: 'var(--text-3)' }} />
                <select
                  value={mapping[h] ?? 'ignore'}
                  onChange={(e) =>
                    setMapping((prev) => ({ ...prev, [h]: e.target.value as FieldKey }))
                  }
                  style={{
                    padding: '6px 8px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: 'var(--bg-subtle)',
                    fontSize: 12.5,
                    fontFamily: 'inherit',
                  }}
                >
                  {(Object.keys(FIELD_LABELS) as FieldKey[]).map((k) => (
                    <option key={k} value={k}>
                      {FIELD_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <Select
            label="Categorie default (pentru rânduri fără potrivire)"
            value={defaultCategoryId}
            onChange={(e) => setDefaultCategoryId(e.target.value)}
            options={[
              { value: '', label: '— Niciuna (rândul va fi marcat eroare) —' },
              ...categories.map((c) => ({
                value: c.id,
                label: `${c.name} (${c.type === 'income' ? 'venit' : 'cheltuială'})`,
              })),
            ]}
          />

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={reset}>
              Înapoi
            </Button>
            <Button variant="primary" onClick={goReview} disabled={!requiredFieldsCovered}>
              Previzualizează →
            </Button>
          </div>
          {!requiredFieldsCovered && (
            <div style={{ fontSize: 11.5, color: 'var(--warn)' }}>
              Trebuie să mapezi cel puțin Data și Suma.
            </div>
          )}
        </div>
      )}

      {step === 'review' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, fontSize: 12.5 }}>
            <span className="chip" style={{ background: 'var(--income-soft)', color: 'var(--income)', border: 'none' }}>
              <Check size={11} /> {previewStats.ok} valide
            </span>
            {previewStats.fail > 0 && (
              <span className="chip" style={{ background: 'var(--expense-soft)', color: 'var(--expense)', border: 'none' }}>
                <AlertCircle size={11} /> {previewStats.fail} cu erori (sărite)
              </span>
            )}
          </div>
          <div
            style={{
              maxHeight: 360,
              overflowY: 'auto',
              border: '1px solid var(--border)',
              borderRadius: 10,
            }}
          >
            <table className="tbl" style={{ fontSize: 12 }}>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descriere</th>
                  <th>Categorie</th>
                  <th>Tip</th>
                  <th className="ta-right">Sumă</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {parsed.slice(0, 200).map((r, i) => (
                  <tr key={i} style={{ background: r.error ? 'rgba(245,85,110,0.04)' : undefined }}>
                    <td style={{ whiteSpace: 'nowrap' }}>{r.date ?? '—'}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.description || '—'}
                    </td>
                    <td>
                      {r.categoryId
                        ? categories.find((c) => c.id === r.categoryId)?.name
                        : r.categoryRawName || '—'}
                    </td>
                    <td>{r.type === 'income' ? 'venit' : r.type === 'expense' ? 'cheltuială' : '—'}</td>
                    <td className="ta-right num">{isNaN(r.amount) ? '—' : r.amount.toFixed(2)}</td>
                    <td>
                      {r.error ? (
                        <span style={{ color: 'var(--expense)', fontSize: 11.5 }}>{r.error}</span>
                      ) : (
                        <span style={{ color: 'var(--income)', fontSize: 11.5 }}>✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsed.length > 200 && (
              <div style={{ padding: 10, fontSize: 11.5, color: 'var(--text-3)', textAlign: 'center' }}>
                ...și încă {parsed.length - 200} rânduri (nu sunt afișate, dar vor fi importate)
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setStep('mapping')}>
              ← Editează mapping
            </Button>
            <Button
              variant="primary"
              onClick={submit}
              disabled={importMutation.isPending || previewStats.ok === 0}
            >
              {importMutation.isPending
                ? 'Se importă...'
                : `Importă ${previewStats.ok} tranzacții`}
            </Button>
          </div>
        </div>
      )}

      {step === 'result' && result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              padding: 18,
              borderRadius: 12,
              background:
                result.succeededCount > 0
                  ? 'var(--income-soft)'
                  : 'var(--expense-soft)',
              color:
                result.succeededCount > 0
                  ? 'var(--income)'
                  : 'var(--expense)',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            {result.succeededCount > 0 ? <Check size={28} /> : <AlertCircle size={28} />}
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                {result.succeededCount} din {result.total} tranzacții importate
              </div>
              {result.failedCount > 0 && (
                <div style={{ fontSize: 12, marginTop: 2 }}>
                  {result.failedCount} rânduri au eșuat
                </div>
              )}
            </div>
          </div>
          {result.failed.length > 0 && (
            <div
              style={{
                maxHeight: 200,
                overflowY: 'auto',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: 12,
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Rânduri eșuate:</div>
              {result.failed.slice(0, 50).map((f) => (
                <div key={f.index} style={{ color: 'var(--text-2)' }}>
                  Rândul {f.index + 1}: {f.reason}
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" onClick={handleClose}>
              Închide
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
