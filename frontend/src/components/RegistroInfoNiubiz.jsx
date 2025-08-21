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

  <p className="paso">📝 <strong>PASO 1:</strong> Completa tus datos en el formulario de abajo (DNI o Carnet de Extranjería).</p>

  <p className="paso">💳 <strong>PASO 2:</strong> Haz clic en <strong>Registrar Ticket</strong> para iniciar el proceso de pago seguro con Niubiz.</p>

  <p className="detalle">
    � Se generará un <strong>código QR de Yape</strong> que debes escanear con tu app Yape para completar el pago.
  </p>

  <p className="paso">🎫 <strong>PASO 3:</strong> Una vez confirmado el pago, tu ticket se generará automáticamente.</p>

  <div className="detalle">
    <p>✅ Verás tu <strong>código de ticket único</strong> en pantalla.</p>
    <p>📄 Podrás <strong>descargarlo como PDF</strong> para conservarlo.</p>
    <p>🔍 También podrás <strong>buscar tus tickets</strong> en la sección "Mis Tickets".</p>
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
