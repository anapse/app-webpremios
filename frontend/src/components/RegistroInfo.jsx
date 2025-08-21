import '../styles/RegistroInfo.css';
import qrImage from '../assets/yapeqr.png';
import { useState, useEffect } from 'react';
import useFetch from '../hooks/useFetch'; // Asegúrate que el hook esté bien
import apiRoutes from '../apiRoutes'; // Debe tener la ruta '/api/configuracion'

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
      <p className="paso">PASO 1: Realiza el pago al número:</p>
      <p className="numero">912 391 502</p>

      <img src={qrImage} alt="Código QR de pago" className="qr-image" />
      <p className="detalle">A nombre de: Jesus Manuel España Duben</p>
      <p className="costo">Costo del ticket</p>
      <p className="precio">
        <strong>
          {loading ? 'Cargando...' : error ? 'Error al cargar' : `S/ ${precio}`}
        </strong>
      </p>
      <p className="paso2">
        PASO 2: Rellena el formulario con tus datos y sube tu captura de YAPE/BCP
        <br />
        Aquí abajo
      </p>
      <div className="flecha">
        <strong>&#8595;</strong>
      </div>
    </section>
  );
};

export default RegistroInfo;
