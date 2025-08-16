import React, { useState, useEffect } from 'react';
import usePatch from '../../hooks/usePatch';
import apiRoutes from '../../apiRoutes';
import '../../styles/dashboard.css';

const PrecioTicket = ({ sorteo, setSorteo }) => {
  const { patchData, loading, error } = usePatch(apiRoutes.sorteos);
  const [precio, setPrecio] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (sorteo?.ticket_price !== undefined) {
      setPrecio(Math.round(sorteo.ticket_price));
    }
  }, [sorteo]);

  const handleGuardar = async () => {
    setMensaje('');
    if (!sorteo?.id) {
      setMensaje('❌ No hay sorteo seleccionado');
      return;
    }
    const updated = await patchData(sorteo.id, { ticket_price: Number(precio) });
    if (updated) {
      setSorteo(prev => ({ ...prev, ticket_price: updated.ticket_price }));
      setMensaje('✅ Precio actualizado');
    } else {
      setMensaje('❌ ' + (error || 'Error desconocido'));
    }
  };

  if (!sorteo) return <p>Cargando...</p>;

  return (
    <div className="sorteo-precio-container">
      <h3>💵 Precio del Ticket</h3>
      <input
        type="number"
        value={precio}
        onChange={(e) => setPrecio(e.target.value)}
      />
      <button onClick={handleGuardar} disabled={loading}>
        {loading ? 'Guardando...' : 'Guardar'}
      </button>
      {mensaje && <p className="mensaje">{mensaje}</p>}
    </div>
  );
};

export default PrecioTicket;
