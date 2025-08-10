import React, { useState, useEffect } from 'react';
import usePatch from '../../hooks/usePatch'; 
import apiRoutes from '../../apiRoutes';
import '../../styles/dashboard.css';

const NombreSorteo = ({ sorteo, setSorteo }) => {
 
  const { patchData, loading, error } = usePatch(
    sorteo ? apiRoutes.sorteoById(sorteo.id) : null
  );

  const [nombre, setNombre] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    console.log('Sorteo data:', sorteo);
    if (sorteo?.nombre_sorteo) setNombre(sorteo.nombre_sorteo);
  }, [sorteo]);

  const handleGuardar = async () => {
    setMensaje('');
    if (!nombre.trim()) {
      setMensaje('❌ El nombre no puede estar vacío');
      return;
    }
    const updated = await patchData({ nombre_sorteo: nombre.trim() });
    if (updated) {
      setSorteo(prev => ({ ...prev, nombre_sorteo: updated.nombre_sorteo }));
      setMensaje('✅ Nombre actualizado');
    } else {
      setMensaje('❌ ' + (error || 'Error desconocido'));
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="sorteo-nombre-container">
      <h3>🏷 Nombre del Sorteo</h3>
      <input
        type="text"
        value={nombre}
        onChange={(e) => {
          setNombre(e.target.value);
          setMensaje('');
        }}
      />
      <button onClick={handleGuardar} disabled={ loading}>
        {loading ? 'Guardando...' : 'Guardar'}
      </button>
      {mensaje && <p className="mensaje">{mensaje}</p>}
    </div>
  );
};

export default NombreSorteo;
