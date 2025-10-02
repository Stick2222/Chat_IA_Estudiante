import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Estudiante from './components/Estudiante'
import Home from './Home/Home'
import Header from './components/Header'
import MisCursos from './components/Miscursos'
import Register from './components/Register'
import { AuthProvider } from './context/AuthContext'  
import Miperfi from './components/Miperfi'



function App() {
  return (
    <AuthProvider>
    <BrowserRouter>
        <Header />
        <div>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/mi-perfil" element={<Miperfi />} />
            <Route path="/register" element={<Register />} />
            <Route path="/mis-cursos" element={<MisCursos />} />
            <Route path="/login" element={<Login />} />
            <Route path="/estudiantes" element={<Estudiante />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
            <Route path="/Home" element={<Home />} />
        </Routes>
      </div>
    </BrowserRouter>
    </AuthProvider>
  )
}

export default App