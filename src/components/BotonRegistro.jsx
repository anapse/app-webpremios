import React from 'react';
import { Link } from "react-router-dom";
import '../styles/BotonRegistro.css'; // Asegúrate de tener este archivo CSS

const BotonRegistro = () => {
    return (
        <Link to="/registro" className="boton-registro">
            ¡Registrar Ticket!
        </Link>
    );
};

export default BotonRegistro;
