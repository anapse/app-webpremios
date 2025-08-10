import { Link } from 'react-router-dom';
import { useState } from 'react';
import '../styles/Navbar.css';
import logo from '../assets/logo128.png';

function Navbar() {
  const isAdmin = true;
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  // Cerrar menú al hacer clic en un enlace (útil en móvil)
  const handleLinkClick = () => setMenuOpen(false);

  return (
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
        <Link to="/ganadores" onClick={handleLinkClick}>Ganadores</Link>
        {isAdmin && <Link to="/dashboard" onClick={handleLinkClick}>Dashboard</Link>}
      </div>
    </nav>
  );
}

export default Navbar;
