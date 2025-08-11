import React from "react";
import "../styles/main.css";
import sorteoImg from "../assets/sorteo.png";

import useFetch from "../hooks/useFetch";
import apiRoutes from "../apiRoutes";

import SorteoInfo from "../components/SorteoInfo";
import BotonRegistro from "../components/BotonRegistro";
import PremioCard from "../components/PremioCard";

export default function Home() {
  // Obtener próximo sorteo
  const { data: sorteo, loading: loadingSorteo, error: errorSorteo } = useFetch(apiRoutes.proximoSorteo);

  // Obtener premios solo si ya cargó el sorteo y hay id
  const {
    data: premiosData,
    loading: loadingPremios,
    error: errorPremios,
  } = useFetch(sorteo ? `${apiRoutes.premios}?sorteo_id=${sorteo.id}` : null);

  if (loadingSorteo) return <p>Cargando información del próximo sorteo...</p>;
  if (errorSorteo) return <p>Error: {errorSorteo}</p>;
  if (!sorteo) return <p>No hay próximo sorteo disponible.</p>;

  return (
    <div className="container">
      <header className="header">
        <h1 className="logo">Game Ztore</h1>
        <p className="tagline">Participa y gana premios cada mes</p>
      </header>

      <main className="main">
        <SorteoInfo titulo={sorteo.nombre_sorteo} sorteo={sorteo} />
        <p className="price">
          Compra tu ticket por solo <strong>S/ {sorteo.ticket_price}</strong>
        </p>

        <BotonRegistro />
        <img
          src={sorteoImg}
          alt={`Próximo Sorteo - ${sorteo.nombre_sorteo}`}
          className="sorteo-banner"
        />

        <div className="cards">
          {loadingPremios && <p>Cargando premios...</p>}
          {errorPremios && <p>Error cargando premios: {errorPremios}</p>}
          {!loadingPremios && premiosData && premiosData.premios && premiosData.premios.length === 0 && (
            <p>No hay premios disponibles.</p>
          )}

          {!loadingPremios &&
            premiosData &&
            premiosData.premios &&
            premiosData.premios.map((premio) => (
              <PremioCard
                key={premio.id}
                titulo={`${premio.nombre} `}
                descripcion={premio.descripcion}
              />
            ))}
        </div>
      </main>

      <footer className="footer">&copy; 2025 Game Ztore. Todos los derechos reservados.</footer>
    </div>
  );
}
