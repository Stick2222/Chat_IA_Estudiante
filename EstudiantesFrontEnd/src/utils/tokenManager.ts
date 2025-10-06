// utils/tokenManager.ts - Gestor inteligente de tokens
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/';

class TokenManager {
  private refreshPromise: Promise<string> | null = null;

  // Verificar si el token está próximo a expirar (5 minutos antes)
  private isTokenExpiringSoon(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convertir a milisegundos
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      
      return (exp - now) < fiveMinutes;
    } catch {
      return true; // Si no se puede decodificar, asumir que está expirado
    }
  }

  // Renovar token automáticamente
  async refreshTokenIfNeeded(): Promise<string | null> {
    const accessToken = localStorage.getItem('access');
    const refreshToken = localStorage.getItem('refresh');

    if (!accessToken || !refreshToken) {
      return null;
    }

    // Si ya hay una renovación en progreso, esperar a que termine
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Si el token no está próximo a expirar, devolverlo tal como está
    if (!this.isTokenExpiringSoon(accessToken)) {
      return accessToken;
    }

    // Renovar el token
    this.refreshPromise = this.performRefresh();
    
    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performRefresh(): Promise<string> {
    const refreshToken = localStorage.getItem('refresh');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(`${API_URL}/token/refresh/`, {
        refresh: refreshToken
      });

      const { access } = response.data;
      localStorage.setItem('access', access);
      
      return access;
    } catch (error) {
      // Si falla la renovación, limpiar todo
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      throw error;
    }
  }

  // Obtener token válido (renovando si es necesario)
  async getValidToken(): Promise<string | null> {
    try {
      return await this.refreshTokenIfNeeded();
    } catch (error) {
      console.error('Error renovando token:', error);
      return null;
    }
  }
}

export const tokenManager = new TokenManager();
