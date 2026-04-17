import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Adjust baseURL based on emulator vs physical device
// For iOS Simulator: http://localhost:5000/api
// For Android Emulator: http://10.0.2.2:5000/api
const baseURL = 'http://localhost:5000/api'; 

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
