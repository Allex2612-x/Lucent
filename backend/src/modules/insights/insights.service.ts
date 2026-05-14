import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../../shared/prisma.js';

export interface WeeklyInsight {
  generatedAt: string;
  weekStart: string;
  weekEnd: string;
  content: string;
  cached: boolean;
}

export interface QuickTip {
  generatedAt: string;
  content: string;
  cached: boolean;
}

interface CacheEntry {
  generatedAt: number;
  insight: WeeklyInsight;
}

interface TipCacheEntry {
  generatedAt: number;
  tip: QuickTip;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const cache = new Map<string, CacheEntry>();
const tipCache = new Map<string, TipCacheEntry>();

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
  console.log('[insights] generating for user', userId, '— key set:', !!process.env.GEMINI_API_KEY);
  try {
    const c = getClient();
    const model = c.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
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
    console.log('[insights] OK, generated', content.length, 'chars');
  } catch (err: any) {
    console.error('[insights] generation failed:', err?.message || err);
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

/**
 * Generates a single-sentence financial tip ("Ar trebui să…", "Încearcă să…")
 * tailored to the user's last 30 days of spending. Cached 24h per user so the
 * sidebar widget on every page doesn't burn quota.
 */
export async function getQuickTip(userId: string, forceRefresh = false): Promise<QuickTip> {
  const cached = tipCache.get(userId);
  if (!forceRefresh && cached && Date.now() - cached.generatedAt < CACHE_TTL_MS) {
    return { ...cached.tip, cached: true };
  }

  const now = new Date();
  const monthAgo = new Date(now);
  monthAgo.setDate(now.getDate() - 30);

  const last30 = await prisma.transaction.findMany({
    where: { userId, date: { gte: monthAgo } },
    include: { category: true },
    take: 300,
  });

  const expenses = last30.filter((t) => t.type === 'expense');
  const incomes = last30.filter((t) => t.type === 'income');
  const totalExpense = expenses.reduce((s, t) => s + Number(t.amount), 0);
  const totalIncome = incomes.reduce((s, t) => s + Number(t.amount), 0);

  const byCategory = new Map<string, number>();
  for (const t of expenses) {
    const n = t.category?.name ?? 'Necunoscut';
    byCategory.set(n, (byCategory.get(n) ?? 0) + Number(t.amount));
  }
  const topCategories = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, total]) => `${name} ${fmtNumber(total)} RON`)
    .join(', ');

  const stats = `Context utilizator (ultimele 30 zile):
- Venituri: ${fmtNumber(totalIncome)} RON
- Cheltuieli: ${fmtNumber(totalExpense)} RON
- Top categorii cheltuieli: ${topCategories || '(fără date)'}
- Număr tranzacții: ${last30.length}`;

  const systemPrompt = `Generezi un sfat financiar foarte scurt pentru un utilizator român al aplicației FARO.

Reguli stricte:
- O singură propoziție, maxim 18 cuvinte.
- Începe cu „Ar trebui să…", „Încearcă să…", „Pune deoparte…", „Atenție la…" sau formulare similară.
- Bazează-l pe contextul utilizatorului (top categorie, raport venituri/cheltuieli).
- Fără emoji, fără markdown, fără cifre brute lungi (rotunjește la sută/mie).
- Ton calm, prietenos, fără morală.
- Dacă datele sunt insuficiente: „Adaugă mai multe tranzacții ca să-ți pot oferi sfaturi personalizate."`;

  let content: string;
  console.log('[insights/tip] generating for user', userId);
  try {
    const c = getClient();
    const model = c.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: systemPrompt,
      generationConfig: { maxOutputTokens: 80, temperature: 0.9 },
    });
    const result = await model.generateContent(stats);
    const text = result.response.text().trim();
    if (!text) throw new Error('Răspuns gol de la Gemini.');
    content = text.replace(/^["'„]|["'"]$/g, '').trim();
    console.log('[insights/tip] OK', content);
  } catch (err: any) {
    console.error('[insights/tip] failed:', err?.message || err);
    content = 'Verifică-ți bugetele săptămânal — un control scurt previne surprizele de la final de lună.';
  }

  const tip: QuickTip = {
    generatedAt: new Date().toISOString(),
    content,
    cached: false,
  };
  tipCache.set(userId, { generatedAt: Date.now(), tip });
  return tip;
}

export interface AskAnswer {
  answer: string;
  generatedAt: string;
}

/**
 * Free-form Q&A with the user's data as context. No cache — every question
 * is a fresh call, so callers should debounce or rate-limit if they care.
 */
