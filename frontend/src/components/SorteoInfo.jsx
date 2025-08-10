import React from 'react';

const SorteoInfo = ({ titulo, sorteo }) => {
  if (!sorteo) return <p>Cargando...</p>;

  const fechaSorteo = sorteo.sorteo_date
    ? new Date(sorteo.sorteo_date).toLocaleDateString('es-PE', {
        day: 'numeric',
        month: 'long',
        timeZone: 'UTC',
      })
    : 'Fecha no disponible';

  return (
    <div>
      <h2>{titulo} {fechaSorteo}</h2>
    </div>
  );
};

export default SorteoInfo;
