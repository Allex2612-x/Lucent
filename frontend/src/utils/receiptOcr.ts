import { createWorker } from 'tesseract.js';

export interface ReceiptOcrResult {
  rawText: string;
  amount: number | null;
  merchant: string | null;
  date: string | null; // ISO yyyy-mm-dd
}

/**
 * Run Tesseract on a receipt image and heuristically extract:
 *   - the total amount (largest "X,YY" or "X.YY" sum, often labelled "TOTAL")
 *   - the merchant (first all-caps line above 4 chars)
 *   - the transaction date (dd.mm.yyyy / dd/mm/yyyy / yyyy-mm-dd)
 *
 * Loads Romanian + English language packs. Returns the raw OCR text so the
 * caller can show it to the user for debugging if needed.
 */
export async function runReceiptOcr(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<ReceiptOcrResult> {
  const worker = await createWorker('ron+eng', undefined, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress);
      }
    },
  });
  try {
    const { data } = await worker.recognize(file);
    return parseReceiptText(data.text);
  } finally {
    await worker.terminate();
  }
}

export function parseReceiptText(text: string): ReceiptOcrResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  return {
    rawText: text,
    amount: extractAmount(lines),
    merchant: extractMerchant(lines),
    date: extractDate(lines),
  };
}

function extractAmount(lines: string[]): number | null {
  // Prefer lines explicitly tagged with TOTAL/TOTAL DE PLATA/SUMA/PLATA/PAID.
  const totalLineRegexes = [
    /\btotal[\s:]+([\d.,\s]+)/i,
    /total\s+de\s+plat[aă][\s:]+([\d.,\s]+)/i,
    /\bplata[\s:]+([\d.,\s]+)/i,
    /\bsuma[\s:]+([\d.,\s]+)/i,
    /\bde\s+plata[\s:]+([\d.,\s]+)/i,
    /\bpaid[\s:]+([\d.,\s]+)/i,
  ];
  for (const line of lines) {
    for (const rgx of totalLineRegexes) {
      const m = line.match(rgx);
      if (m) {
        const value = parseNumeric(m[1] ?? '');
        if (value && value > 0) return value;
      }
    }
  }

  // Fallback: the largest plausible decimal value found anywhere.
  const candidates: number[] = [];
  const numRegex = /(\d{1,5}[.,]\d{2})(?!\d)/g;
  for (const line of lines) {
    let m: RegExpExecArray | null;
    while ((m = numRegex.exec(line)) !== null) {
      const v = parseNumeric(m[1]!);
      if (v && v > 0 && v < 100000) candidates.push(v);
    }
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b - a);
  return candidates[0]!;
}

function parseNumeric(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw
    .replace(/[\s]/g, '')
    .replace(/\.(?=\d{3}(?:[^\d]|$))/g, '') // strip thousands dot
    .replace(',', '.')
    .replace(/[^\d.]/g, '');
  const v = parseFloat(cleaned);
  return isNaN(v) ? null : v;
}

function extractMerchant(lines: string[]): string | null {
  // Pick the first non-trivial line near the top that looks like a name.
  const skip = /^(bon\s+fiscal|nr|seria|nif|cif|cui|adresa|tel\.?|telefon|cas?a|operator|client|chitan|fact)/i;
  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const line = lines[i]!;
    if (line.length < 3 || line.length > 60) continue;
    if (skip.test(line)) continue;
    if (/^\d+$/.test(line)) continue;
    // prefer all-caps lines (typical for store names)
    if (/^[A-ZĂÎÂȘȚ0-9\s.&'-]{3,}$/.test(line)) return line.replace(/\s+/g, ' ').trim();
  }
  // fallback: first non-skip line
  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const line = lines[i]!;
    if (line.length < 3 || skip.test(line)) continue;
    return line.replace(/\s+/g, ' ').trim();
  }
  return null;
}

function extractDate(lines: string[]): string | null {
  const patterns = [
    /\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b/, // dd.mm.yyyy
    /\b(\d{4})[./-](\d{1,2})[./-](\d{1,2})\b/, // yyyy.mm.dd
  ];
  for (const line of lines) {
    for (const rgx of patterns) {
      const m = line.match(rgx);
      if (!m) continue;
      let y: number, mo: number, d: number;
      if (m[1]!.length === 4) {
        y = parseInt(m[1]!, 10);
        mo = parseInt(m[2]!, 10);
        d = parseInt(m[3]!, 10);
      } else {
        d = parseInt(m[1]!, 10);
        mo = parseInt(m[2]!, 10);
        y = parseInt(m[3]!, 10);
        if (y < 100) y += 2000;
      }
      if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 2000 || y > 2100) continue;
      return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  return null;
}
