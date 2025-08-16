import React, { useState, useEffect } from 'react';
import usePatch from '../../hooks/usePatch';
import apiRoutes from '../../apiRoutes';
import '../../styles/dashboard.css';

function formatDayMonth(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
}

const EstadoSorteo = ({ sorteo, setSorteo }) => {
  const { patchData, loading, error } = usePatch(apiRoutes.sorteos);
  const [estado, setEstado] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (sorteo?.estado_sorteo !== undefined) {
      setEstado(Boolean(sorteo.estado_sorteo));
    }
  }, [sorteo]);

  const handleGuardar = async () => {
    setMensaje('');
    if (!sorteo?.id) {
      setMensaje('❌ No hay sorteo seleccionado');
      return;
    }
    const updated = await patchData(sorteo.id, { estado_sorteo: estado });
    if (updated) {
      setSorteo(prev => ({ ...prev, estado_sorteo: updated.estado_sorteo }));
      setMensaje('✅ Estado actualizado');
    } else {
      setMensaje('❌ ' + (error || 'Error desconocido'));
    }
  };

  if (!sorteo) return <p>Cargando...</p>;

  return (
    <div className="sorteo-estado-container">
      <h3>🔘 Estado del Sorteo</h3>
      <div className="descripcion-sorteo">
  {sorteo?.nombre_sorteo} — {formatDayMonth(sorteo?.sorteo_date)}
</div>
      <label htmlFor="estado_sorteo">
        <input
          type="checkbox"
          id="estado_sorteo"
          checked={estado}
          onChange={() => setEstado(!estado)}
        />
        <span className="custom-checkbox">
          <svg viewBox="0 0 24 24">
            <path d="M20.285 6.709l-11.39 11.39-5.89-5.89 1.41-1.41 4.48 4.48 9.98-9.98z" />
          </svg>
        </span>{' '}
        Activo
      </label>
      <br />
      <button onClick={handleGuardar} disabled={loading}>
        {loading ? 'Guardando...' : 'Guardar'}
      </button>
      {mensaje && <p className="mensaje">{mensaje}</p>}
    </div>
  );
};

export default EstadoSorteo;
