// src/components/PageLoader.jsx
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useLoading } from "../context/LoadingContext";

export default function PageLoader() {
  const location = useLocation();
  const { show, hide } = useLoading();
  const isFirstLoad = useRef(true);

  useEffect(() => {
    // Siempre mostrar loading al cambiar de ruta
    show("Cargando página...");
    
    // Tiempo mínimo que debe estar visible
    const minTime = isFirstLoad.current ? 1500 : 800;
    const startTime = Date.now();
    
    // Escuchar cuando la página esté completamente cargada
    const handleLoad = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minTime - elapsed);
      
      setTimeout(() => {
        hide();
      }, remaining);
    };

    // Si es la primera carga, esperar a que todo esté listo
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      
      // Esperar a que el DOM esté listo y las imágenes cargadas
      Promise.all([
        new Promise(resolve => {
          if (document.readyState === 'complete') {
            resolve();
          } else {
            window.addEventListener('load', resolve, { once: true });
          }
        }),
        // Dar tiempo para que los componentes se monten
        new Promise(resolve => setTimeout(resolve, 800))
      ]).then(handleLoad);
    } else {
      // Para navegación normal, esperar menos tiempo
      setTimeout(handleLoad, 500);
    }

    // Cleanup
    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, [location.pathname, show, hide]);

  return null;
}
