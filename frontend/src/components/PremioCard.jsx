import React from 'react';
import '../styles/main.css';

export default function PremioCard({ titulo, descripcion, }) {
  return (
    <div className="card">
      <h3>{titulo}</h3>
      <p>{descripcion}</p>
    </div>
  );
}
