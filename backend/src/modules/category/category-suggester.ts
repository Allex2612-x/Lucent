/**
 * Heuristic category suggester.
 *
 * Maps Romanian-market merchant names and keywords to default category names.
 * Returns the user's own category if a match exists (so personalised renames
 * still work), otherwise the default one.
 */

type CategoryType = 'income' | 'expense';

interface CategoryRecord {
  id: string;
  name: string;
  type: CategoryType;
  isDefault: boolean | null;
}

interface KeywordRule {
  keywords: string[];
  categoryName: string;
  type: CategoryType;
}

const RULES: KeywordRule[] = [
  // ===================== EXPENSE =====================
  {
    type: 'expense',
    categoryName: 'Mâncare',
    keywords: [
      'lidl', 'kaufland', 'mega image', 'mega', 'carrefour', 'auchan', 'profi', 'penny',
      'cora', 'selgros', 'metro', 'la doi pasi', 'la 2 pasi',
      'mcdonald', 'kfc', 'burger king', 'subway', 'starbucks', 'pizza', 'shaorma', 'shawarma',
      'glovo', 'bolt food', 'tazz', 'foodpanda', 'foodora', 'uber eats',
      'restaurant', 'bistro', 'cafenea', 'cafe ', 'covrigi', 'patiserie', 'fornetti', 'paine',
    ],
  },
  {
    type: 'expense',
    categoryName: 'Transport',
    keywords: [
      'stb', 'ratb', 'metrorex', 'tpbi', 'metro bucuresti',
      'bolt', 'uber', 'free now', 'clever',
      'omv', 'mol', 'lukoil', 'petrom', 'rompetrol', 'gazprom', 'benzin', 'motorina', 'combustibil',
      'tarom', 'blue air', 'wizz', 'wizzair', 'ryanair', 'lufthansa', 'klm',
      'cfr', 'tren', 'autogara', 'autocar', 'parcare', 'rovinieta', 'taxi',
    ],
  },
  {
    type: 'expense',
    categoryName: 'Locuință',
    keywords: [
      'chirie', 'rent', 'cazare', 'apartament', 'garsoniera',
      'enel', 'electrica', 'engie', 'distrigaz', 'eon', 'apa nova', 'rcs', 'rds', 'rcs-rds',
      'upc', 'digi', 'vodafone', 'orange', 'telekom',
      'asociatie', 'asoc.', 'intretinere', 'mentenanta',
    ],
  },
  {
    type: 'expense',
    categoryName: 'Divertisment',
    keywords: [
      'cinema', 'cinemaxx', 'cinema city', 'happy cinema',
      'netflix', 'spotify', 'disney+', 'disney plus', 'hbo', 'youtube premium',
      'steam', 'playstation', 'xbox', 'nintendo', 'epic games',
      'concert', 'teatru', 'opera', 'festival', 'club',
    ],
  },
  {
    type: 'expense',
    categoryName: 'Sănătate',
    keywords: [
      'farmacia', 'catena', 'sensiblu', 'help net', 'help.net', 'dona', 'tei',
      'spitalul', 'clinica', 'medic', 'doctor', 'consultatie',
      'regina maria', 'medlife', 'medicover', 'sanador', 'medsana',
      'stomatologie', 'dental', 'optic', 'optica',
    ],
  },
  {
    type: 'expense',
    categoryName: 'Cumpărături',
    keywords: [
      'emag', 'altex', 'media galaxy', 'flanco', 'evomag',
      'h&m', 'h & m', 'zara', 'pull&bear', 'bershka', 'stradivarius',
      'decathlon', 'intersport', 'sportisimo',
      'ikea', 'jysk', 'dedeman', 'mobexpert',
      'fashiondays', 'about you', 'asos', 'shein',
    ],
  },
  {
    type: 'expense',
    categoryName: 'Educație',
    keywords: [
      'curs', 'workshop', 'training', 'taxa scolarizare', 'taxa studii',
      'universitatea', 'facultatea', 'licenta', 'masterat',
      'udemy', 'coursera', 'pluralsight', 'linkedin learning',
      'carte', 'libraria',
    ],
  },
  {
    type: 'expense',
    categoryName: 'Utilități',
    keywords: [
      'factura curent', 'curent electric', 'gaz natural', 'apa rece', 'apa calda',
      'salubrizare', 'gunoi',
    ],
  },
  // ===================== INCOME =====================
  {
    type: 'income',
    categoryName: 'Salariu',
    keywords: [
      'salariu', 'salary', 'lohn', 'wage', 'plata salariu',
      'avans salariu',
    ],
  },
  {
    type: 'income',
    categoryName: 'Freelance',
    keywords: [
      'freelance', 'factura', 'invoice', 'pfa', 'srl', 'consultanta',
      'contract prestari', 'upwork', 'fiverr',
    ],
  },
  {
    type: 'income',
    categoryName: 'Investiții',
    keywords: [
      'dividend', 'dividende', 'dobanda', 'interest',
      'crypto', 'bitcoin', 'ethereum', 'binance', 'coinbase',
      'fond mutual', 'etf', 'actiuni',
    ],
  },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/[^a-z0-9 +&._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface CategorySuggestion {
  categoryId: string;
  categoryName: string;
  confidence: number;
  matchedKeyword: string;
}

/**
 * Look up the best category guess for a free-text description and an optional
 * income/expense scope. Returns null when no keyword matches.
 */
export function suggestCategory(
  description: string | null | undefined,
  type: CategoryType | undefined,
  userCategories: CategoryRecord[],
): CategorySuggestion | null {
  if (!description) return null;
  const normalized = normalize(description);
  if (!normalized) return null;

  // Walk all rules; pick the rule with the longest keyword match (more specific
  // wins). Restrict by type when provided.
  let best: { rule: KeywordRule; keyword: string } | null = null;
  for (const rule of RULES) {
    if (type && rule.type !== type) continue;
    for (const kw of rule.keywords) {
      const needle = normalize(kw);
      if (!needle) continue;
      if (normalized.includes(needle)) {
        if (!best || needle.length > best.keyword.length) {
          best = { rule, keyword: needle };
        }
      }
    }
  }
  if (!best) return null;

  // Resolve to an actual category id. Prefer a user/default category whose
  // (normalized) name equals the rule's target name AND whose type matches.
  const targetName = normalize(best.rule.categoryName);
  const candidates = userCategories
    .filter((c) => c.type === best!.rule.type)
    .filter((c) => normalize(c.name) === targetName);

  // Preference order: user-owned (non-default) > default
  candidates.sort((a, b) => {
    const aUser = a.isDefault ? 1 : 0;
    const bUser = b.isDefault ? 1 : 0;
    return aUser - bUser;
  });

  const picked = candidates[0];
  if (!picked) return null;

  // Confidence is rough: longer keyword match = higher confidence, capped at .95.
  const confidence = Math.min(0.95, 0.4 + best.keyword.length / 40);
  return {
    categoryId: picked.id,
    categoryName: picked.name,
    confidence,
    matchedKeyword: best.keyword,
  };
}
