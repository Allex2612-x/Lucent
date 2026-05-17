import { api } from '../services/api';

export interface ReceiptLineItem {
  name: string;
  qty: number;
  unitPrice: number | null;
  total: number;
}

export interface ReceiptData {
  merchant: string | null;
  address: string | null;
  date: string | null;
  time: string | null;
  items: ReceiptLineItem[];
  subtotal: number | null;
  vat: number | null;
  total: number | null;
  paymentMethod: string | null;
  currency: string;
}

export interface ReceiptOcrResult {
  rawText: string;
  amount: number | null;
  merchant: string | null;
  date: string | null;
  /** Full structured digital receipt (Lidl-Plus-style line items). */
  receiptData: ReceiptData | null;
}

/**
 * Send a receipt image to the backend, which uses Gemini multimodal to
 * extract a structured digital receipt (merchant, date, time, line items,
 * subtotal, VAT, total, payment method).
 */
export async function runReceiptOcr(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<ReceiptOcrResult> {
  onProgress?.(0.1);
  const dataUrl = await readFileAsDataUrl(file);
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
    receiptData: (data.receiptData as ReceiptData | null | undefined) ?? null,
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
