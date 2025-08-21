import React, { useState, useEffect } from 'react';
import './SystemConfig.css';

const SystemConfig = () => {
  const [config, setConfig] = useState({
    telefono_notificaciones: '',
    telefono_pagos: '',
    qr_pago_base64: '',
    qr_pago_url: '',
    mensaje_whatsapp_template: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [qrFile, setQrFile] = useState(null);

  // Cargar configuración actual
  const cargarConfiguracion = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      setMessage('❌ Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  // Manejar cambios en inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  // Manejar subida de imagen QR
  const handleQrUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona solo archivos de imagen');
        e.target.value = '';
        return;
      }
      
      // Validar tamaño (máximo 2MB para QR)
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen no debe superar los 2MB');
        e.target.value = '';
        return;
      }
      
      setQrFile(file);
      
      // Convertir a base64 para preview
      const reader = new FileReader();
      reader.onload = () => {
        setConfig(prev => ({ ...prev, qr_pago_base64: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Guardar configuración
  const guardarConfiguracion = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });

      const result = await response.json();
      
      if (response.ok) {
        setMessage('✅ Configuración guardada exitosamente');
        setConfig(result.config);
      } else {
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      setMessage('❌ Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="system-config">
        <div className="loading">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="system-config">
      <div className="config-header">
        <h3>⚙️ Configuración del Sistema</h3>
        <p>Administra los números de teléfono y el QR de pagos</p>
      </div>

      {message && (
        <div className={`config-message ${message.includes('❌') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <form onSubmit={guardarConfiguracion} className="config-form">
        <div className="config-sections">
          
          {/* Sección de Teléfonos */}
          <div className="config-section">
            <h4>📱 Configuración de Teléfonos</h4>
            
            <div className="form-group">
              <label htmlFor="telefono_notificaciones">
                WhatsApp para Notificaciones:
                <span className="help-text">Número donde se enviarán los tickets para verificación</span>
              </label>
              <input
                type="text"
                id="telefono_notificaciones"
                name="telefono_notificaciones"
                value={config.telefono_notificaciones}
                onChange={handleInputChange}
                placeholder="Ej: 51912391502"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefono_pagos">
                Número para Pagos:
                <span className="help-text">Número que aparecerá en el formulario para recibir pagos</span>
              </label>
              <input
                type="text"
                id="telefono_pagos"
                name="telefono_pagos"
                value={config.telefono_pagos}
                onChange={handleInputChange}
                placeholder="Ej: 51987654321"
                required
              />
            </div>
          </div>

          {/* Sección de QR */}
          <div className="config-section">
            <h4>📷 Código QR de Pago</h4>
            
            <div className="form-group">
              <label htmlFor="qr_upload">
                Subir nueva imagen QR:
                <span className="help-text">Imagen que se mostrará en el formulario de registro</span>
              </label>
              <input
                type="file"
                id="qr_upload"
                accept="image/*"
                onChange={handleQrUpload}
              />
            </div>

            {config.qr_pago_base64 && (
              <div className="qr-preview">
                <h5>Vista previa del QR:</h5>
                <img 
                  src={config.qr_pago_base64} 
                  alt="QR de pago"
                  className="qr-image"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="qr_pago_url">
                URL del QR (opcional):
                <span className="help-text">Si prefieres usar una URL en lugar de subir archivo</span>
              </label>
              <input
                type="url"
                id="qr_pago_url"
                name="qr_pago_url"
                value={config.qr_pago_url}
                onChange={handleInputChange}
                placeholder="https://ejemplo.com/qr-yape.jpg"
              />
            </div>
          </div>

          {/* Sección de Mensaje WhatsApp */}
          <div className="config-section">
            <h4>💬 Template de Mensaje WhatsApp</h4>
            
            <div className="form-group">
              <label htmlFor="mensaje_whatsapp_template">
                Plantilla del mensaje:
                <span className="help-text">
                  Variables disponibles: {'{nombres}'}, {'{apellidos}'}, {'{dni}'}, {'{telefono}'}, {'{departamento}'}, {'{codigo_ticket}'}, {'{precio}'}
                </span>
              </label>
              <textarea
                id="mensaje_whatsapp_template"
                name="mensaje_whatsapp_template"
                value={config.mensaje_whatsapp_template}
                onChange={handleInputChange}
                rows="8"
                placeholder="Escribe el template del mensaje..."
                required
              />
            </div>
          </div>
        </div>

        <div className="config-actions">
          <button 
            type="button" 
            onClick={cargarConfiguracion}
            className="btn-reload"
            disabled={saving}
          >
            🔄 Recargar
          </button>
          <button 
            type="submit" 
            className="btn-save"
            disabled={saving}
          >
            {saving ? 'Guardando...' : '💾 Guardar Configuración'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SystemConfig;
