import React, { useState, useEffect } from 'react';
import useFetch from '../hooks/useFetch';
import apiRoutes from '../apiRoutes';
import '../styles/dashboard.css';

import NombreSorteo from '../components/dasboard/NombreSorteo';
import PrecioTicket from '../components/dasboard/PrecioTicket';
import SorteoFecha from '../components/dasboard/SorteoFecha';
import EstadoSorteo from '../components/dasboard/EstadoSorteo';
import CrearNuevoSorteo from '../components/dasboard/CrearNuevoSorteo';
import PremiosEditor from '../components/dasboard/PremiosEditor';
import HomeBannerEditor from '../components/dasboard/HomeBannerEditor';
import TicketsManager from '../components/dasboard/TicketsManager';
import SystemConfig from '../components/dasboard/SystemConfig';

const Dashboard = () => {
  // Estado para el sorteo activo / actual
  const [sorteoActual, setSorteoActual] = useState(null);
  
  // Estado para controlar qué sección se muestra
  const [seccionActiva, setSeccionActiva] = useState('sorteo');
  
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

      {/* Navegación por tabs */}
      <div className="dashboard-tabs">
        <button 
          className={seccionActiva === 'sorteo' ? 'tab-active' : 'tab'}
          onClick={() => setSeccionActiva('sorteo')}
        >
          🎲 Gestión de Sorteos
        </button>
        <button 
          className={seccionActiva === 'premios' ? 'tab-active' : 'tab'}
          onClick={() => setSeccionActiva('premios')}
        >
          🏆 Gestión de Premios
        </button>
        <button 
          className={seccionActiva === 'tickets' ? 'tab-active' : 'tab'}
          onClick={() => setSeccionActiva('tickets')}
        >
          🎫 Gestión de Tickets
        </button>
        <button 
          className={seccionActiva === 'config' ? 'tab-active' : 'tab'}
          onClick={() => setSeccionActiva('config')}
        >
          ⚙️ Configuración
        </button>
      </div>

      {/* Contenido según la sección activa */}
      {seccionActiva === 'sorteo' && sorteoActual && (
        <div className="dashboard-section">
          <CrearNuevoSorteo 
            precioDefault={sorteoActual?.ticket_price} 
            onNuevoSorteoCreado={handleNuevoSorteoCreado} 
          />
          <NombreSorteo sorteo={sorteoActual} setSorteo={setSorteoActual} />
          <PrecioTicket sorteo={sorteoActual} setSorteo={setSorteoActual} />
          <SorteoFecha sorteo={sorteoActual} setSorteo={setSorteoActual} />
          <EstadoSorteo sorteo={sorteoActual} setSorteo={setSorteoActual} />
        </div>
      )}

      {seccionActiva === 'premios' && sorteoActual && (
        <div className="premios-section">
          <PremiosEditor sorteo={sorteoActual} setSorteo={setSorteoActual} />
          <HomeBannerEditor />
        </div>
      )}

      {seccionActiva === 'tickets' && (
        <div className="dashboard-section">
          <TicketsManager />
        </div>
      )}

      {seccionActiva === 'config' && (
        <div className="dashboard-section">
          <SystemConfig />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
