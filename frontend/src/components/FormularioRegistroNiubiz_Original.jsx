import React, { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/FormularioRegistro.css';
import useFetch from '../hooks/useFetch';
import apiRoutes from '../apiRoutes';
import departamentosPeru from '../data/departamentos';

const FormularioRegistro = () => {
  const { data } = useFetch(apiRoutes.proximoSorteo);
  const location = useLocation();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  const [formData, setFormData] = useState({
    dni: '', nombres: '', apellidos: '', telefono: '', departamento: '', mayorEdad: false
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

  const iniciarPago = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    setErrMsg('');
    
    if (!formData.mayorEdad) {
      setErrMsg('Debes confirmar que eres mayor de edad.');
      return;
    }

    const payIntentWin = window.open('', '_blank');

    try {
      setCreating(true);
      
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
        })
      });

      const text = await res.text();
      let r = {};
      try { r = JSON.parse(text); } catch { /* puede venir texto en error */ }

      if (!res.ok) {
        payIntentWin?.close();
        setErrMsg(r?.error || `Error create (${res.status})`);
        setCreating(false);
        return;
      }

      if (!r?.sessionKey) {
        payIntentWin?.close();
        setErrMsg('Respuesta inesperada de create (sin sessionKey)');
        setCreating(false);
        return;
      }

      const sessionData = {
        sessionKey: r.sessionKey,
        merchantId: r.merchantId,
        purchaseNumber: r.purchaseNumber,
        amount: r.amountStr || r.amount,
        currency: r.currency,
        apiBase: r.apiBase,
        staticContentBase: r.staticContentBase
      };

      await cargarLibreriaNiubiz(sessionData.staticContentBase);
      const action = `${sessionData.apiBase}/api.ecommerce/v2/ecommerce/token/session/${sessionData.merchantId}/${sessionData.sessionKey}`;
      configurarCheckoutNiubiz(sessionData, action, payIntentWin);

    } catch (err) {
      payIntentWin?.close();
      setErrMsg(err.message || 'Error iniciando el pago');
    } finally {
      setCreating(false);
    }
  };

  const cargarLibreriaNiubiz = (staticContentBase) => {
    return new Promise((resolve, reject) => {
      if (window.VisanetCheckout?.configure) return resolve();

      const isSandbox = /-qas\./.test(staticContentBase);
      const SCRIPT_URL = isSandbox
        ? 'https://static-content-qas.vnforapps.com/env/sandbox/js/checkout.js'
        : 'https://static-content.vnforapps.com/v2/js/checkout.js';

      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      script.onload = () => window.VisanetCheckout?.configure
        ? resolve()
        : reject(new Error('VisanetCheckout no disponible'));
      script.onerror = () => reject(new Error('No se pudo cargar checkout.js'));
      document.head.appendChild(script);
    });
  };

  // Configurar el checkout de Niubiz según especificaciones exactas
  const configurarCheckoutNiubiz = (sessionData, action, payIntentWin) => {
    console.log('🔧 Configurando Niubiz Checkout con datos exactos del backend...');
    
    const {
      sessionKey, merchantId, purchaseNumber,
      amount, currency, apiBase, staticContentBase
    } = sessionData;

    try {
      if (!window.VisanetCheckout?.configure) {
        throw new Error('VisanetCheckout no está disponible');
      }

      // Validar campos requeridos
      if (!sessionKey || !merchantId || !purchaseNumber || !amount || !apiBase) {
        throw new Error(`Faltan campos requeridos: ${!sessionKey ? 'sessionKey ' : ''}${!merchantId ? 'merchantId ' : ''}${!purchaseNumber ? 'purchaseNumber ' : ''}${!amount ? 'amount ' : ''}${!apiBase ? 'apiBase ' : ''}`);
      }
      
      // Calcular amount con 2 decimales fijos
      const amountFixed = Number(amount).toFixed(2);
      
      // Detectar ambiente para logs
      const isSandbox = apiBase.includes('sandbox') || apiBase.includes('-qas');

      // Logs antes de configure
      console.log('🔍 CONFIGURACIÓN NIUBIZ:');
      console.log(`   🌐 apiBase (para action): ${apiBase}`);
      console.log(`   🌐 staticContentBase (solo para checkout.js): ${staticContentBase}`);
      console.log(`   🌐 Ambiente detectado: ${isSandbox ? 'SANDBOX' : 'PRODUCCIÓN'}`);
      console.log(`   ✓ action: ${action}`);
      console.log(`   ✓ merchantid: "${merchantId}" (length: ${merchantId?.length})`);
      console.log(`   ✓ sessiontoken: "${sessionKey?.substring(0, 15)}..." (length: ${sessionKey?.length})`);
      console.log(`   ✓ purchasenumber: "${purchaseNumber}" (length: ${purchaseNumber?.length})`);
      console.log(`   ✓ amount: "${amountFixed}" (original: ${amount}, type: ${typeof amount})`);
      console.log(`   ✓ currency: "${currency || 'PEN'}"`);

      window.VisanetCheckout.configure({
        action,
        merchantid: merchantId,
        sessiontoken: sessionKey,
        amount: amountFixed,
        purchasenumber: purchaseNumber,
        currency: currency || "PEN",
        channel: "web",
        timeouturl: `${window.location.origin}/payment-result?status=timeout`,
        complete: async (params) => {
          console.log('✅ Niubiz complete callback ejecutado:', params);
          setCreating(false);
          
          // Extraer transactionToken
          const transactionToken = params.transactionToken || params.tokenId;
          
          if (!transactionToken) {
            // Guardar error en sessionStorage y navegar a /pay
            sessionStorage.setItem('payResult', JSON.stringify({
              status: 'error',
              message: 'No se recibió token de transacción válido',
              timestamp: new Date().toISOString()
            }));
            navigate('/payment-result?status=error&message=' + encodeURIComponent('Token de transacción no válido'));
            return;
          }

          console.log('� Token recibido:', transactionToken.substring(0, 10) + '...');

          // Guardar datos de éxito en sessionStorage y navegar a /pay
          sessionStorage.setItem('payResult', JSON.stringify({
            status: 'success',
            transactionToken,
            purchaseNumber,
            amount: amountFixed,
            currency: currency || 'PEN',
            formData: { ...formData }, // Incluir datos del formulario para crear ticket
            timestamp: new Date().toISOString()
          }));
          
          navigate('/payment-result?status=success&message=' + encodeURIComponent('Pago procesado exitosamente'));
        },
        error: (err) => {
          console.error('❌ Niubiz error callback:', err);
          setCreating(false);
          
          // Guardar error en sessionStorage y navegar a /pay
          sessionStorage.setItem('payResult', JSON.stringify({
            status: 'error',
            message: err.errorMessage || err.message || 'Error desconocido en el pago',
            errorDetails: err,
            timestamp: new Date().toISOString()
          }));
          
          navigate('/payment-result?status=error&message=' + encodeURIComponent(err.errorMessage || err.message || 'Error desconocido en el pago'));
        },
        close: () => {
          console.log('🔒 Niubiz close callback');
          setCreating(false);
          
          // Guardar cancelación en sessionStorage y navegar a /pay
          sessionStorage.setItem('payResult', JSON.stringify({
            status: 'cancel',
            message: 'El pago fue cancelado por el usuario',
            timestamp: new Date().toISOString()
          }));
          
          navigate('/payment-result?status=cancel&message=' + encodeURIComponent('El pago fue cancelado por el usuario'));
        },
        timeout: () => {
          console.log('⏰ Niubiz timeout callback');
          setCreating(false);
          
          // Guardar timeout en sessionStorage y navegar a /pay
          sessionStorage.setItem('payResult', JSON.stringify({
            status: 'timeout',
            message: 'El tiempo para completar el pago ha expirado',
            timestamp: new Date().toISOString()
          }));
          
          navigate('/payment-result?status=timeout&message=' + encodeURIComponent('El tiempo para completar el pago ha expirado'));
        }
      });

      console.log('🚀 Abriendo VisanetCheckout...');
      // 6. Llamar VisanetCheckout.open() y verificar bloqueo de popup
      const opened = window.VisanetCheckout.open();
      
      if (opened === false) {
        console.error('❌ Pop-up bloqueado por el navegador');
        payIntentWin?.close(); // Cerrar ventana preventiva
        setCreating(false);
        setErrMsg('Popup bloqueado. Por favor, habilita las ventanas emergentes para este sitio y vuelve a intentar.');
        return;
      }
      
      if (opened === true) {
        console.log('✅ Checkout abierto exitosamente');
        payIntentWin?.close(); // Cerrar ventana preventiva ya que el widget se abrió
      }
      
    } catch (error) {
      console.error('❌ Error configurando Niubiz:', error);
      payIntentWin?.close(); // Cerrar ventana si hay error
      setCreating(false);
      setErrMsg(`Error configurando el checkout: ${error.message}`);
    }
  };

  const descargarPDF = () => {
    const doc = new jsPDF();
    const datosPago = txInfo?.ticketCompleto?.datos_pago;
    
    // Encabezado
    doc.setFontSize(18); 
    doc.text('🎫 TICKET GAME ZTORE', 20, 25);
    
    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(20, 30, 190, 30);
    
    // Información del usuario
    doc.setFontSize(14);
    doc.text('DATOS DEL PARTICIPANTE', 20, 45);
    doc.setFontSize(11);
    doc.text(`Nombre: ${formData.nombres} ${formData.apellidos}`, 20, 55);
    doc.text(`DNI: ${formData.dni}`, 20, 65);
    doc.text(`Teléfono: ${formData.telefono}`, 20, 75);
    doc.text(`Departamento: ${formData.departamento}`, 20, 85);
    doc.text(`Código de Ticket: ${ticketCode}`, 20, 95);
    
    // Información del pago (solo si hay datos completos)
    if (datosPago) {
      doc.setFontSize(14);
      doc.text('INFORMACIÓN DE PAGO', 20, 110);
      doc.setFontSize(11);
      doc.text(`ID Transacción: ${datosPago.transactionId}`, 20, 120);
      doc.text(`Código Autorización: ${datosPago.authorizationCode}`, 20, 130);
      doc.text(`Número de Compra: ${datosPago.purchaseNumber}`, 20, 140);
      doc.text(`Monto: S/ ${datosPago.amount}`, 20, 150);
      doc.text(`Moneda: ${datosPago.currency}`, 20, 160);
      doc.text(`Estado: ${datosPago.actionDescription}`, 20, 170);
      
      // Información de la tarjeta (si está disponible)
      if (datosPago.brand !== 'N/A') {
        doc.text(`Marca Tarjeta: ${datosPago.brand}`, 20, 180);
      }
      if (datosPago.cardType !== 'N/A') {
        doc.text(`Tipo Tarjeta: ${datosPago.cardType}`, 20, 190);
      }
      if (datosPago.panMask !== 'N/A') {
        doc.text(`Tarjeta: ${datosPago.panMask}`, 20, 200);
      }
      
      // Información temporal
      doc.text(`Fecha de Pago: ${datosPago.fechaPago}`, 20, 210);
      doc.text(`Hora de Pago: ${datosPago.horaPago}`, 20, 220);
      
      // Información técnica (si está disponible)
      if (datosPago.traceNumber !== 'N/A') {
        doc.text(`Número de Traza: ${datosPago.traceNumber}`, 20, 230);
      }
    } else {
      // Información básica si no hay datos completos
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, 20, 110);
      doc.text(`Hora: ${new Date().toLocaleTimeString('es-PE')}`, 20, 120);
    }
    
    // Pie de página
    doc.setFontSize(9);
    doc.text('Game Ztore - Tu oportunidad de ganar', 20, 260);
    doc.text(`Generado el: ${new Date().toLocaleString('es-PE')}`, 20, 270);
    
    // Línea separadora final
    doc.line(20, 275, 190, 275);
    
    doc.save(`Ticket_${ticketCode}.pdf`);
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
              {txInfo.reason === 'Credenciales de test'
                ? 'Simulación de pago - Configurar credenciales reales para checkout verdadero'
                : txInfo.fallbackMode 
                ? 'Simulación por error de librería - Verificar conectividad'
                : 'Modo de prueba activo'
              }
            </small>
          </div>
        )}

        {errMsg && (
          <div className="error" style={{marginBottom:10, color:'#ff6b6b'}}>
            {errMsg}
            {errMsg.includes('expirado') && (
              <div style={{marginTop: '10px'}}>
                <button 
                  type="button"
                  onClick={() => {
                    setErrMsg('');
                    setTxInfo(null);
                    console.log('🔄 Reiniciando proceso de pago...');
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
        ) : txInfo ? (
          <div className="pago-niubiz">
            {txInfo.testMode ? (
              <>
                <p>🧪 <strong>MODO DE PRUEBA NIUBIZ - MEJORADO</strong></p>
                <p>Simulando proceso de pago con Niubiz Sandbox</p>
                
                <div className="niubiz-mock-container processing">
                  <div className="test-mode-badge">TEST</div>
                  <div className="niubiz-mock-content">
                    <div className="icon">💳</div>
                    <div className="title">Botón de Pago Web</div>
                    <div className="subtitle">Niubiz Sandbox - Incluye Yape</div>
                  </div>
                </div>
                
                <div className="payment-status">
                  <p><span className="loading-spinner"></span>Procesando pago automáticamente...</p>
                  <p className="timer">⏱️ Aprobación en 4 segundos</p>
                  <p className="info-text">
                    💡 En producción (HTTPS) se abrirá el formulario web real de Niubiz con Yape
                  </p>
                </div>
              </>
            ) : (
              <div className="niubiz-processing">
                <p>💳 <strong>PROCESANDO PAGO CON NIUBIZ</strong></p>
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

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <button 
                    type="button" 
                    onClick={() => {
                      console.log('🚫 Usuario canceló el pago manualmente');
                      setTxInfo(null);
                      setCreating(false);
                      setErrMsg('');
                    }}
                    style={{
                      background: '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ❌ Cancelar pago
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} action="#" noValidate>
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
