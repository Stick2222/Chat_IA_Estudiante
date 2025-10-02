// components/EstudiantesList.tsx
import { useState, useEffect } from 'react';
import { estudianteService } from '../api/estudianteapi';
import type { Estudiante } from '../models/models';

const EstudiantesList: React.FC = () => {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadEstudiantes();
  }, []);

  const loadEstudiantes = async () => {
    try {
      setLoading(true);
      const data = await estudianteService.getAll();
      setEstudiantes(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Error al cargar estudiantes');
      } else {
        setError('Error desconocido al cargar estudiantes');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro?')) {
      try {
        await estudianteService.delete(id);
        loadEstudiantes();
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Error al eliminar');
        } else {
          setError('Error desconocido al eliminar');
        }
      }
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Bienvenido 
        {estudiantes[0]?.nombre || 'Estudiante'}
      </h2>
      <table className="w-full border">
        
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Cédula</th>
            <th className="p-2 border">Nombre</th>
            
          </tr>
        </thead>
        <tbody>
          {estudiantes.map((est) => (
            <tr key={est.id}>
              <td className="p-2 border">{est.cedula}</td>
              <td className="p-2 border">{est.nombre} </td>
              <td className="p-2 border">
                <button
                  onClick={() => est.id && handleDelete(est.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EstudiantesList;