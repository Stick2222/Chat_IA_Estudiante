import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../authService/authService';
import { useAuth } from '../context/AuthContext';
import { 
  Bot, 
  Home, 
  LogOut, 
  LogIn, 
  UserPlus, 
  BookOpen, 
  User,
  ChevronDown,
  Settings
} from 'lucide-react';
import { useState } from 'react';

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, setAuthenticated } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const userName = localStorage.getItem('nombre') || 'Estudiante';
  

  const handleLogout = () => {
    authService.logout();
    setAuthenticated(false);
    setIsProfileOpen(false);
    navigate('/login');
  };

  return (
    <header className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 text-white shadow-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo y Título */}
          <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold tracking-tight group-hover:text-yellow-300 transition-colors">
                  EstudiBot
                </span>
                <span className="text-sm text-blue-100 font-medium opacity-90">
                  Tu asistente académico
                </span>
              </div>
          </div>

          {/* Navegación */}
          <nav className="flex items-center space-x-2">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {/* Enlaces principales */}
                <Link
                  to="/mis-cursos"
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105"
                >
                  <Home className="w-4 h-4" />
                  <span>Inicio</span>
                </Link>

                <Link
                  to="/mis-cursos"
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Mis Cursos </span>
                </Link>

                {/* Menú de perfil */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-xs font-bold text-white">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-32 truncate">{userName}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                      {/* Header del dropdown */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800">{userName}</p>
                        <p className="text-xs text-gray-500">Estudiante</p>
                      </div>

                      {/* Opciones del menú */}
                      <Link
                        to="/mi-perfil"
                        className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        <span>Mi Perfil </span>
                      </Link>

                      <Link
                        to=""
                        className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Configuración</span>
                      </Link>

                      {/* Separador */}
                      <div className="border-t border-gray-100 my-1"></div>

                      {/* Cerrar sesión */}
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-b-xl"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105 group"
                >
                  <LogIn className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Iniciar Sesión</span>
                </Link>

                <Link
                  to="/register"
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl group"
                >
                  <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Registrarse</span>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Overlay para cerrar el dropdown */}
      {isProfileOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsProfileOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;