import BotonRegistro from "../components/BotonRegistro";
import "../styles/main.css";
import sorteoImg from '../assets/sorteo.png';
import useFetch from '../hooks/useFetch';
import apiRoutes from '../apiRoutes';
import SorteoInfo from '../components/SorteoInfo';

export default function Home() {
  const { data, loading, error } = useFetch(apiRoutes.proximoSorteo);

  if (loading) return <p>Cargando información del próximo sorteo...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!data) return <p>No hay próximo sorteo disponible.</p>; // <-- Agregado
console.log('Datos del próximo sorteo:', data);
  return (
    <div className="container">
      <header className="header">
        <h1 className="logo">Game Ztore</h1>
        <p className="tagline">Participa y gana premios cada mes</p>
      </header>

      <main className="main">
<SorteoInfo titulo={data.nombre_sorteo} sorteo={data} />
        <p className="price">
          Compra tu ticket por solo <strong>S/ {data.ticket_price}</strong>
        </p>

        <BotonRegistro />
        <img
          src={sorteoImg}
          alt={`Próximo Sorteo - ${data.nombre_sorteo}`}
          className="sorteo-banner"
        />
        <div className="cards">
          <div className="card">
            <h3>🚗 Auto 0KM</h3>
            <p>Participa por un auto completamente nuevo</p>
          </div>
          <div className="card">
            <h3>📱 iPhone 15 Pro</h3>
            <p>También sorteamos tecnología de última generación</p>
          </div>
          <div className="card">
            <h3>💸 S/ 10,000</h3>
            <p>Y premios en efectivo para 10 ganadores más</p>
          </div>
        </div>
      </main>

      <footer className="footer">
        &copy; 2025 Game Ztore. Todos los derechos reservados.
      </footer>
    </div>
  );
}
