// Ganadores.jsx
import useFetch from '../hooks/useFetch';
import WinnersTable from '../components/WinnersTable';
import '../styles/Ganadores.css';
import apiRoutes from '../apiRoutes';

export default function Ganadores() {
  const { data, loading, error } = useFetch(apiRoutes.ganadores);

  if (loading) return <p>Cargando ganadores...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  // Agrupar por nombre del premio
  const agrupados = {};
  data?.forEach((g) => {
    const premio = g.premio || 'Sin premio';
    if (!agrupados[premio]) agrupados[premio] = [];
    agrupados[premio].push(g);
  });

  return (
    <div className="ganadores-page">
      <h1>🎉 GANADORES DEL 31 de JULIO 🎉</h1>
      <WinnersTable data={agrupados} />
    </div>
  );
}
