import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ScannedReceipt {
  amount: number | null;
  merchant: string | null;
  date: string | null; // ISO yyyy-mm-dd
  raw: string;
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

/**
 * Use Gemini multimodal to extract the total, merchant, and date from a
 * receipt photo. The free-tier `gemini-2.5-flash-lite` model reads
 * Romanian receipts well out of the box, so we don't need a separate
 * Tesseract pass. Returns nulls for fields that can't be confidently
 * read — the caller falls back to manual entry.
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
      // Force JSON output so we don't have to regex-parse free text.
      responseMimeType: 'application/json',
    },
  });

  const prompt = `Ești un asistent OCR pentru bonuri fiscale din România.
Analizează imaginea atașată și extrage:
- "amount": suma totală finală de plată (cea mai mare valoare, etichetată de obicei "TOTAL" sau "TOTAL DE PLATĂ"), ca număr (folosește . ca separator zecimal). Nu include moneda.
- "merchant": numele magazinului/comerciantului (de obicei sus, scris cu majuscule). Returnează doar numele, fără SRL/SA/punct etc dacă e zgomot OCR.
- "date": data tranzacției în format ISO YYYY-MM-DD. Pe bonurile românești apare de obicei ca DD.MM.YYYY sau DD/MM/YYYY.

Răspunde STRICT cu un obiect JSON, fără text suplimentar și fără markdown:
{ "amount": <number|null>, "merchant": <string|null>, "date": "<YYYY-MM-DD>|null" }

Dacă un câmp nu poate fi citit cu încredere rezonabilă, pune null.`;

  const result = await model.generateContent([
    { text: prompt },
    {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    },
  ]);

  const raw = result.response.text().trim();
  // Gemini sometimes wraps JSON in ```json fences even when asked not to.
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let parsed: { amount?: unknown; merchant?: unknown; date?: unknown } = {};
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Bad JSON — fall through to nulls but keep raw for debugging.
  }

  const amountNum =
    typeof parsed.amount === 'number'
      ? parsed.amount
      : typeof parsed.amount === 'string'
        ? Number(parsed.amount.replace(',', '.'))
        : NaN;

  let dateStr: string | null = null;
  if (typeof parsed.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) {
    dateStr = parsed.date;
  }

  return {
    amount: Number.isFinite(amountNum) && amountNum > 0 ? amountNum : null,
    merchant: typeof parsed.merchant === 'string' && parsed.merchant.trim()
      ? parsed.merchant.trim()
      : null,
    date: dateStr,
    raw,
  };
}
