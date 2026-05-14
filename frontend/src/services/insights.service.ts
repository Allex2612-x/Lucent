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

  ask: (question: string) => {
    return api.post<{ success: boolean; data: { answer: string; generatedAt: string } }>(
      '/insights/ask',
      { question },
    );
  },

  getRecommendations: () => {
    return api.get<{ success: boolean; data: Recommendation[] }>('/insights/recommendations');
  },
};

export interface Recommendation {
  id: string;
  icon: string;
  title: string;
  body: string;
  tag: 'Acțiune' | 'Buget' | 'Raport' | 'Reminder';
}
