// services/estudianteService.ts
import api from './api'; // tu instancia de axios
import type { Estudiante } from '../models/models';

export const estudianteService = {
  getPerfil: async (): Promise<Estudiante> => {
    const token = localStorage.getItem('accessToken');
    const response = await api.get('/perfil/', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};