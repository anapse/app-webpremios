import '../styles/RegistroInfo.css';
import { useState, useEffect } from 'react';
import useFetch from '../hooks/useFetch';
import apiRoutes from '../apiRoutes';

const RegistroInfo = () => {
  const { data, loading, error } = useFetch(apiRoutes.proximoSorteo);
  const [precio, setPrecio] = useState(null);

  useEffect(() => {
    if (data && data.ticket_price !== undefined) {
      setPrecio(data.ticket_price);
    }
  }, [data]);

  return (
   <section className="registro-info">
  <h2>¿Cómo Participar?</h2>

  <p className="paso">📝 <strong>PASO 1:</strong> Completa tus datos en el formulario de abajo.</p>

  <p className="paso">💳 <strong>PASO 2:</strong> Haz clic en <strong>Pagar con Yape</strong> y sigue las instrucciones del sistema seguro de pago.</p>

  <p className="detalle">
    🔐 Ingresa tu <strong>código de aprobación Yape</strong> generado desde la app.
  </p>

  <p className="paso">🎫 <strong>PASO 3:</strong> Tu ticket se generará automáticamente.</p>

  <div className="detalle">
    <p>✅ Verás tu <strong>código de ticket</strong> en pantalla.</p>
    <p>📄 Podrás <strong>descargarlo como PDF</strong>.</p>
  </div>

  <p className="costo">🎟️ Costo del ticket</p>
  <p className="precio">
    <strong>
      {loading ? 'Cargando...' : error ? 'Error al cargar' : `S/ ${precio}`}
    </strong>
  </p>

  <p className="paso2">🎉 ¡Ya estarás participando en el próximo sorteo!</p>

  <div className="flecha">
     <strong>👇</strong>
  </div>
</section>

  );
};

export default RegistroInfo;
