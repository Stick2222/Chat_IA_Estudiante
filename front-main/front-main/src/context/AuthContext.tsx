// context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../authService/authService';

const AuthContext = createContext({ isAuthenticated: false, setAuthenticated: (value: boolean) => {} });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setAuthenticated] = useState(authService.isAuthenticated());

  useEffect(() => {
    // Puedes agregar lógica para verificar el token o sesión aquí
    setAuthenticated(authService.isAuthenticated());
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
