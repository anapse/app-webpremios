import { Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = cargando, true/false = estado conocido
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const savedUser = localStorage.getItem('dashboardUser');
      setIsAuthenticated(!!savedUser);
    };

    // Verificar al cargar
    checkAuth();

    // Escuchar cambios en localStorage (cuando se cierra sesión en otra pestaña)
    const handleStorageChange = (e) => {
      if (e.key === 'dashboardUser') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Mientras verifica la autenticación, mostrar nada (evita flash)
  if (isAuthenticated === null) {
    return null;
  }

  // Si no está autenticado, redirigir a home
  if (!isAuthenticated) {
    console.log('🚫 Acceso denegado a ruta protegida:', location.pathname);
    return <Navigate to="/" replace />;
  }

  // Si está autenticado, renderizar el componente hijo
  return children;
};

export default ProtectedRoute;


