import { api } from '../services/api';

export interface ReceiptOcrResult {
  rawText: string;
  amount: number | null;
  merchant: string | null;
  date: string | null; // ISO yyyy-mm-dd
  /** URL of the persisted receipt image, e.g. /uploads/receipts/<uuid>.jpg */
  receiptUrl: string | null;
}

/**
 * Send a receipt image to the backend, which uses Gemini multimodal to
 * extract:
 *   - the total amount (e.g. "TOTAL DE PLATĂ")
 *   - the merchant (top-of-receipt store name)
 *   - the transaction date in ISO yyyy-mm-dd
 *
 * Replaces the previous Tesseract.js client-side OCR which was unreliable
 * on Romanian receipts (especially photos taken with iPhones / poor
 * lighting). The progress callback is still invoked once at start and
 * once at end so existing UI animations keep working.
 */
export async function runReceiptOcr(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<ReceiptOcrResult> {
  onProgress?.(0.1);
  const dataUrl = await readFileAsDataUrl(file);
  // Strip the "data:image/...;base64," prefix — the backend accepts either
  // form, but sending the raw base64 keeps the JSON payload smaller.
  const commaIndex = dataUrl.indexOf(',');
  const base64 = commaIndex === -1 ? dataUrl : dataUrl.slice(commaIndex + 1);
  onProgress?.(0.3);
  const response = await api.post('/transactions/scan-receipt', {
    image: base64,
    mimeType: file.type || 'image/jpeg',
  });
  onProgress?.(1);
  const data = response.data?.data ?? {};
  return {
    rawText: typeof data.raw === 'string' ? data.raw : '',
    amount: typeof data.amount === 'number' ? data.amount : null,
    merchant: typeof data.merchant === 'string' ? data.merchant : null,
    date: typeof data.date === 'string' ? data.date : null,
    receiptUrl: typeof data.receiptUrl === 'string' ? data.receiptUrl : null,
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Nu am putut citi fișierul.'));
    reader.readAsDataURL(file);
  });
}
