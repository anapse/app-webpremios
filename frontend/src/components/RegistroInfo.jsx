import '../styles/RegistroInfo.css';
import { useState, useEffect } from 'react';
import useFetch from '../hooks/useFetch';
import apiRoutes from '../apiRoutes';

const RegistroInfo = () => {
  const { data: sorteoData, loading: sorteoLoading, error: sorteoError } = useFetch(apiRoutes.proximoSorteo);
  const [precio, setPrecio] = useState(null);
  const [config, setConfig] = useState({
    telefono_pagos: '912 391 502',
    qr_pago_base64: '',
    qr_pago_url: ''
  });
  const [configLoading, setConfigLoading] = useState(true);

  // Cargar configuración del sistema
  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        const response = await fetch('/api/config');
        const configData = await response.json();
        setConfig(configData);
      } catch (error) {
        console.error('Error al cargar configuración:', error);
      } finally {
        setConfigLoading(false);
      }
    };

    cargarConfiguracion();
  }, []);

  // Configurar precio del sorteo
  useEffect(() => {
    if (sorteoData && sorteoData.ticket_price !== undefined) {
      setPrecio(sorteoData.ticket_price);
    }
  }, [sorteoData]);

  // Determinar qué imagen QR mostrar
  const getQRImage = () => {
    if (config.qr_pago_base64) {
      return config.qr_pago_base64;
    }
    if (config.qr_pago_url) {
      return config.qr_pago_url;
    }
    // Fallback a imagen por defecto en public
    return '/yapeqr.png';
  };

  return (
    <section className="registro-info">
      <div className="info-container">
        <h2>¿Cómo Participar?</h2>
        
        <div className="paso-container">
          <p className="paso">PASO 1: Realiza el pago al número:</p>
          <div className="numero-container">
            <p className="numero">
              {configLoading ? 'Cargando...' : config.telefono_pagos}
            </p>
          </div>

          <div className="qr-container">
            {!configLoading && (
              <img 
                src={getQRImage()} 
                alt="Código QR de pago" 
                className="qr-image"
                onError={(e) => {
                  e.target.src = '/yapeqr.png'; // Fallback si falla la carga
                }}
              />
            )}
          </div>
          
          <div className="precio-container">
            <p className="costo">Costo del ticket</p>
            <p className="precio">
              <strong>
                {sorteoLoading ? 'Cargando...' : sorteoError ? 'Error al cargar' : `S/ ${precio}`}
              </strong>
            </p>
          </div>
        </div>

        <div className="paso-container">
          <p className="paso2">
            PASO 2: Rellena el formulario con tus datos y sube tu captura de YAPE/PLIN/BCP
            <br />
            <span className="paso2-destacado">📋 Aquí abajo</span>
          </p>
          <div className="flecha">
            <strong>&#8595;</strong>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RegistroInfo;