export async function askQuestion(userId: string, question: string): Promise<AskAnswer> {
  if (!question || question.trim().length < 3) {
    throw new Error('Întrebarea trebuie să aibă cel puțin 3 caractere.');
  }

  const now = new Date();
  const monthAgo = new Date(now);
  monthAgo.setDate(now.getDate() - 60);

  // Last 60 days of transactions = enough context for most questions about
  // recent spending without blowing past Gemini's input window.
  const recent = await prisma.transaction.findMany({
    where: { userId, date: { gte: monthAgo } },
    include: { category: true },
    orderBy: { date: 'desc' },
    take: 500,
  });

  const summary = (() => {
    const byMonth = new Map<string, { income: number; expense: number }>();
    const byCategory = new Map<string, number>();
    for (const t of recent) {
      const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      const bucket = byMonth.get(key) ?? { income: 0, expense: 0 };
      if (t.type === 'income') bucket.income += Number(t.amount);
      else bucket.expense += Number(t.amount);
      byMonth.set(key, bucket);
      if (t.type === 'expense') {
        const n = t.category?.name ?? 'Necunoscut';
        byCategory.set(n, (byCategory.get(n) ?? 0) + Number(t.amount));
      }
    }
    const monthLines = [...byMonth.entries()]
      .sort()
      .map(([k, v]) => `  ${k}: venituri ${fmtNumber(v.income)} RON, cheltuieli ${fmtNumber(v.expense)} RON`)
      .join('\n');
    const catLines = [...byCategory.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([n, v]) => `  ${n}: ${fmtNumber(v)} RON`)
      .join('\n');
    return `Date utilizator (ultimele 60 zile):

Pe lună:
${monthLines || '  (fără date)'}

Top categorii cheltuieli:
${catLines || '  (fără date)'}

Tranzacții totale în perioadă: ${recent.length}`;
  })();

  const systemPrompt = `Ești asistentul financiar FARO. Răspunzi întrebări concrete ale utilizatorului despre banii lui, folosind datele furnizate în context.

Reguli:
- Răspunde în română, scurt și direct (1–3 propoziții, max ~60 cuvinte).
- Folosește cifrele exacte din context atunci când le ai.
- Dacă întrebarea cere date pe care nu le ai, spune onest că nu le ai disponibile și sugerează ce-ar putea adăuga utilizatorul.
- Fără emoji, fără markdown, fără salutări inutile.
- Nu inventa cifre care nu sunt în context.`;

  console.log('[insights/ask] question:', question.slice(0, 80));
  try {
    const c = getClient();
    const model = c.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: systemPrompt,
      generationConfig: { maxOutputTokens: 250, temperature: 0.5 },
    });
    const result = await model.generateContent(`${summary}\n\nÎntrebarea utilizatorului: ${question.trim()}`);
    const text = result.response.text().trim();
    if (!text) throw new Error('Răspuns gol de la Gemini.');
    return { answer: text, generatedAt: new Date().toISOString() };
  } catch (err: any) {
    console.error('[insights/ask] failed:', err?.message || err);
    throw err;
  }
}

export interface Recommendation {
  id: string;
  icon: string;
  title: string;
  body: string;
  tag: 'Acțiune' | 'Buget' | 'Raport' | 'Reminder';
}

/**
 * Deterministic recommendations derived from the user's data. No AI call so
 * this is free and instant; the rules cover the same cases the design mockup
 * shows (large recent transaction, missing budget alert, suggest comparison).
 */
export async function getRecommendations(userId: string): Promise<Recommendation[]> {
  const now = new Date();
  const monthAgo = new Date(now);
  monthAgo.setDate(now.getDate() - 30);

  const [recent, budgets] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, type: 'expense', date: { gte: monthAgo } },
      include: { category: true },
      orderBy: { date: 'desc' },
    }),
    prisma.budget.findMany({
      where: { userId, month: now.getMonth() + 1, year: now.getFullYear() },
      include: { categories: true },
    }),
  ]);

  const recs: Recommendation[] = [];

  // Rule 1: a single recent transaction that is much bigger than this user's
  // category mean — suggest reviewing it.
  if (recent.length >= 5) {
    const byCategory = new Map<string, number[]>();
    for (const t of recent) {
      const arr = byCategory.get(t.categoryId) ?? [];
      arr.push(Number(t.amount));
      byCategory.set(t.categoryId, arr);
    }
    let biggestOutlier: { tx: typeof recent[number]; mean: number; ratio: number } | null = null;
    for (const t of recent) {
      const arr = byCategory.get(t.categoryId) ?? [];
      if (arr.length < 3) continue;
      const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
      if (mean <= 0) continue;
      const ratio = Number(t.amount) / mean;
      if (ratio < 2) continue;
      if (!biggestOutlier || ratio > biggestOutlier.ratio) {
        biggestOutlier = { tx: t, mean, ratio };
      }
    }
    if (biggestOutlier) {
      recs.push({
        id: 'large-tx',
        icon: '🔍',
        title: 'Verifică tranzacțiile mari',
        body: `Vezi tranzacția de ${fmtNumber(Number(biggestOutlier.tx.amount))} RON la „${
          biggestOutlier.tx.category?.name ?? 'Necunoscut'
        }" — e de ${biggestOutlier.ratio.toFixed(1)}× peste media categoriei.`,
        tag: 'Acțiune',
      });
    }
  }

  // Rule 2: a top-spending category without a budget — suggest creating one.
  const byCat = new Map<string, { name: string; total: number; categoryId: string }>();
  for (const t of recent) {
    const k = t.categoryId;
    const prev = byCat.get(k);
    if (prev) {
      prev.total += Number(t.amount);
    } else {
      byCat.set(k, {
        name: t.category?.name ?? 'Necunoscut',
        total: Number(t.amount),
        categoryId: t.categoryId,
      });
    }
  }
  const budgetCategoryIds = new Set<string>();
  for (const b of budgets) {
    for (const bc of b.categories ?? []) budgetCategoryIds.add(bc.categoryId);
  }
  const unbudgetedTop = [...byCat.values()]
    .filter((c) => !budgetCategoryIds.has(c.categoryId))
    .sort((a, b) => b.total - a.total)[0];
  if (unbudgetedTop) {
    recs.push({
      id: 'set-budget',
      icon: '💡',
      title: 'Setează o limită pe categorie',
      body: `Ai cheltuit ${fmtNumber(unbudgetedTop.total)} RON pe „${unbudgetedTop.name}" în 30 zile fără limită. Adaugă un buget ca să primești alerte.`,
      tag: 'Buget',
    });
  }

  // Rule 3: always suggest comparing months if there's enough history.
  recs.push({
    id: 'compare',
    icon: '📊',
    title: 'Compară cu lunile trecute',
    body: 'Deschide raportul lunar ca să vezi cum a evoluat fiecare categorie în ultimele luni.',
    tag: 'Raport',
  });

  return recs.slice(0, 3);
}
