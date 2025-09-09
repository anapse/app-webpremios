import React from 'react';
import useFetch from '../hooks/useFetch';
import apiRoutes from '../apiRoutes';

// Helper para rutas de assets en GitHub Pages
const getAssetPath = (asset) => {
  const isGitHubPages = window.location.hostname === 'anapse.github.io';
  return isGitHubPages ? `/app-webpremios/${asset}` : `/${asset}`;
};

export default function DynamicBanner() {
  const { data: bannerData, loading, error } = useFetch(apiRoutes.homeBanner);
  
  // Si hay error o está cargando, usar placeholder
  if (loading || error || !bannerData?.banner) {
    return (
      <div className="dynamic-banner">
        <img
          src={getAssetPath("placeholder-banner.svg")}
          alt="Banner"
          className="sorteo-banner"
          onError={(e) => {
            e.target.src = getAssetPath("placeholder-banner.svg");
          }}
        />
      </div>
    );
  }

  const { banner } = bannerData;
  const imagenSrc = banner.imagen_base64 || banner.imagen_url || getAssetPath("placeholder-banner.svg");

  return (
    <div className="dynamic-banner">
      <img
        src={imagenSrc}
  alt="Banner"
        className="sorteo-banner"
        onError={(e) => {
          // Si falla la carga, usar placeholder
          e.target.src = getAssetPath("placeholder-banner.svg");
        }}
      />
    </div>
  );
}
