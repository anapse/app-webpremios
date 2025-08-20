import React, { useEffect, useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import '../styles/FormularioRegistro.css';
import useFetch from '../hooks/useFetch';
import apiRoutes from '../apiRoutes';
import departamentosPeru from '../data/departamentos';

const FormularioRegistro = () => {
  const { data, loading } = useFetch(apiRoutes.proximoSorteo);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  const [formData, setFormData] = useState({
    dni: '', nombres: '', apellidos: '', telefono: '', departamento: '', mayorEdad: false
  });

  const [ticketCode, setTicketCode] = useState(null);
  const [yapeQR, setYapeQR] = useState(null);
  const [deepLink, setDeepLink] = useState(null);
  const [txInfo, setTxInfo] = useState(null);
  const pollingRef = useRef(null);

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
    // cleanup del polling si desmonta
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrMsg('');
    console.log('[UI] submit');
    if (!formData.mayorEdad) return alert('Debes confirmar que eres mayor de edad.');

    try {
      setCreating(true);
      console.log('[API] POST /api/niubiz/session/create - Botón de Pago Web');
      
      // Crear sesión de pago según documentación oficial
      const res = await fetch('/api/niubiz/session/create', {
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
        })
      });

      const text = await res.text();
      let r = {};
      try { r = JSON.parse(text); } catch { /* puede venir texto en error */ }

      console.log('[API] status', res.status, 'body:', r || text);

      if (!res.ok) {
        setErrMsg(r?.error || `Error create (${res.status})`);
        setCreating(false);
        return;
      }

      if (!r?.sessionKey && !r?.testMode) {
        setErrMsg('Respuesta inesperada de create (sin sessionKey)');
        setCreating(false);
        return;
      }

      // Mostrar información de modo de prueba si aplica
      if (r.testMode) {
        console.log('🧪 MODO DE PRUEBA ACTIVADO - Configurar credenciales reales de Niubiz');
        // En modo prueba, simular pago exitoso después de 3 segundos
        setTxInfo({ 
          purchaseNumber: Date.now().toString().slice(-10), 
          transactionId: `TEST-${Date.now()}`,
          testMode: true
        });
        setTimeout(() => {
          console.log('🎭 Simulando pago exitoso...');
          procearPagoExitoso(`TEST-${Date.now()}`, `PN-${Date.now()}`);
        }, 3000);
        return;
      }

      // Cargar librería de Niubiz y configurar checkout
      try {
        await cargarLibreriaNiubiz(r.checkoutUrl);
        const purchaseNumber = Date.now().toString().slice(-10);
        
        setTxInfo({ 
          sessionKey: r.sessionKey,
          merchantId: r.merchantId,
          purchaseNumber: purchaseNumber,
          amount: r.amount,
          expirationTime: r.expirationTime
        });

        configurarCheckoutNiubiz(r, purchaseNumber);
      } catch (libError) {
        console.error('❌ Error cargando librería:', libError);
        console.log('🎭 Activando modo simulación por error de librería...');
        
        // Fallback: simular el proceso en modo sandbox
        setTxInfo({ 
          purchaseNumber: Date.now().toString().slice(-10), 
          transactionId: `FALLBACK-${Date.now()}`,
          testMode: true,
          fallbackMode: true
        });
        
        setTimeout(() => {
          console.log('🎭 Simulando pago exitoso (fallback)...');
          procearPagoExitoso(`FALLBACK-${Date.now()}`, `FB-${Date.now()}`);
        }, 3000);
        return;
      }

    } catch (err) {
      console.error('[API] create error', err);
      setErrMsg(err.message || 'Error iniciando el pago');
    } finally {
      setCreating(false);
    }
  };

  // Cargar librería de Niubiz dinámicamente
  const cargarLibreriaNiubiz = (checkoutUrl) => {
    return new Promise((resolve, reject) => {
      console.log('📦 Intentando cargar librería de Niubiz desde:', checkoutUrl);
      
      // Lista de URLs de fallback para probar
      const urlsToTry = [
        checkoutUrl,
        'https://pocpaymentserve.s3.amazonaws.com/payform.min.js',
        'https://static-content.vnforapps.com/v2/js/checkout.js',
        'https://pocpaymentserve.s3.amazonaws.com/checkout.js'
      ];

      let currentUrlIndex = 0;

      const tryLoadScript = () => {
        if (currentUrlIndex >= urlsToTry.length) {
          reject(new Error('No se pudo cargar ninguna librería de Niubiz'));
          return;
        }

        const currentUrl = urlsToTry[currentUrlIndex];
        console.log(`📥 Probando URL ${currentUrlIndex + 1}/${urlsToTry.length}: ${currentUrl}`);

        // Verificar si ya está cargado
        if (window.VisanetCheckout || window.Culqi || window.Niubiz) {
          console.log('✅ Librería ya está cargada');
          resolve();
          return;
        }

        // Limpiar scripts anteriores
        const existingScript = document.querySelector(`script[src="${currentUrl}"]`);
        if (existingScript) {
          existingScript.remove();
          console.log('🧹 Script anterior eliminado');
        }

        const script = document.createElement('script');
        script.src = currentUrl;
        script.async = true;
        script.crossOrigin = 'anonymous';
        
        script.onload = () => {
          console.log(`✅ Script cargado desde: ${currentUrl}`);
          
          // Verificar qué objeto global está disponible
          if (window.VisanetCheckout) {
            console.log('✅ VisanetCheckout disponible');
            resolve();
          } else if (window.Culqi) {
            console.log('✅ Culqi disponible (alternativo)');
            window.VisanetCheckout = window.Culqi; // Fallback
            resolve();
          } else if (window.Niubiz) {
            console.log('✅ Niubiz disponible (alternativo)');
            window.VisanetCheckout = window.Niubiz; // Fallback
            resolve();
          } else {
            console.log(`⚠️ Script cargado pero objeto no disponible, probando siguiente URL...`);
            currentUrlIndex++;
            tryLoadScript();
          }
        };
        
        script.onerror = (error) => {
          console.error(`❌ Error cargando desde ${currentUrl}:`, error);
          currentUrlIndex++;
          tryLoadScript();
        };
        
        document.head.appendChild(script);
      };

      tryLoadScript();
      
      // Timeout de seguridad
      setTimeout(() => {
        if (!window.VisanetCheckout && !window.Culqi && !window.Niubiz) {
          console.error('⏰ Timeout cargando librería de Niubiz');
          reject(new Error('Timeout cargando librería de Niubiz'));
        }
      }, 15000); // 15 segundos
    });
  };

  // Configurar el checkout de Niubiz según documentación
  const configurarCheckoutNiubiz = (sessionData, purchaseNumber) => {
    console.log('🔧 Configurando Niubiz Checkout...');
    
    window.VisanetCheckout.configure({
      sessionkey: sessionData.sessionKey,
      merchantid: sessionData.merchantId,
      purchasenumber: purchaseNumber,
      amount: sessionData.amount,
      expirationminutes: 15,
      
      // Callbacks según documentación oficial
      success: function(response) {
        console.log('✅ Pago exitoso:', response);
        procearPagoExitoso(response.transactionToken, purchaseNumber);
      },
      
      error: function(error) {
        console.error('❌ Error en el pago:', error);
        setErrMsg('Error en el proceso de pago. Intenta nuevamente.');
        setTxInfo(null);
      },
      
      close: function() {
        console.log('ℹ️ Checkout cerrado por el usuario');
        setTxInfo(null);
      }
    });

    // Abrir el checkout
    window.VisanetCheckout.open();
  };

  // Procesar pago exitoso y autorizar transacción
  const procearPagoExitoso = async (transactionToken, purchaseNumber) => {
    try {
      console.log('🔐 Autorizando transacción...');
      
      // Autorizar la transacción según documentación
      const authResponse = await fetch('/api/niubiz/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionToken,
          purchaseNumber,
          amount: data?.ticket_price ?? 15
        })
      });

      const authData = await authResponse.json();
      console.log('✅ Respuesta de autorización:', authData);

      if (authData.testMode || authData.dataMap?.ACTION_CODE === '000') {
        // Pago autorizado, crear ticket
        const save = await fetch('/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            token_yape: authData.dataMap?.TRANSACTION_ID || transactionToken,
            id_transaccion: authData.dataMap?.TRANSACTION_ID || transactionToken,
            estado_pago: 'pagado'
          })
        });
        
        const saved = await save.json().catch(() => ({}));
        console.log('[TICKET] status', save.status, saved);
        
        if (save.ok) {
          setTicketCode(saved.codigo_ticket);
          setTxInfo(null); // Limpiar información de transacción
        } else {
          setErrMsg(saved?.error || 'No se pudo registrar el ticket');
        }
      } else {
        setErrMsg('Pago no autorizado. Intenta nuevamente.');
        setTxInfo(null);
      }
      
    } catch (error) {
      console.error('❌ Error en autorización:', error);
      setErrMsg('Error procesando el pago. Intenta nuevamente.');
      setTxInfo(null);
    }
  };

  // Esta función ya no es necesaria en el flujo del Botón de Pago Web
  // El estado se maneja a través de callbacks directos
  const checkStatus = async () => {
    console.log('ℹ️ checkStatus: No se necesita polling en Botón de Pago Web');
    // Función mantenida por compatibilidad pero no se usa
  };

  const descargarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text('🎫 Ticket Game Ztore', 20, 30);
    doc.setFontSize(12);
    doc.text(`Nombre: ${formData.nombres} ${formData.apellidos}`, 20, 45);
    doc.text(`DNI: ${formData.dni}`, 20, 55);
    doc.text(`Teléfono: ${formData.telefono}`, 20, 65);
    doc.text(`Departamento: ${formData.departamento}`, 20, 75);
    doc.text(`Código de Ticket: ${ticketCode}`, 20, 85);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 95);
    doc.save(`${ticketCode}.pdf`);
  };

  return (
    <section className="registro-form">
      <div className="form-container">
        <h2>Registro de Ticket</h2>

        {/* Indicador de modo de prueba */}
        {txInfo?.testMode && (
          <div style={{
            background: 'linear-gradient(135deg, #ff7e00 0%, #e06f00 100%)',
            border: '2px solid #ff7e00',
            borderRadius: '12px',
            padding: '15px',
            marginBottom: '20px',
            color: '#1f1f1d',
            fontWeight: 'bold'
          }}>
            <strong>🧪 MODO DE PRUEBA NIUBIZ</strong>
            {txInfo.fallbackMode && (
              <>
                <br />
                <strong>⚠️ MODO FALLBACK</strong>
              </>
            )}
            <br />
            <small style={{ color: '#1f1f1d', opacity: '0.8' }}>
              {txInfo.fallbackMode 
                ? 'Simulación por error de librería - Verificar conectividad'
                : 'Simulación de pago - Configurar credenciales reales para producción'
              }
            </small>
          </div>
        )}

        {errMsg && <div className="error" style={{marginBottom:10, color:'#ff6b6b'}}>{errMsg}</div>}

        {ticketCode ? (
          <div className="resultado-ticket">
            <p>🎉 ¡Gracias por tu compra!</p>
            <p>Tu número de ticket es:</p>
            <h3>{ticketCode}</h3>
            <button onClick={descargarPDF}>Descargar ticket en PDF</button>
          </div>
        ) : txInfo ? (
          <div className="pago-niubiz">
            {txInfo.testMode ? (
              <>
                <p>🧪 <strong>SIMULACIÓN DE PAGO NIUBIZ</strong></p>
                <p>Modo de prueba - El pago se procesará automáticamente</p>
                
                <div className="niubiz-mock-container processing">
                  <div className="test-mode-badge">TEST</div>
                  <div className="niubiz-mock-content">
                    <div className="icon">�</div>
                    <div className="title">Botón de Pago Web</div>
                    <div className="subtitle">Niubiz Sandbox - Incluye Yape</div>
                  </div>
                </div>
                
                <div className="payment-status">
                  <p><span className="loading-spinner"></span>Procesando pago...</p>
                  <p className="timer">⏱️ Aprobación automática en progreso</p>
                  <p style={{ fontSize: '12px', opacity: '0.8' }}>
                    💡 En producción se abrirá el formulario web de Niubiz con opción Yape
                  </p>
                </div>
              </>
            ) : (
              <div className="niubiz-processing">
                <p>� <strong>PROCESANDO PAGO CON NIUBIZ</strong></p>
                <p>Se ha abierto el formulario de pago seguro de Niubiz</p>
                
                <div className="payment-status">
                  <p><span className="loading-spinner"></span>Esperando confirmación...</p>
                  <p style={{ fontSize: '14px', opacity: '0.8' }}>
                    Complete el pago en la ventana emergente de Niubiz
                  </p>
                  <p style={{ fontSize: '12px', opacity: '0.6' }}>
                    💳 Métodos disponibles: Tarjetas Visa/MasterCard, Yape
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input name="dni" placeholder="DNI o C. de Extranjería" value={formData.dni} onChange={handleInputChange} required />
            <input name="nombres" placeholder="Nombres" value={formData.nombres} onChange={handleInputChange} required />
            <input name="apellidos" placeholder="Apellidos" value={formData.apellidos} onChange={handleInputChange} required />
            <input name="telefono" placeholder="Número WhatsApp" value={formData.telefono} onChange={handleInputChange} required />
            <select name="departamento" value={formData.departamento} onChange={handleInputChange} required>
              <option value="">Selecciona Departamento</option>
              {departamentosPeru.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <label className="checkbox-label">
              <input type="checkbox" name="mayorEdad" checked={formData.mayorEdad} onChange={handleInputChange} />
              Confirmo que soy mayor de edad
            </label>
            <button type="submit" className="btn-yape" disabled={creating}>
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
