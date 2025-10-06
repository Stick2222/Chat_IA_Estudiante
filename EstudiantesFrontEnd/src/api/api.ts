import axios from 'axios';
import Router from 'next/router';
import { tokenManager } from '../utils/tokenManager';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token JWT a cada request
api.interceptors.request.use(
  async (config) => {
    if (typeof window !== 'undefined') {
      const token = await tokenManager.getValidToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores 401 (token expirado o inválido)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      if (typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('refresh');
        
        if (refreshToken) {
          try {
            // Intentar renovar el token
            const response = await axios.post(`${API_URL}/token/refresh/`, { 
              refresh: refreshToken 
            });
            
            const { access } = response.data;
            localStorage.setItem('access', access);
            
            // Reintentar la petición original con el nuevo token
            originalRequest.headers.Authorization = `Bearer ${access}`;
            return api(originalRequest);
            
          } catch (refreshError) {
            // Si falla la renovación, cerrar sesión
            localStorage.removeItem('access');
            localStorage.removeItem('refresh');
            Router.push('/login');
          }
        } else {
          // No hay refresh token, cerrar sesión
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          Router.push('/login');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
