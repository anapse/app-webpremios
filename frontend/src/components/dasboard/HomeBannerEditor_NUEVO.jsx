import React, { useState, useEffect } from 'react';
import useFetch from '../../hooks/useFetch';
import usePost from '../../hooks/usePost';
import apiRoutes from '../../apiRoutes';
import './HomeBannerEditor.css';

const HomeBannerEditor = () => {
  const { data, loading, error, refetch } = useFetch(apiRoutes.homeBanner);
  const [banner, setBanner] = useState({
    titulo: '',
    descripcion: '',
    imagen_url: '',
    imagen_base64: ''
  });
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    console.log('🔍 Hook useFetch - Estado actual:', { data, loading, error });
    if (data?.banner) {
      console.log('✅ Banner recibido:', data.banner);
      setBanner(data.banner);
    }
  }, [data]);

  const handleChange = (field, value) => {
    setBanner(prev => ({
      ...prev,
      [field]: value
    }));
    setMensaje('');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validación de tamaño más estricta - 2MB max para banners
      if (file.size > 2 * 1024 * 1024) {
        setMensaje('❌ La imagen debe ser menor a 2MB. Actual: ' + (file.size / 1024 / 1024).toFixed(1) + 'MB');
        e.target.value = ''; // Limpiar input
        return;
      }

      // Validación de tipo de archivo
      if (!file.type.startsWith('image/')) {
        setMensaje('❌ Solo se permiten archivos de imagen');
        e.target.value = ''; // Limpiar input
        return;
      }

      setMensaje('🔄 Procesando imagen...');
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;
        
        // Verificar tamaño del base64 (aproximadamente 1.37x el tamaño original)
        const base64Size = base64.length * 0.75; // Tamaño aproximado en bytes
        if (base64Size > 2 * 1024 * 1024) {
          setMensaje('❌ La imagen codificada es demasiado grande. Intenta con una imagen más pequeña.');
          e.target.value = ''; // Limpiar input
          return;
        }
        
        setBanner(prev => ({
          ...prev,
          imagen_base64: base64,
          imagen_url: '' // Limpiar URL cuando se sube archivo
        }));
        setMensaje('✅ Imagen cargada correctamente (' + (file.size / 1024).toFixed(0) + 'KB)');
      };
      
      reader.onerror = () => {
        setMensaje('❌ Error al leer la imagen');
        e.target.value = ''; // Limpiar input
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleGuardar = async () => {
    if (!banner.titulo.trim()) {
      setMensaje('❌ El título es obligatorio');
      return;
    }

    setGuardando(true);
    setMensaje('');

    try {
      console.log('🔄 Enviando datos del banner:', banner);
      console.log('🔄 URL del API:', apiRoutes.homeBanner);
      
      const response = await fetch(apiRoutes.homeBanner, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(banner)
      });

      console.log('📡 Respuesta del servidor:', response.status, response.statusText);
      
      const result = await response.json();
      console.log('📦 Datos recibidos:', result);
      
      if (response.ok) {
        setMensaje('✅ Banner guardado correctamente');
        setBanner(result.banner);
        refetch(); // Actualizar datos
      } else {
        console.error('❌ Error del servidor:', result);
        setMensaje(`❌ Error: ${result.error || 'Error desconocido'}`);
      }
    } catch (err) {
      console.error('❌ Error al guardar banner:', err);
      setMensaje(`❌ Error al guardar banner: ${err.message}`);
    }

    setGuardando(false);
  };

  if (loading) return <div className="loading">🔄 Cargando banner...</div>;
  if (error) return (
    <div className="banner-editor-container">
      <h3>🖼️ Editor de Banner Principal</h3>
      <div className="mensaje error">
        ⚠️ El banner no está disponible en este momento. 
        <br />
        <small>Es necesario ejecutar el script de base de datos para esta funcionalidad.</small>
      </div>
    </div>
  );

  return (
    <div className="banner-editor-container">
      <h3>🖼️ Editor de Banner Principal</h3>
      <p className="editor-description">
        Configura el banner principal que se muestra en la página de inicio
      </p>

      <div className="banner-form">
        <div className="form-group">
          <label htmlFor="titulo">
            Título del Banner *
          </label>
          <input
            id="titulo"
            type="text"
            placeholder="Ej: ¡Gana Increíbles Premios!"
            value={banner.titulo}
            onChange={(e) => handleChange('titulo', e.target.value)}
            maxLength="200"
          />
        </div>

        <div className="form-group">
          <label htmlFor="descripcion">
            Descripción
          </label>
          <textarea
            id="descripcion"
            placeholder="Descripción del sorteo que aparecerá en el banner..."
            value={banner.descripcion || ''}
            onChange={(e) => handleChange('descripcion', e.target.value)}
            rows="3"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="imagen_url">
              URL de Imagen del Banner
            </label>
            <input
              id="imagen_url"
              type="url"
              placeholder="https://ejemplo.com/banner.jpg"
              value={banner.imagen_url || ''}
              onChange={(e) => handleChange('imagen_url', e.target.value)}
            />
            <small className="form-help">
              💡 Opción 1: Usa URLs de imágenes externas (más rápido)
              <br />
              📐 Tamaño ideal: 1200x400px | 🌐 Ejemplos: Unsplash, Imgur, etc.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="imagen_file">
              O Subir Imagen
            </label>
            <input
              id="imagen_file"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
            />
            <small className="form-help">
              📏 Máximo 2MB | 🖼️ Formatos: JPG, PNG, WEBP | 📐 Recomendado: 1200x400px
              <br />
              ⚠️ <strong>Nota:</strong> Si da error 413, usa URLs de imagen mientras configuramos nginx
            </small>
          </div>
        </div>

        {/* Vista previa del banner */}
        {(banner.imagen_url || banner.imagen_base64) && (
          <div className="banner-preview">
            <h4>Vista Previa del Banner:</h4>
            <div className="preview-container">
              <img 
                src={banner.imagen_base64 || banner.imagen_url}
                alt="Preview del banner"
                className="banner-preview-img"
                onError={(e) => {
                  e.target.src = '/placeholder-banner.svg';
                }}
              />
              <div className="banner-overlay">
                <h2 className="banner-title">{banner.titulo}</h2>
                {banner.descripcion && (
                  <p className="banner-description">{banner.descripcion}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="banner-actions">
          <button 
            onClick={handleGuardar} 
            disabled={guardando}
            className="btn-save"
          >
            {guardando ? '💾 Guardando...' : '💾 Guardar Banner'}
          </button>
        </div>

        {mensaje && <div className="mensaje">{mensaje}</div>}
      </div>
    </div>
  );
};

export default HomeBannerEditor;
