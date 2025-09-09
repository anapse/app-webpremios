import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import '../styles/Navbar.css';
import logo from '../assets/logo128.png';

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ usuario: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Verificar si hay sesión activa al cargar y escuchar cambios en localStorage
  useEffect(() => {
    const checkAuthStatus = () => {
      const savedUser = localStorage.getItem('dashboardUser');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setIsLoggedIn(true);
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('dashboardUser');
          setUser(null);
          setIsLoggedIn(false);
        }
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    };

    // Verificar al cargar
    checkAuthStatus();

    // Escuchar cambios en localStorage (cuando se cierra sesión en otra pestaña)
    const handleStorageChange = (e) => {
      if (e.key === 'dashboardUser') {
        checkAuthStatus();
        // Si se eliminó la sesión, redirigir a home si estamos en dashboard
        if (!e.newValue && window.location.hash.includes('/dashboard')) {
          navigate('/', { replace: true });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const handleLinkClick = () => setMenuOpen(false);

  const openLoginModal = () => {
    setShowLoginModal(true);
    setLoginError('');
    setLoginForm({ usuario: '', password: '' });
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    setLoginError('');
    setLoginForm({ usuario: '', password: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
        setIsLoggedIn(true);
        localStorage.setItem('dashboardUser', JSON.stringify(data.user));
        closeLoginModal();
        console.log('✅ Login exitoso:', data.user.usuario);
      } else {
        setLoginError(data.error || 'Error de autenticación');
      }
    } catch (error) {
      console.error('❌ Error en login:', error);
      setLoginError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('dashboardUser');
    console.log('👋 Sesión cerrada');
    
    // Si estamos en dashboard, redirigir a home
    if (window.location.hash.includes('/dashboard')) {
      navigate('/', { replace: true });
    }
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="navbar-brand" onClick={handleLinkClick}>
          <img src={logo} alt="Game Ztore Logo" className="navbar-logo" />
        </Link>

        <button className="hamburger" onClick={toggleMenu} aria-label="Toggle menu">
          <span className={`bar ${menuOpen ? 'open' : ''}`}></span>
          <span className={`bar ${menuOpen ? 'open' : ''}`}></span>
          <span className={`bar ${menuOpen ? 'open' : ''}`}></span>
        </button>

        <div className={`navbar-links ${menuOpen ? 'active' : ''}`}>
          <Link to="/" onClick={handleLinkClick}>Home</Link>
          <Link to="/tickets" onClick={handleLinkClick}>Tickets</Link>
          {isLoggedIn && (
            <Link to="/niubiz" onClick={handleLinkClick} className="niubiz-btn">Niubiz</Link>
          )}
          <Link to="/ganadores" onClick={handleLinkClick}>Ganadores</Link>
          
          {isLoggedIn ? (
            <>
              <Link to="/dashboard" onClick={handleLinkClick}>Dashboard</Link>
              <button 
                className="logout-btn" 
                onClick={() => { handleLogout(); handleLinkClick(); }}
              >
                Salir ({user?.usuario})
              </button>
            </>
          ) : (
            <button className="login-btn" onClick={openLoginModal}>
              Login
            </button>
          )}
        </div>
      </nav>

      {/* Modal de Login */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={closeLoginModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Acceso al Dashboard</h3>
              <button className="modal-close" onClick={closeLoginModal}>×</button>
            </div>
            
            <form className="login-form" onSubmit={handleLogin}>
              {loginError && <div className="error-message">{loginError}</div>}
              
              <div className="form-group">
                <label htmlFor="usuario">Usuario:</label>
                <input
                  type="text"
                  id="usuario"
                  name="usuario"
                  value={loginForm.usuario}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Contraseña:</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={loginForm.password}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={closeLoginModal}
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-login"
                  disabled={isLoading}
                >
                  {isLoading ? 'Ingresando...' : 'Ingresar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
