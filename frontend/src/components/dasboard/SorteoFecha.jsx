import React, { useState, useEffect } from 'react';
import usePatch from '../../hooks/usePatch';
import apiRoutes from '../../apiRoutes';

const SorteoFecha = ({ sorteo, setSorteo }) => {
  const [fecha, setFecha] = useState(sorteo?.sorteo_date?.split('T')[0] || '');
  const { patchData, loading, error } = usePatch(apiRoutes.sorteos);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (sorteo?.sorteo_date) setFecha(sorteo.sorteo_date.split('T')[0]);
  }, [sorteo]);

  const handleGuardar = async () => {
    setMensaje('');
    if (!sorteo?.id) {
      setMensaje('❌ No hay sorteo seleccionado');
      return;
    }
    const result = await patchData(sorteo.id, { sorteo_date: new Date(fecha).toISOString() });
    if (result) {
      setSorteo(prev => ({ ...prev, sorteo_date: new Date(fecha).toISOString() }));
      setMensaje('✅ Fecha actualizada');
    } else {
      setMensaje('❌ ' + (error || 'Error desconocido'));
    }
  };

  return (
    <div className="sorteo-fecha-container">
      <h3>📅 Fecha del Sorteo</h3>
      <input
        type="date"
        value={fecha}
        onChange={e => setFecha(e.target.value)}
      />
      <button onClick={handleGuardar} disabled={loading}>
        {loading ? 'Guardando...' : 'Guardar'}
      </button>
      {mensaje && <p className="mensaje">{mensaje}</p>}
    </div>
  );
};

export default SorteoFecha;
