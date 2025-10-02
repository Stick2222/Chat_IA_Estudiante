// services/estudianteService.ts
import api from './api';
import type { Estudiante } from '../models/models';

export const estudianteService = {
  // Obtener todos
  getAll: async (): Promise<Estudiante[]> => {
    const response = await api.get('/estudiante/');
    return response.data;
  },

  // Obtener por ID
  getById: async (id: number): Promise<Estudiante> => {
    const response = await api.get(`/estudiante/${id}/`);
    return response.data;
  },

  // Obtener perfil del estudiante autenticado
  getPerfil: async (): Promise<Estudiante> => {
    const response = await api.get('/perfil/');
    return response.data;
  },

  // Crear
  create: async (estudiante: Estudiante): Promise<Estudiante> => {
    const response = await api.post('/estudiante/', estudiante);
    return response.data;
  },

  // Actualizar
  update: async (id: number, estudiante: Partial<Estudiante>): Promise<Estudiante> => {
    const response = await api.put(`/estudiante/${id}/`, estudiante);
    return response.data;
  },

  // Actualizar parcial
  patch: async (id: number, estudiante: Partial<Estudiante>): Promise<Estudiante> => {
    const response = await api.patch(`/estudiante/${id}/`, estudiante);
    return response.data;
  },

  // Eliminar
  delete: async (id: number): Promise<void> => {
    await api.delete(`/estudiante/${id}/`);
  },
};