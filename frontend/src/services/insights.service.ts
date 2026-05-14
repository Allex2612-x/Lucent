import { api } from './api';

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

export const insightsService = {
  getWeekly: (refresh = false) => {
    return api.get<{ success: boolean; data: WeeklyInsight }>('/insights/weekly', {
      params: refresh ? { refresh: 'true' } : {},
    });
  },

  getTip: (refresh = false) => {
    return api.get<{ success: boolean; data: QuickTip }>('/insights/tip', {
      params: refresh ? { refresh: 'true' } : {},
    });
  },
};
