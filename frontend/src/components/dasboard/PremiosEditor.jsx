import React, { useEffect, useState } from "react";
import useFetch from "../../hooks/useFetch";
import usePost from "../../hooks/usePost";
import usePatch from "../../hooks/usePatch";
import apiRoutes from "../../apiRoutes";
import "../../styles/dashboard.css";

const PremiosEditor = ({ sorteo }) => {
  console.log("🔄 PremiosEditor - Sorteo recibido:", sorteo);
  
  const url = sorteo ? `${apiRoutes.premios}?sorteo_id=${sorteo.id}` : null;
  console.log("🌐 URL construida para premios:", url);
  
  const { data, loading, error } = useFetch(url);
  
  console.log("📦 Datos recibidos del fetch:", { data, loading, error });

  const { postData } = usePost(apiRoutes.premios);
  const { patchData } = usePatch(apiRoutes.premios);

  const [premios, setPremios] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  const generateTempId = () => Date.now() + Math.random();

  useEffect(() => {
    console.log("🔄 useEffect - Data cambió:", data);
    if (data && Array.isArray(data.premios)) {
      console.log("✅ Premios encontrados:", data.premios);
      const premiosConId = data.premios.map((p) => ({
        ...p,
        tempId: p.id || generateTempId(),
      }));
      setPremios(premiosConId);
    } else if (data) {
      console.log("⚠️ Data no contiene array de premios:", data);
      setPremios([]);
    }
  }, [data]);

  const handleChange = (index, field, value) => {
    // Validar cantidad (máximo 2 dígitos)
    if (field === "cantidad") {
      const numValue = Number(value);
      if (numValue > 99) {
        setMensaje("❌ La cantidad no puede ser mayor a 99");
        return;
      }
    }

    setPremios((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
    setMensaje("");
  };

  const handleAdd = () => {
    setPremios((prev) => [
      ...prev,
      {
        id: null,
        tempId: generateTempId(),
        nombre: "",
        descripcion: "",
        cantidad: 1,
        tipo_premio: 1,
        sorteo_id: sorteo.id,
      },
    ]);
    setMensaje("");
  };

  const handleRemove = (index) => {
    setPremios((prev) => prev.filter((_, i) => i !== index));
    setMensaje("");
  };

  const validarPremios = () => {
    for (const p of premios) {
      if (!p.nombre || p.nombre.trim() === "") {
        setMensaje("❌ El nombre es obligatorio en todos los premios");
        return false;
      }
      if (!p.cantidad || p.cantidad < 1 || p.cantidad > 99) {
        setMensaje("❌ La cantidad debe estar entre 1 y 99");
        return false;
      }
    }
    return true;
  };

const handleGuardar = async () => {
  if (!validarPremios()) return;

  setMensaje("");
  setGuardando(true);
  
  console.log("💾 Iniciando guardado de premios:", premios);
  
  try {
    const premiosActualizados = await Promise.all(
      premios.map(async (premio) => {
        const { tempId, ...payload } = premio;
        console.log(`🔄 Procesando premio ${premio.nombre}:`, { id: premio.id, payload });
        
        if (!premio.id) {
          console.log("➕ Creando nuevo premio...");
          const res = await postData(payload);
          console.log("✅ Premio creado:", res);
          return { ...premio, ...res, tempId: premio.tempId };
        } else {
          console.log("📝 Actualizando premio existente...");
          const res = await patchData(premio.id, payload);
          console.log("✅ Premio actualizado:", res);
          return premio;
        }
      })
    );

    setPremios(premiosActualizados);
    setMensaje("✅ Premios guardados correctamente");
    console.log("🎉 Todos los premios guardados exitosamente");
  } catch (err) {
    console.error("❌ Error al guardar premios:", err);
    setMensaje(`❌ Error al guardar premios: ${err.message}`);
  }
  setGuardando(false);
};



  if (!sorteo) return <p>⏳ Esperando datos del sorteo...</p>;
  if (loading) return <p>🔄 Cargando premios...</p>;
  if (error) return (
    <div className="premios-editor-container">
      <h3>🎁 Editor de Premios</h3>
      <div className="mensaje error">
        ❌ Error al cargar premios: {error}
        <br />
        <small>URL: {url}</small>
        <br />
        <button onClick={() => window.location.reload()}>🔄 Recargar página</button>
      </div>
    </div>
  );

  return (
    <div className="premios-editor-container">
      <h3>🎁 Editor de Premios</h3>
      
      {/* Debug info - remover en producción */}
      <details style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
        <summary>🔧 Debug Info</summary>
        <pre>{JSON.stringify({
          sorteoId: sorteo?.id,
          url: url,
          dataReceived: data,
          premiosCount: premios.length,
          apiBaseUrl: apiRoutes.premios
        }, null, 2)}</pre>
      </details>

      {premios.map((premio, index) => (
        <div key={premio.tempId} className="premio-item">
          {/* Columna 1: Nombre */}
          <div className="premio-columna">
            <div className="premio-columna-titulo">Nombre</div>
            <input
              type="text"
              placeholder="Ej: iPhone 15 Pro"
              value={premio.nombre}
              onChange={(e) => handleChange(index, "nombre", e.target.value)}
            />
          </div>

          {/* Columna 2: Descripción */}
          <div className="premio-columna">
            <div className="premio-columna-titulo">Descripción</div>
            <textarea
              className="descripcion"
              placeholder="Descripción detallada del premio..."
              value={premio.descripcion || ""}
              onChange={(e) => handleChange(index, "descripcion", e.target.value)}
            />
          </div>

          {/* Columna 3: Cantidad */}
          <div className="premio-columna">
            <div className="premio-columna-titulo">Cant</div>
            <input
              type="number"
              min="1"
              max="99"
              className="cantidad"
              value={premio.cantidad}
              onChange={(e) =>
                handleChange(index, "cantidad", Number(e.target.value))
              }
            />
          </div>

          {/* Columna 4: Eliminar */}
          <div className="premio-columna">
            <div className="premio-columna-titulo">&nbsp;</div>
            <button 
              className="btn-eliminar"
              onClick={() => handleRemove(index)}
              title="Eliminar premio"
            >
              ×
            </button>
          </div>
        </div>
      ))}     
      <div className="botonera">
        <button onClick={handleAdd}>➕ Agregar Premio</button>

      <button onClick={handleGuardar} disabled={guardando}>
        {guardando ? "💾 Guardando..." : "💾 Guardar Premios"}
      </button></div>
     

      {mensaje && <p className="mensaje">{mensaje}</p>}
    </div>
  );
};

export default PremiosEditor;
