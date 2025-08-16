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
  const { data: sorteo, loading: loadingSorteo, error: errorSorteo } = useFetch(apiRoutes.proximoSorteo, { useGlobalLoader: true });

  // Obtener premios solo si ya cargó el sorteo y hay id
  const {
    data: premiosData,
    loading: loadingPremios,
    error: errorPremios,
  } = useFetch(sorteo ? `${apiRoutes.premios}?sorteo_id=${sorteo.id}` : null, { useGlobalLoader: true });

  // Loading optimizado - mostrar estructura básica mientras carga
  if (loadingSorteo) {
    return (
      <div className="container">
        <header className="header">
          <h1 className="logo">Game Ztore</h1>
          <p className="tagline">Participa y gana premios cada mes</p>
        </header>
        <main className="main">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div className="sorteo-info-skeleton">
              <div style={{ 
                height: '40px', 
                backgroundColor: '#333', 
                borderRadius: '8px', 
                marginBottom: '20px',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}></div>
              <div style={{ 
                height: '20px', 
                backgroundColor: '#333', 
                borderRadius: '8px',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (errorSorteo) {
    return (
      <div className="container">
        <header className="header">
          <h1 className="logo">Game Ztore</h1>
          <p className="tagline">Participar y ganar premios cada mes</p>
        </header>
        <main className="main">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p>❌ Error: {errorSorteo}</p>
            <button onClick={() => window.location.reload()}>🔄 Reintentar</button>
          </div>
        </main>
      </div>
    );
  }

  if (!sorteo) {
    return (
      <div className="container">
        <header className="header">
          <h1 className="logo">Game Ztore</h1>
          <p className="tagline">Participar y ganar premios cada mes</p>
        </header>
        <main className="main">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p>📅 No hay próximo sorteo disponible.</p>
          </div>
        </main>
      </div>
    );
  }

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

        </div>
  );
}
