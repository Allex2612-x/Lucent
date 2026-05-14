import { prisma } from '../../shared/prisma.js';

export interface AnomalyTransaction {
  id: string;
  amount: number;
  date: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  zScore: number;
  meanAmount: number;
  sampleSize: number;
}

interface DetectAnomaliesOptions {
  lookbackDays?: number;
  alertDays?: number;
  minSamples?: number;
  zThreshold?: number;
}

/**
 * Walk all expense transactions in the lookback window, group by category, and
 * flag any tx in the alert window whose amount is more than `zThreshold`
 * standard deviations above the category mean.
 *
 * Defaults:
 *   - 90-day lookback to compute the per-category baseline
 *   - 14-day alert window (only return recent outliers)
 *   - 5 minimum samples per category (otherwise the mean is too noisy)
 *   - z-score threshold of 2.0
 */
export async function detectAnomalies(
  userId: string,
  options: DetectAnomaliesOptions = {},
): Promise<AnomalyTransaction[]> {
  const lookbackDays = options.lookbackDays ?? 90;
  const alertDays = options.alertDays ?? 14;
  const minSamples = options.minSamples ?? 5;
  const zThreshold = options.zThreshold ?? 2;

  const now = new Date();
  const lookbackStart = new Date(now);
  lookbackStart.setDate(now.getDate() - lookbackDays);
  const alertStart = new Date(now);
  alertStart.setDate(now.getDate() - alertDays);

  const tx = await prisma.transaction.findMany({
    where: {
      userId,
      type: 'expense',
      date: { gte: lookbackStart, lte: now },
    },
    include: { category: true },
    orderBy: { date: 'desc' },
  });

  if (tx.length === 0) return [];

  // group by category
  const grouped = new Map<string, typeof tx>();
  for (const t of tx) {
    const list = grouped.get(t.categoryId) ?? [];
    list.push(t);
    grouped.set(t.categoryId, list);
  }

  const anomalies: AnomalyTransaction[] = [];
  for (const [catId, list] of grouped) {
    if (list.length < minSamples) continue;
    const amounts = list.map((t) => Number(t.amount));
    const mean = amounts.reduce((s, n) => s + n, 0) / amounts.length;
    const variance =
      amounts.reduce((s, n) => s + (n - mean) ** 2, 0) / amounts.length;
    const std = Math.sqrt(variance);
    if (std === 0) continue;

    for (const t of list) {
      if (t.date < alertStart) continue;
      const amount = Number(t.amount);
      const z = (amount - mean) / std;
      if (z >= zThreshold) {
        anomalies.push({
          id: t.id,
          amount,
          date: t.date.toISOString(),
          description: t.description,
          categoryId: catId,
          categoryName: t.category?.name ?? 'Necunoscut',
          categoryIcon: t.category?.icon ?? null,
          categoryColor: t.category?.color ?? null,
          zScore: Number(z.toFixed(2)),
          meanAmount: Number(mean.toFixed(2)),
          sampleSize: list.length,
        });
      }
    }
  }

  // sort by z-score desc, cap at 10
  anomalies.sort((a, b) => b.zScore - a.zScore);
  return anomalies.slice(0, 10);
}
