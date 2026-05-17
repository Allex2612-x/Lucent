import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Structured digital receipt — the data we keep in the DB instead of the
 * raw photo. Roughly mirrors a Lidl Plus digital receipt: store header,
 * itemized lines, totals, payment method.
 */
export interface ReceiptData {
  merchant: string | null;
  address: string | null;
  date: string | null; // ISO yyyy-mm-dd
  time: string | null; // HH:MM, 24h
  items: Array<{
    name: string;
    qty: number;
    unitPrice: number | null;
    total: number;
  }>;
  subtotal: number | null;
  vat: number | null;
  total: number | null;
  paymentMethod: string | null; // "card" | "numerar" | other
  currency: string; // typically "RON"
}

export interface ScannedReceipt {
  amount: number | null;
  merchant: string | null;
  date: string | null;
  raw: string;
  /** Full structured digital receipt (line items, totals, etc.). */
  receiptData: ReceiptData | null;
}

let client: GoogleGenerativeAI | null = null;
function getClient(): GoogleGenerativeAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY nu este configurat în backend.');
    }
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}

const PROMPT = `Ești un asistent OCR care transformă bonuri fiscale românești în date structurate (ca un bon digital Lidl Plus).

Analizează imaginea și extrage TOATĂ informația din bon, nu doar totalul:

1. Antet: numele magazinului ("merchant"), adresa ("address" — opțional).
2. Data și ora tranzacției: "date" în format YYYY-MM-DD, "time" în format HH:MM 24h.
3. Fiecare produs din lista bonului ca element în "items":
   - "name": denumirea produsului așa cum apare pe bon (poate fi prescurtată, ex: "PAINE TOAST"). Nu inventa nume, copiază exact ce vezi.
   - "qty": cantitatea (1 dacă nu e specificat). Dacă apare ex. "2x 5.99" cantitatea este 2.
   - "unitPrice": prețul unitar dacă apare explicit pe bon (poate fi null).
   - "total": prețul total al liniei (cantitate × unit), număr cu separator . pentru zecimale.
4. Totaluri: "subtotal" (dacă apare), "vat" (TVA, dacă apare), "total" (suma finală de plată, etichetată "TOTAL" / "TOTAL DE PLATĂ").
5. "paymentMethod": "card" / "numerar" / "altul" — dacă apare pe bon.
6. "currency": "RON" (sau "EUR"/"USD" dacă e clar alt cod).

Răspunde STRICT cu JSON valid, fără text suplimentar, fără markdown fences:
{
  "merchant": <string|null>,
  "address": <string|null>,
  "date": "<YYYY-MM-DD>|null",
  "time": "<HH:MM>|null",
  "items": [{"name": <string>, "qty": <number>, "unitPrice": <number|null>, "total": <number>}, ...],
  "subtotal": <number|null>,
  "vat": <number|null>,
  "total": <number|null>,
  "paymentMethod": <string|null>,
  "currency": "RON"
}

Reguli:
- Dacă un câmp nu poate fi citit cu încredere rezonabilă, pune null.
- "items" trebuie să fie întotdeauna un array (poate fi gol [] dacă nu vezi niciun produs).
- Nu adăuga câmpuri în plus.
- Folosește . ca separator zecimal în toate sumele.`;

/**
 * Use Gemini multimodal to OCR a Romanian receipt into a structured
 * digital receipt. The returned data is small enough to store directly
 * in the transactions table (Json column) — no image hosting needed.
 *
 * @param imageBase64 The image bytes encoded as base64 (no data: prefix)
 * @param mimeType    e.g. "image/jpeg", "image/png", "image/webp"
 */
export async function scanReceiptWithGemini(
  imageBase64: string,
  mimeType: string,
): Promise<ScannedReceipt> {
  const c = getClient();
  const model = c.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  const result = await model.generateContent([
    { text: PROMPT },
    {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    },
  ]);

  const raw = result.response.text().trim();
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Bad JSON — return blanks but keep raw for debugging.
    return {
      amount: null,
      merchant: null,
      date: null,
      raw,
      receiptData: null,
    };
  }

  const data = normalizeReceiptData(parsed);

  return {
    amount: data.total,
    merchant: data.merchant,
    date: data.date,
    raw,
    receiptData: data,
  };
}

/**
 * Coerce Gemini's free-form JSON into our typed ReceiptData shape. Any
 * field that doesn't pass validation becomes null / empty so the UI can
 * trust the structure.
 */
function normalizeReceiptData(parsed: Record<string, unknown>): ReceiptData {
  const merchant = trimStr(parsed.merchant);
  const address = trimStr(parsed.address);
  const date = isoDateStr(parsed.date);
  const time = isoTimeStr(parsed.time);
  const subtotal = toPositiveNumber(parsed.subtotal);
  const vat = toPositiveNumber(parsed.vat);
  const total = toPositiveNumber(parsed.total);
  const paymentMethod = trimStr(parsed.paymentMethod)?.toLowerCase() ?? null;
  const currency = typeof parsed.currency === 'string' && parsed.currency.trim()
    ? parsed.currency.trim().toUpperCase()
    : 'RON';

  const items: ReceiptData['items'] = [];
  if (Array.isArray(parsed.items)) {
    for (const it of parsed.items) {
      if (!it || typeof it !== 'object') continue;
      const o = it as Record<string, unknown>;
      const name = trimStr(o.name);
      const total = toPositiveNumber(o.total);
      if (!name || total === null) continue; // skip lines we can't anchor
      const qtyNum = toPositiveNumber(o.qty);
      items.push({
        name,
        qty: qtyNum && qtyNum > 0 ? qtyNum : 1,
        unitPrice: toPositiveNumber(o.unitPrice),
        total,
      });
    }
  }

  return {
    merchant,
    address,
    date,
    time,
    items,
    subtotal,
    vat,
    total,
    paymentMethod,
    currency,
  };
}

function trimStr(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function isoDateStr(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

function isoTimeStr(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  return /^\d{2}:\d{2}$/.test(v) ? v : null;
}

function toPositiveNumber(v: unknown): number | null {
  let n: number;
  if (typeof v === 'number') n = v;
  else if (typeof v === 'string') n = Number(v.replace(',', '.'));
  else return null;
  return Number.isFinite(n) && n >= 0 ? n : null;
}
