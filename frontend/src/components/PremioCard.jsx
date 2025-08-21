import React from 'react';
import '../styles/main.css';

export default function PremioCard({ titulo, descripcion, imagen_url, imagen_base64 }) {
  // Usar imagen_base64 si está disponible, sino imagen_url, sino imagen por defecto
  const imagenSrc = imagen_base64 || imagen_url || '/placeholder-premio.svg';
  
  return (
    <div className="card">
      <div className="card-image">
        <img 
          src={imagenSrc} 
          alt={titulo}
          className="premio-image"
          onError={(e) => {
            // Si falla la carga, usar imagen por defecto
            e.target.src = '/placeholder-premio.svg';
          }}
        />
      </div>
      <div className="card-content">
        <h3>{titulo}</h3>
        <p>{descripcion}</p>
      </div>
    </div>
  );
}
