import { Link } from 'react-router-dom'
import '../styles/Navbar.css'
import logo from '../assets/logo128.png' // Asegúrate de tener esta imagen en /src/assets

function Navbar() {
    return (
        <nav className="navbar">
            <Link to="/" className="navbar-brand">
                <img src={logo} alt="Game Ztore Logo" className="navbar-logo" />

            </Link>
            <div className="navbar-links">
                <Link to="/">Home</Link>
                <Link to="/tickets">Tickets</Link>
                <Link to="/ganadores">Ganadores</Link>
            </div>
        </nav>
    )
}

export default Navbar