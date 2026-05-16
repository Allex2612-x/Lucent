import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Create an Axios instance with base URL depending on environment
export const api = axios.create({
  baseURL:  'http://localhost:4000/api',
  withCredentials: true, // Needed for sending httpOnly cookies
});

// Setup interceptors to attach access token if available
api.interceptors.request.use(
  (config) => {
    const state = useAuthStore.getState();
    if (state.accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${state.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: try to refresh the access token once on a 401, but never
// for unauthenticated endpoints (login / register / refresh themselves).
// Without this guard, a 401 from /auth/login would trigger /auth/refresh,
// fail, then `window.location.href = '/login'` which reloads the page and
// wipes the error toast that the login form was about to show.
const AUTH_EXEMPT_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password'];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url: string = originalRequest?.url || '';
    const isAuthEndpoint = AUTH_EXEMPT_PATHS.some((p) => url.endsWith(p) || url.includes(p));

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        const res = await api.post('/auth/refresh', {}, { withCredentials: true });
        if (res.data?.data?.accessToken) {
          const state = useAuthStore.getState();
          if (state.user) {
            state.setAuth(state.user, res.data.data.accessToken);
          }
          originalRequest.headers.Authorization = `Bearer ${res.data.data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed for a protected endpoint — log out and redirect.
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
