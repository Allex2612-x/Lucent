import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Backend origin (no /api suffix) — used for static asset URLs like
// uploaded receipt photos that aren't behind /api. Read from a Vite
// env var so the production bundle points at the deployed backend
// (e.g. https://faro-backend.up.railway.app) without code changes.
//
// To override locally, set VITE_API_ORIGIN in frontend/.env.local.
export const API_ORIGIN: string =
  (import.meta.env.VITE_API_ORIGIN as string | undefined) ?? 'http://localhost:4000';

/**
 * Resolve a possibly-relative URL returned by the backend (e.g.
 * "/uploads/receipts/<uuid>.jpg") to an absolute URL the browser can
 * fetch. Full URLs are returned as-is so this is safe to call on any
 * stored value.
 */
export function resolveAssetUrl(maybeRelative: string | null | undefined): string | null {
  if (!maybeRelative) return null;
  if (/^https?:\/\//i.test(maybeRelative)) return maybeRelative;
  return `${API_ORIGIN}${maybeRelative.startsWith('/') ? '' : '/'}${maybeRelative}`;
}

// Create an Axios instance with base URL depending on environment
export const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
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

// Shared in-flight refresh promise so concurrent 401s (e.g. a page that fires
// several queries at once with an expired access token) coalesce into ONE
// /auth/refresh round-trip instead of each firing their own and racing on the
// rotated refresh cookie.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/auth/refresh', {}, { withCredentials: true })
      .then((res) => {
        const token: string | undefined = res.data?.data?.accessToken;
        if (!token) return null;
        const state = useAuthStore.getState();
        if (state.user) state.setAuth(state.user, token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url: string = originalRequest?.url || '';
    const isAuthEndpoint = AUTH_EXEMPT_PATHS.some((p) => url.endsWith(p) || url.includes(p));

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        const token = await refreshAccessToken();
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed for a protected endpoint — best-effort clear the
        // server-side refresh cookie (mirrors the manual logout buttons), then
        // wipe local state and redirect. /auth/logout always returns 200 so it
        // won't recurse into this 401 branch.
        try {
          await api.post('/auth/logout');
        } catch {
          // ignore — still clear local session and redirect
        }
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
