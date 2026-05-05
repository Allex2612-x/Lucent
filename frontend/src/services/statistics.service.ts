import { api } from './api';

export interface OverviewParams {
  month?: number;
  year?: number;
}

export interface ByCategoryParams {
  startDate?: string;
  endDate?: string;
  type?: 'income' | 'expense';
}

export interface MonthlyTrendParams {
  months?: number;
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
};
