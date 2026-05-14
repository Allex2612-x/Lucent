import { api } from './api';

export interface OAuthProviders {
  google: boolean;
  facebook: boolean;
}

const API_BASE = api.defaults.baseURL ?? '';

export const oauthService = {
  getProviders: () => {
    return api.get<{ success: boolean; data: OAuthProviders }>('/auth/providers');
  },

  startUrl: (provider: 'google' | 'facebook') => `${API_BASE}/auth/${provider}`,
};
