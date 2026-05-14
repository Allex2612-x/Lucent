import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../../shared/prisma.js';

export interface WeeklyInsight {
  generatedAt: string;
  weekStart: string;
  weekEnd: string;
  content: string;
  cached: boolean;
}

interface CacheEntry {
  generatedAt: number;
  insight: WeeklyInsight;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const cache = new Map<string, CacheEntry>();

let client: GoogleGenerativeAI | null = null;
function getClient(): GoogleGenerativeAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY nu este configurat în mediul backend.');
    }
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}

function startOfWeek(d: Date): Date {
  // Monday-based week
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function fmtNumber(n: number) {
  return n.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function buildPrompt(userId: string): Promise<string> {
  const now = new Date();
  const thisWeekStart = startOfWeek(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);

  // current week + previous week, grouped by category and type
  const recent = await prisma.transaction.findMany({
    where: { userId, date: { gte: lastWeekStart, lte: now } },
    include: { category: true },
    orderBy: { date: 'desc' },
  });
  const last30 = await prisma.transaction.findMany({
    where: { userId, date: { gte: monthAgo, lte: now } },
    include: { category: true },
  });

  const inWeek = (d: Date, start: Date) => d >= start;
  const thisWeek = recent.filter((t) => inWeek(t.date, thisWeekStart));
  const lastWeek = recent.filter((t) => !inWeek(t.date, thisWeekStart));

  const sumExpensesThisWeek = thisWeek
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);
  const sumExpensesLastWeek = lastWeek
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);
  const sumIncomeThisWeek = thisWeek
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0);

  const byCategoryThisWeek = new Map<string, number>();
  for (const t of thisWeek.filter((x) => x.type === 'expense')) {
    const name = t.category?.name ?? 'Necunoscut';
    byCategoryThisWeek.set(name, (byCategoryThisWeek.get(name) ?? 0) + Number(t.amount));
  }
  const byCategoryLast30 = new Map<string, number>();
  for (const t of last30.filter((x) => x.type === 'expense')) {
    const name = t.category?.name ?? 'Necunoscut';
    byCategoryLast30.set(name, (byCategoryLast30.get(name) ?? 0) + Number(t.amount));
  }

  const topCategoriesThisWeek = [...byCategoryThisWeek.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, total]) => `  - ${name}: ${fmtNumber(total)} RON`)
    .join('\n');

  const last30Avg = [...byCategoryLast30.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, total]) => `  - ${name}: ${fmtNumber(total / 4)} RON/săpt`)
    .join('\n');

  return `Date pentru analiză (în RON, luna ${now.toLocaleString('ro-RO', { month: 'long', year: 'numeric' })}):

Săptămâna curentă (de la ${thisWeekStart.toLocaleDateString('ro-RO')}):
- Venituri totale: ${fmtNumber(sumIncomeThisWeek)} RON (${thisWeek.filter(t => t.type === 'income').length} tranzacții)
- Cheltuieli totale: ${fmtNumber(sumExpensesThisWeek)} RON (${thisWeek.filter(t => t.type === 'expense').length} tranzacții)

Top categorii săptămâna asta:
${topCategoriesThisWeek || '  (fără cheltuieli)'}

Săptămâna trecută cheltuieli totale: ${fmtNumber(sumExpensesLastWeek)} RON

Medie pe categorie ultimele 4 săptămâni:
${last30Avg || '  (date insuficiente)'}`;
}

export async function getWeeklyInsight(userId: string, forceRefresh = false): Promise<WeeklyInsight> {
  const cached = cache.get(userId);
  if (!forceRefresh && cached && Date.now() - cached.generatedAt < CACHE_TTL_MS) {
    return { ...cached.insight, cached: true };
  }

  const stats = await buildPrompt(userId);
  const thisWeekStart = startOfWeek(new Date());
  const weekEnd = new Date(thisWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const systemPrompt = `Ești asistentul financiar al unei aplicații românești de gestiune a banilor (FARO).
Generezi un insight săptămânal scurt, prietenos și util, în limba română.

Reguli:
- Maxim 3 paragrafe scurte. Total ~80–120 cuvinte.
- Fără emoji. Ton calm, factual, ușor încurajator.
- Începe cu cel mai relevant lucru (cea mai mare schimbare procentuală sau cifră marcantă).
- Compară săptămâna asta cu trecută sau cu media; folosește procente și cifre concrete.
- Termină cu o sugestie practică, dar fără să fii moralist.
- Dacă datele sunt insuficiente, spune onest că nu ai destule date și sugerează ce ar ajuta.
- Nu repeta cifrele brute — interpretează-le.`;

  let content: string;
  try {
    const c = getClient();
    const model = c.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
      generationConfig: {
        maxOutputTokens: 400,
        temperature: 0.7,
      },
    });
    const result = await model.generateContent(stats);
    const text = result.response.text();
    if (!text || !text.trim()) {
      throw new Error('Răspuns gol de la Gemini.');
    }
    content = text.trim();
  } catch (err: any) {
    // Fall back to a simple deterministic insight so the UI still shows something.
    content =
      'Nu am putut genera insight-ul săptămânal automat acum (probabil cheia API nu este configurată). Verifică GEMINI_API_KEY pe backend sau încearcă din nou.';
  }

  const insight: WeeklyInsight = {
    generatedAt: new Date().toISOString(),
    weekStart: thisWeekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    content,
    cached: false,
  };
  cache.set(userId, { generatedAt: Date.now(), insight });
  return insight;
}
