import axios from 'axios';
import { SocketService } from '../socket/socket';
import { env } from '../../utils/env';

const api = axios.create({
  baseURL: env.baseUrl || 'http://localhost:3200',
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Ensure correct Content-Type: let Axios set it for FormData
    if (config.headers) {
      const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;
      if (isFormData) {
        // Remove any preset header so axios can set multipart/form-data with boundary
        delete (config.headers as any)['Content-Type'];
      } else {
        // Default for JSON requests
        if (!('Content-Type' in config.headers)) {
          config.headers['Content-Type'] = 'application/json';
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Ensure socket disconnects on auth loss
      try { SocketService.disconnect(); } catch {}
      // Preserve the route the user attempted to access
      try {
        const hashPath = window.location.hash?.slice(1) || '/home';
        const returnTo = encodeURIComponent(hashPath);
        window.location.href = `/#/login?returnTo=${returnTo}`;
      } catch {
        window.location.href = '/#/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;