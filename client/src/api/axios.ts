import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // O intenta con 'http://127.0.0.1:3000/api'
  withCredentials: true,
});

// Interceptor: Antes de cada petición, inyecta el Token si existe
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;