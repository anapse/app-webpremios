import { useState } from 'react';
import usePost from '../../hooks/usePost';
import apiRoutes from '../../apiRoutes';
import '../../styles/dashboard.css';

export default function CrearNuevoSorteo({ precioDefault, onNuevoSorteoCreado }) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nombre, setNombre] = useState('Nuevo Sorteo');
  const [precio, setPrecio] = useState(precioDefault || 0);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [estado, setEstado] = useState(true);
  const [mensaje, setMensaje] = useState('');

  const { loading, error, postData } = usePost(apiRoutes.sorteos);

  const validarCampos = () => {
    if (!nombre.trim()) {
      setMensaje('❌ El nombre del sorteo es obligatorio');
      return false;
    }
    if (!precio || precio <= 0) {
      setMensaje('❌ El precio debe ser mayor a 0');
      return false;
    }
    if (!fecha) {
      setMensaje('❌ La fecha es obligatoria');
      return false;
    }
    return true;
  };

  const crearSorteo = async () => {
    setMensaje('');
    
    if (!validarCampos()) return;

    try {
      const nuevoSorteo = await postData({
        nombre_sorteo: nombre.trim(),
        ticket_price: parseFloat(precio),
        sorteo_date: fecha,
        ganadores_total: 0,
        estado_sorteo: estado,
      });

      if (nuevoSorteo) {
        setMensaje('✅ Sorteo creado correctamente');
        setMostrarForm(false);
        // Resetear formulario
        setNombre('Nuevo Sorteo');
        setPrecio(precioDefault || 0);
        setFecha(new Date().toISOString().slice(0, 10));
        setEstado(true);
        
        if (onNuevoSorteoCreado) onNuevoSorteoCreado(nuevoSorteo);
      }
    } catch (error) {
      setMensaje('❌ ' + error.message);
    }
  };

  const cancelar = () => {
    setMostrarForm(false);
    setMensaje('');
    // Resetear formulario
    setNombre('Nuevo Sorteo');
    setPrecio(precioDefault || 0);
    setFecha(new Date().toISOString().slice(0, 10));
    setEstado(true);
  };

  return (
    <div className="crear-sorteo-form">
      <h3>📝 Nuevo Sorteo</h3>

      {!mostrarForm ? (
        <button onClick={() => setMostrarForm(true)} className="btn-crear">
          + Crear Nuevo Sorteo
        </button>
      ) : (
        <div className="form-container">
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Nombre del sorteo"
            maxLength="100"
          />
          <input
            type="number"
            value={precio}
            onChange={e => setPrecio(e.target.value)}
            placeholder="Precio del ticket"
            min="0"
            step="0.01"
          />
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={estado}
              onChange={e => setEstado(e.target.checked)}
            />
            🔘 Activo
          </label>
          
          <div className="botones-accion">
            <button onClick={crearSorteo} disabled={loading} className="btn-guardar">
              {loading ? 'Guardando...' : '💾 Guardar'}
            </button>
            <button onClick={cancelar} disabled={loading} className="btn-cancelar">
              ❌ Cancelar
            </button>
          </div>

          {mensaje && <p className="mensaje">{mensaje}</p>}
          {error && <p className="mensaje error">❌ {error}</p>}
        </div>
      )}
    </div>
  );
}
