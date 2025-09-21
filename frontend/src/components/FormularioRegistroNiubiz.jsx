import React, { useEffect, useState, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/FormularioRegistro.css';
import useFetch from '../hooks/useFetch';
import apiRoutes, { API_BASE_URL } from '../apiRoutes';
import departamentosPeru from '../data/departamentos';

const FormularioRegistro = () => {
  const { data } = useFetch(apiRoutes.proximoSorteo);
  const location = useLocation();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  const [formData, setFormData] = useState({
    dni: '', 
    nombres: '', 
    apellidos: '', 
    telefono: '', 
    email: '',
    departamento: '', 
    mayorEdad: false
  });

  const [ticketCode, setTicketCode] = useState(null);
  const [creating, setCreating] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    if (!data?.sorteo_date) return;
    const target = new Date(data.sorteo_date);
    const t = setInterval(() => {
      const diff = target - new Date();
      if (diff <= 0) return clearInterval(t), setTimeLeft({ days:0,hours:0,mins:0,secs:0 });
      const days = Math.floor(diff/86400000);
      const hours = Math.floor((diff/3600000)%24);
      const mins = Math.floor((diff/60000)%60);
      const secs = Math.floor((diff/1000)%60);
      setTimeLeft({ days, hours, mins, secs });
    }, 1000);
    return () => clearInterval(t);
  }, [data]);

  useEffect(() => {
    if (location.state?.error) {
      setErrMsg(location.state.error);
    }
    if (location.state?.message) {
      setErrMsg(location.state.message);
    }
    if (location.state?.ticketCode) {
      setTicketCode(location.state.ticketCode);
    }
  }, [location.state]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    iniciarPago(e);
  };

  // Función para cargar y configurar el widget de Niubiz correctamente
  const cargarLibreriaNiubiz = (staticContentBase) => {
    return new Promise((resolve, reject) => {
      console.log('🔧 Verificando si VisanetCheckout ya está disponible...');
      if (window.VisanetCheckout?.configure) {
        console.log('✅ VisanetCheckout ya disponible, resolviendo.');
        return resolve();
      }

      const isSandbox = /-qas\./.test(staticContentBase);
      console.log('🌐 Detectado ambiente:', isSandbox ? 'SANDBOX' : 'PRODUCCIÓN');
      const SCRIPT_URL = isSandbox
        ? 'https://static-content-qas.vnforapps.com/env/sandbox/js/checkout.js'
        : 'https://static-content.vnforapps.com/v2/js/checkout.js';
      console.log('📥 URL del script:', SCRIPT_URL);

      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      script.onload = () => {
        console.log('📦 Script cargado, verificando VisanetCheckout...');
        if (window.VisanetCheckout?.configure) {
          console.log('✅ VisanetCheckout disponible.');
          resolve();
        } else {
          console.log('❌ VisanetCheckout no disponible después de cargar script.');
          reject(new Error('VisanetCheckout no disponible después de cargar el script'));
        }
      };
      script.onerror = (e) => {
        console.log('❌ Error cargando script:', e);
        reject(new Error(`No se pudo cargar checkout.js desde ${SCRIPT_URL}`));
      };
      console.log('🔗 Añadiendo script al head...');
      document.head.appendChild(script);
    });
  };

  const configurarCheckoutNiubiz = (sessionData) => {
    const {
      sessionKey, merchantId, purchaseNumber,
      amountStr, currency, action, timeoutUrl
    } = sessionData;

    try {
      if (!window.VisanetCheckout?.configure) {
        throw new Error('VisanetCheckout no está disponible');
      }

      if (!sessionKey || !merchantId || !purchaseNumber || !amountStr || !action) {
        throw new Error('Faltan campos requeridos para el checkout');
      }
      
      console.log('🎯 Configurando VisanetCheckout con:', {
        action,
        sessiontoken: sessionKey,
        merchantid: merchantId,
        purchasenumber: purchaseNumber,
        amount: amountStr,
        currency: currency || "PEN",
        channel: "web",
        timeouturl: timeoutUrl
      });

      // Configurar según documentación oficial de Niubiz
      window.VisanetCheckout.configure({
        action: action, // URL donde Niubiz enviará la respuesta POST
        sessiontoken: sessionKey,
        channel: "web", 
        merchantid: merchantId,
        purchasenumber: purchaseNumber,
        amount: amountStr,
        currency: currency || "PEN",
        expirationminutes: 15,
        timeouturl: timeoutUrl,
        merchantlogo: 'https://gameztorepremios.com/gameztore.svg',
        merchantname: 'Gameztore Premios',
        formbuttoncolor: '#FF0000',
        showamount: 'TRUE',
        buttoncolor: 'NAVY',
        buttonsize: 'DEFAULT',
        // Configuraciones adicionales para captura de CVV
        cvv: 'TRUE',
        securitycode: 'TRUE',
        authcomplete: 'TRUE',
        // Campo requerido: País del cliente en formato ISO 3166 (2 dígitos)
        cardholdercountry: 'PE', // Perú en formato ISO 3166
        // Configuraciones específicas para sandbox
        environment: 'sandbox',
        // Callbacks adicionales para detectar método de pago
        ready: function() {
          console.log('🔧 Widget de Niubiz listo');
        },
        close: function() {
          console.log('🚪 Widget cerrado por usuario');
          setCreating(false);
        },
        complete: function(params) {
          console.log('✅ Pago completado exitosamente desde widget:', params);
          console.log('🔍 Analizando tipo de pago...');
          
          // Intentar detectar el método de pago usado
          const paymentMethod = params.paymentMethod || params.method || 'unknown';
          console.log('💳 Método de pago detectado:', paymentMethod);
          
          setCreating(false);
          
          const transactionToken = params.transactionToken || params.tokenId;
          const customerEmail = params.customerEmail || formData.email;
          
          if (!transactionToken) {
            sessionStorage.setItem('payResult', JSON.stringify({
              status: 'error',
              message: 'No se recibió token de transacción válido del widget',
              timestamp: new Date().toISOString()
            }));
            navigate('/pay');
            return;
          }

          console.log('🔄 Redirigiendo a página de resultados...');
          navigate('/pay');
        },
        error: function(err) {
          console.error('❌ Error en el widget de Niubiz:', err);
          setCreating(false);
          const msg = err?.message || 'Error desconocido en el proceso de pago';
          setErrMsg(`Error en el widget de pago: ${msg}`);
        }
      });

      console.log('🚀 Abriendo widget de Niubiz...');
      const opened = window.VisanetCheckout.open();
      
      if (opened === false) {
        console.error('❌ Widget bloqueado - popup no se pudo abrir');
        setCreating(false);
        setErrMsg('Popup bloqueado. Por favor, habilita las ventanas emergentes para este sitio y vuelve a intentar.');
        return;
      } else {
        console.log('✅ Widget abierto exitosamente');
        // No setting setCreating(false) aquí porque el widget está en proceso
      }
      
    } catch (error) {
      console.error('❌ Error configurando el widget:', error);
      setCreating(false);
      setErrMsg(`Error configurando el widget de pago: ${error.message}`);
    }
  };

  const iniciarPago = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    setErrMsg('');
    
    if (!formData.mayorEdad) {
      setErrMsg('Debes confirmar que eres mayor de edad.');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      setErrMsg('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    try {
      setCreating(true);
      
      // Paso 1: Crear sesión según documentación Niubiz
      console.log('📡 Paso 1: Creando sesión de pago según documentación...');
      console.log('🌐 URL de sesión:', apiRoutes.niubizSession);
      console.log('📦 Datos a enviar:', {
        amount: data?.ticket_price ?? 15,
        currency: 'PEN',
        customer: { 
          dni: formData.dni,
          email: formData.email, 
          telefono: formData.telefono,
          ciudad: formData.departamento || 'Lima',
          direccion: 'Av Jose Pardo 831',
          codigoPostal: '15074'
        },
      });
      
      const res = await fetch(apiRoutes.niubizSession, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: data?.ticket_price ?? 15,
          currency: 'PEN',
          customer: { 
            dni: formData.dni,
            email: `${formData.dni}@gameztore.com`, 
            telefono: formData.telefono,
            ciudad: formData.departamento || 'Lima',
            direccion: 'Av Jose Pardo 831',
            codigoPostal: '15074'
          },
          // Agregar datos del formulario para preservarlos
          formData: { ...formData }
        })
      });

      const text = await res.text();
      let r = {};
      try { r = JSON.parse(text); } catch { /* puede venir texto en error */ }

      if (!res.ok) {
        const errorText = r?.error || `Error create (${res.status})`;
        console.error('❌ Error del servidor:', errorText);
        setErrMsg(errorText);
        setCreating(false);
        return;
      }

      console.log('✅ Respuesta del servidor exitosa:', r);

      if (!r?.sessionKey) {
        console.error('❌ Respuesta sin sessionKey:', r);
        setErrMsg('Respuesta inesperada de create (sin sessionKey)');
        setCreating(false);
        return;
      }

      console.log('✅ Sesión creada exitosamente:', r);

      // Verificar que recibimos todos los datos necesarios
      if (!r.sessionKey || !r.action) {
        setErrMsg('Respuesta incompleta del servidor. Faltan datos para el widget.');
        setCreating(false);
        return;
      }

      const sessionData = {
        sessionKey: r.sessionKey,
        merchantId: r.merchantId,
        purchaseNumber: r.purchaseNumber,
        amountStr: r.amountStr || r.amount,
        currency: r.currency,
        action: r.action, // URL donde el widget enviará la respuesta
        timeoutUrl: r.timeoutUrl,
        staticContentBase: r.staticContentBase
      };

      console.log('🔧 Preparando apertura del widget con datos:', sessionData);

      // Cargar y configurar el widget de Niubiz
      console.log('📦 Cargando librería de Niubiz...');
      await cargarLibreriaNiubiz(sessionData.staticContentBase);
      
      console.log('⚙️ Configurando y abriendo widget...');
      configurarCheckoutNiubiz(sessionData);

    } catch (err) {
      setErrMsg(err.message || 'Error iniciando el pago');
      setCreating(false);
    }
  };

  const descargarPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18); 
    doc.text('🎫 TICKET GAME ZTORE', 20, 25);
    
    doc.setLineWidth(0.5);
    doc.line(20, 30, 190, 30);
    
    doc.setFontSize(14);
    doc.text('DATOS DEL PARTICIPANTE', 20, 45);
    doc.setFontSize(11);
    doc.text(`Nombre: ${formData.nombres} ${formData.apellidos}`, 20, 55);
    doc.text(`DNI: ${formData.dni}`, 20, 65);
    doc.text(`Teléfono: ${formData.telefono}`, 20, 75);
    doc.text(`Departamento: ${formData.departamento}`, 20, 85);
    doc.text(`Código de Ticket: ${ticketCode}`, 20, 95);
    
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, 20, 110);
    doc.text(`Hora: ${new Date().toLocaleTimeString('es-PE')}`, 20, 120);
    
    doc.setFontSize(9);
    doc.text('Game Ztore - Tu oportunidad de ganar', 20, 260);
    doc.text(`Generado el: ${new Date().toLocaleString('es-PE')}`, 20, 270);
    
    doc.line(20, 275, 190, 275);
    
    doc.save(`Ticket_${ticketCode}.pdf`);
  };

  return (
    <section className="registro-form">
      <div className="form-container">
        <h2>Registro de Ticket</h2>

        {errMsg && (
          <div className="error" style={{marginBottom:10, color:'#ff6b6b'}}>
            {errMsg}
            {errMsg.includes('expirado') && (
              <div style={{marginTop: '10px'}}>
                <button 
                  type="button"
                  onClick={() => {
                    setErrMsg('');
                  }}
                  style={{
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  🔄 Intentar nuevamente
                </button>
              </div>
            )}
          </div>
        )}

        {ticketCode ? (
          <div className="resultado-ticket">
            <p>🎉 ¡Gracias por tu compra!</p>
            <p>Tu número de ticket es:</p>
            <h3>{ticketCode}</h3>
            <button onClick={descargarPDF}>Descargar ticket en PDF</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} action="#" noValidate>
            <input name="dni" placeholder="DNI o C. de Extranjería" value={formData.dni} onChange={handleInputChange} required />
            <input name="nombres" placeholder="Nombres" value={formData.nombres} onChange={handleInputChange} required />
            <input name="apellidos" placeholder="Apellidos" value={formData.apellidos} onChange={handleInputChange} required />
            <input name="telefono" placeholder="Número WhatsApp" value={formData.telefono} onChange={handleInputChange} required />
            <input name="email" type="email" placeholder="Correo electrónico" value={formData.email} onChange={handleInputChange} required />
            <select name="departamento" value={formData.departamento} onChange={handleInputChange} required>
              <option value="">Selecciona Departamento</option>
              {departamentosPeru.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <label className="checkbox-label">
              <input type="checkbox" name="mayorEdad" checked={formData.mayorEdad} onChange={handleInputChange} />
              Confirmo que soy mayor de edad
            </label>
            <button type="button" className="btn-yape" disabled={creating} onClick={iniciarPago}>
              {creating ? 'Iniciando pago seguro...' : 'Pagar con Niubiz (incluye Yape)'}
            </button>
          </form>
        )}

        <div className="contador">
          {['days','hours','mins','secs'].map((k) => (
            <div key={k} className="unidad">
              <div className="numero">{String(timeLeft[k]).padStart(2,'0')}</div>
              <div className="texto">
                {k==='days'?'Días':k==='hours'?'Horas':k==='mins'?'Minutos':'Segundos'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FormularioRegistro;
