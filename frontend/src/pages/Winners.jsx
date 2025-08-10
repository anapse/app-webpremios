import { useState, useEffect } from 'react';
import useFetch from '../hooks/useFetch';
import WinnersTable from '../components/WinnersTable';
import '../styles/Ganadores.css';
import apiRoutes from '../apiRoutes';
import SorteoInfo from '../components/SorteoInfo';

export default function Ganadores() {
  const [sorteoId, setSorteoId] = useState(null);
  const { data: ganadores, loading, error } = useFetch(
    sorteoId ? `${apiRoutes.ganadores}?id=${sorteoId}` : null
  );
  const { data: ultimoSorteo } = useFetch(apiRoutes.ultimoSorteo);
useEffect(() => {

  if (ultimoSorteo?.id) setSorteoId(ultimoSorteo.id);
}, [ultimoSorteo]);
 

  if (!sorteoId) return <p>Cargando información del sorteo...</p>;
  if (loading) return <p>Cargando ganadores...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  // Agrupar ganadores por nombre del premio
  const agrupados = {};
  ganadores?.forEach((g) => {
    const premio = g.premio || 'Sin premio';
    if (!agrupados[premio]) agrupados[premio] = [];
    agrupados[premio].push(g);
  });

  return (
    <div className="ganadores-page">
   <SorteoInfo titulo={`Ganadores del ${ultimoSorteo?.nombre_sorteo || ''}`} sorteo={ultimoSorteo} />

      <WinnersTable data={agrupados} />
    </div>
  );
}
