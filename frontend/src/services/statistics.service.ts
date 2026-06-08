import { api } from './api';

export interface OverviewParams {
  month?: number;
  year?: number;
  startDate?: string; // ISO yyyy-MM-dd, overrides month/year if set
  endDate?: string;
}

export interface ByCategoryParams {
  startDate?: string;
  endDate?: string;
  type?: 'income' | 'expense';
}

export interface MonthlyTrendParams {
  months?: number;
  startDate?: string;
  endDate?: string;
}

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

export const statisticsService = {
  getOverview: (params?: OverviewParams) => {
    return api.get('/statistics', { params });
  },

  getByCategory: (params?: ByCategoryParams) => {
    return api.get('/statistics/by-category', { params });
  },

  getMonthlyTrend: (params?: MonthlyTrendParams) => {
    return api.get('/statistics/monthly-trend', { params });
  },

  getAnomalies: () => {
    return api.get<{ success: boolean; data: AnomalyTransaction[] }>('/statistics/anomalies');
  },
};
