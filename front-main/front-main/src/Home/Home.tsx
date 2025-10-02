import React from 'react';

const Home: React.FC = () => {
  const nombre = localStorage.getItem('nombre');

  return (
    <div className="flex items-center justify-center h-screen bg-blue-50">
      <div className="bg-white shadow-lg rounded-lg p-10 text-center">
        <h1 className="text-2xl font-bold text-blue-700 mb-4">
          ¡Bienvenido {nombre || 'Estudiante'} 🎉!
        </h1>
        <p className="text-gray-600">
          Nos alegra verte de nuevo en el sistema.
        </p>
      </div>
    </div>
  );
};

export default Home;
