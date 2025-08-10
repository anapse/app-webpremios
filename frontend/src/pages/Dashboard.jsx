import React, { useState, useEffect } from 'react';
import useFetch from '../hooks/useFetch';
import apiRoutes from '../apiRoutes';

import NombreSorteo from '../components/dasboard/NombreSorteo';
import PrecioTicket from '../components/dasboard/PrecioTicket';
import SorteoFecha from '../components/dasboard/SorteoFecha';
import EstadoSorteo from '../components/dasboard/EstadoSorteo';
import CrearNuevoSorteo from '../components/dasboard/CrearNuevoSorteo';

const Dashboard = () => {
  // Estado para el sorteo activo / actual
  const [sorteoActual, setSorteoActual] = useState(null);
  
  // Fetch para cargar último sorteo (puede ser por id o el que está activo)
  const { data, loading, error } = useFetch(apiRoutes.proximoSorteo);

  useEffect(() => {
    if (data) setSorteoActual(data);
  }, [data]);

  // Función para actualizar el sorteo activo tras crear uno nuevo
  const handleNuevoSorteoCreado = async () => {
  try {
    const res = await fetch(apiRoutes.proximoSorteo);
    if (!res.ok) throw new Error('Error al recargar el sorteo');
    const json = await res.json();
    setSorteoActual(json);
  } catch (error) {
    console.error(error);
    // Aquí podrías mostrar un mensaje o manejar el error si quieres
  }
};

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="dashboard-container">
      <h1>Panel de Administración</h1>

      <CrearNuevoSorteo 
        precioDefault={sorteoActual?.ticket_price} 
        onNuevoSorteoCreado={handleNuevoSorteoCreado} 
      />

      {sorteoActual && (
        <>
          <NombreSorteo sorteo={sorteoActual} setSorteo={setSorteoActual} />
          <PrecioTicket sorteo={sorteoActual} setSorteo={setSorteoActual} />
          <SorteoFecha sorteo={sorteoActual} setSorteo={setSorteoActual} />
          <EstadoSorteo sorteo={sorteoActual} setSorteo={setSorteoActual} />
        </>
      )}
    </div>
  );
};

export default Dashboard;
