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

// Optional: Interceptor to handle 401s and refresh tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Attempt to refresh token using httpOnly cookie
        const res = await api.post('/auth/refresh', {}, { withCredentials: true });
        if (res.data?.data?.accessToken) {
          // Update the access token in zustand store
          const state = useAuthStore.getState();
          if (state.user) {
            state.setAuth(state.user, res.data.data.accessToken);
          }
          
          // Update the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${res.data.data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, log out user
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
