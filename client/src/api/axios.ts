import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Create an Axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Ensure this matches your backend URL
  withCredentials: true,
});

/**
 * Request Interceptor
 * Injects the Bearer Token into the Authorization header before every request
 * if the token exists in the AuthStore.
 */
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

export default api;