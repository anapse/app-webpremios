import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import '../styles/FormularioRegistro.css';
import useFetch from '../hooks/useFetch';
import apiRoutes from '../apiRoutes';
import departamentosPeru from '../data/departamentos';

const FormularioRegistro = () => {
  const { data, loading, error } = useFetch(apiRoutes.proximoSorteo);
  const { data: config, loading: configLoading } = useFetch('/api/config');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  
  const [formData, setFormData] = useState({
    dni: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    departamento: '',
    mayorEdad: false
  });
  
  const [comprobante, setComprobante] = useState(null);
  const [ticketCode, setTicketCode] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    if (!data || !data.sorteo_date) return;

    const target = new Date(data.sorteo_date);

    const timer = setInterval(() => {
      const now = new Date();
      const diff = target - now;

      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      setTimeLeft({ days, hours, mins, secs });
    }, 1000);

    return () => clearInterval(timer);
  }, [data]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona solo archivos de imagen');
        e.target.value = '';
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar los 5MB');
        e.target.value = '';
        return;
      }
      
      setComprobante(file);
    }
  };

  const enviarPorWhatsApp = (ticketData) => {
    // Usar template desde configuración o fallback
    let mensaje = config?.mensaje_whatsapp_template || 
      `🎫 *NUEVO TICKET REGISTRADO*\n\n` +
      `*Datos del participante:*\n` +
      `👤 Nombre: {nombres} {apellidos}\n` +
      `🆔 DNI: {dni}\n` +
      `📱 WhatsApp: {telefono}\n` +
      `📍 Departamento: {departamento}\n` +
      `🎟️ Código de ticket: {codigo_ticket}\n` +
      `💰 Monto: S/ {precio}\n\n` +
      `⚠️ *TICKET PENDIENTE DE ACTIVACIÓN*\n` +
      `El ticket está desactivado hasta verificar el comprobante.\n\n` +
      `#GameZtore #Ticket #{codigo_ticket}`;

    // Reemplazar variables en el template
    mensaje = mensaje
      .replace(/{nombres}/g, formData.nombres)
      .replace(/{apellidos}/g, formData.apellidos)
      .replace(/{dni}/g, formData.dni)
      .replace(/{telefono}/g, formData.telefono)
      .replace(/{departamento}/g, formData.departamento)
      .replace(/{codigo_ticket}/g, ticketData.codigo_ticket)
      .replace(/{precio}/g, data?.ticket_price || 15);

    // Usar número desde configuración o fallback
    const numeroWhatsApp = config?.telefono_notificaciones || '51912391502';
    const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
    
    // Abrir WhatsApp en nueva ventana
    window.open(urlWhatsApp, '_blank');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.mayorEdad) {
      alert('Debes confirmar que eres mayor de edad');
      return;
    }
    
    if (!comprobante) {
      alert('Debes subir el comprobante de pago');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('Registrando ticket...');

    try {
      // Convertir imagen a base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Image = reader.result;
        
        // Registrar ticket con estado "pendiente"
        const ticketResponse = await fetch('/api/tickets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            comprobante_base64: base64Image,
            estado_pago: 'pendiente', // Estado pendiente hasta activación manual
            id_transaccion: `MANUAL_${Date.now()}`,
            token_yape: `MANUAL_${formData.dni}_${Date.now()}`
          })
        });

        const ticketData = await ticketResponse.json();
        
        if (ticketResponse.ok) {
          setTicketCode(ticketData.codigo_ticket);
          setSubmitMessage('✅ Ticket registrado exitosamente');
          
          // Enviar datos por WhatsApp
          setTimeout(() => {
            enviarPorWhatsApp(ticketData);
          }, 1000);
          
        } else {
          setSubmitMessage(`❌ Error: ${ticketData.error || 'No se pudo registrar el ticket'}`);
        }
      };
      
      reader.readAsDataURL(comprobante);
      
    } catch (error) {
      console.error('Error al registrar ticket:', error);
      setSubmitMessage('❌ Error de conexión. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const descargarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('🎫 Ticket Game Ztore', 20, 30);
    doc.setFontSize(12);
    doc.text(`Nombre: ${formData.nombres} ${formData.apellidos}`, 20, 45);
    doc.text(`DNI: ${formData.dni}`, 20, 55);
    doc.text(`Teléfono: ${formData.telefono}`, 20, 65);
    doc.text(`Departamento: ${formData.departamento}`, 20, 75);
    doc.text(`Código de Ticket: ${ticketCode}`, 20, 85);
    doc.text(`Estado: PENDIENTE DE ACTIVACIÓN`, 20, 95);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 105);
    doc.save(`${ticketCode}_PENDIENTE.pdf`);
  };

  return (
    <section className="registro-form">
      <div className="form-container">
        <h2>Registro de Ticket</h2>

        {ticketCode ? (
          <div className="resultado-ticket">
            <p>🎉 ¡Ticket registrado exitosamente!</p>
            <p>Tu número de ticket es:</p>
            <h3>{ticketCode}</h3>
            <div className="ticket-status">
              <p className="pending-status">⏳ ESTADO: PENDIENTE DE ACTIVACIÓN</p>
              <p className="info-text">
                Tu ticket será activado después de verificar el comprobante de pago.<br/>
                Te notificaremos por WhatsApp cuando esté listo.
              </p>
            </div>
            <button onClick={descargarPDF} className="btn-download">
              📄 Descargar PDF (Pendiente)
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {submitMessage && (
              <div className={`submit-message ${submitMessage.includes('❌') ? 'error' : 'success'}`}>
                {submitMessage}
              </div>
            )}
            
            <input 
              name="dni"
              placeholder="DNI o C. de Extranjería" 
              value={formData.dni}
              onChange={handleInputChange}
              required 
            />
            <input 
              name="nombres"
              placeholder="Nombres" 
              value={formData.nombres}
              onChange={handleInputChange}
              required 
            />
            <input 
              name="apellidos"
              placeholder="Apellidos" 
              value={formData.apellidos}
              onChange={handleInputChange}
              required 
            />
            <input 
              name="telefono"
              placeholder="Número WhatsApp" 
              value={formData.telefono}
              onChange={handleInputChange}
              required 
            />
            <select 
              name="departamento"
              value={formData.departamento}
              onChange={handleInputChange}
              required
            >
              <option value="">Selecciona Departamento</option>
              {departamentosPeru.map((departamento) => (
                <option key={departamento} value={departamento}>
                  {departamento}
                </option>
              ))}
            </select>
            
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                name="mayorEdad"
                checked={formData.mayorEdad}
                onChange={handleInputChange}
                required 
              />
              Confirmo que soy mayor de edad
            </label>
            
            <div className="file-upload">
              <label htmlFor="comprobante">
                📷 Subir comprobante de pago (YAPE/BCP):
              </label>
              <input 
                type="file" 
                id="comprobante"
                accept="image/*" 
                onChange={handleFileChange}
                required 
              />
              {comprobante && (
                <p className="file-selected">✅ Archivo seleccionado: {comprobante.name}</p>
              )}
            </div>
            
            <button 
              type="submit" 
              className="btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : '🚀 Enviar Registro'}
            </button>
          </form>
        )}

        <div className="contador">
          {[
            { key: 'days', label: 'Días' },
            { key: 'hours', label: 'Horas' },
            { key: 'mins', label: 'Minutos' },
            { key: 'secs', label: 'Segundos' },
          ].map(({ key, label }) => (
            <div key={key} className="unidad">
              <div className="numero">{String(timeLeft[key]).padStart(2, '0')}</div>
              <div className="texto">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FormularioRegistro;
