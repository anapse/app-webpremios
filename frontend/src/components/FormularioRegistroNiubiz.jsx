import React, { useEffect, useState } from 'react';
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

  // Estado para datos de denuncia
  const [denunciaData, setDenunciaData] = useState({
    numeroPedido: '',
    fechaHoraPedido: '',
    descripcionDenegacion: '',
    ipUsuario: ''
  });

  const [ticketCode, setTicketCode] = useState(null);
  const [txInfo, setTxInfo] = useState(null);

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

  // Obtener IP del usuario al cargar el componente
  useEffect(() => {
    obtenerIPUsuario();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  // Función para manejar cambios en el formulario de denuncia
  const handleDenunciaChange = (e) => {
    const { name, value } = e.target;
    setDenunciaData(p => ({ ...p, [name]: value }));
  };

  // Función para guardar datos de denuncia
  const guardarDenuncia = async (errorInfo) => {
    try {
      // Obtener IP antes de guardar
      const ip = await obtenerIPUsuario();
      
      // Preparar datos de denuncia
      const datosDenuncia = {
        ...denunciaData,
        numeroPedido: txInfo?.purchaseNumber || 'NO_DISPONIBLE',
        fechaHoraPedido: new Date().toISOString(),
        descripcionDenegacion: errorInfo.errorMessage || errorInfo.message || 'Error en proceso de pago',
        ipUsuario: ip,
        // Datos adicionales del usuario
        usuarioDni: formData.dni,
        usuarioNombres: formData.nombres,
        usuarioApellidos: formData.apellidos,
        usuarioTelefono: formData.telefono,
        // Información técnica del error
        sessionKey: txInfo?.sessionKey?.substring(0, 10) + '...' || 'NO_DISPONIBLE',
        merchantId: txInfo?.merchantId || 'NO_DISPONIBLE',
        amount: txInfo?.amount || 'NO_DISPONIBLE',
        errorCode: errorInfo.errorCode || 'UNKNOWN',
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      };

      console.log('💾 Guardando datos de denuncia:', datosDenuncia);

      // Enviar al backend para guardar en base de datos
      const response = await fetch(apiRoutes.libroReclamaciones, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'DENUNCIA_PAGO',
          datos: datosDenuncia,
          estado: 'PENDIENTE'
        })
      });

      if (response.ok) {
        const resultado = await response.json();
        console.log('✅ Denuncia guardada exitosamente:', resultado);
        return resultado;
      } else {
        console.error('❌ Error guardando denuncia:', response.status);
        return null;
      }
    } catch (error) {
      console.error('❌ Error en guardarDenuncia:', error);
      return null;
    }
  };

  // Función para obtener la IP dinámica del usuario
  const obtenerIPUsuario = async () => {
    try {
      // Intentar múltiples servicios para obtener la IP
      const servicios = [
        'https://api.ipify.org?format=json',
        'https://ipapi.co/json/',
        'https://httpbin.org/ip'
      ];

      for (const servicio of servicios) {
        try {
          const response = await fetch(servicio);
          const data = await response.json();
          
          // Extraer IP según el formato de respuesta de cada servicio
          const ip = data.ip || data.origin || data.query;
          if (ip) {
            console.log('🌐 IP obtenida:', ip);
            setDenunciaData(prev => ({ ...prev, ipUsuario: ip }));
            return ip;
          }
        } catch (error) {
          console.warn(`⚠️ Error obteniendo IP de ${servicio}:`, error);
          continue;
        }
      }
      
      // Si no se pudo obtener, usar una IP local como fallback
      console.warn('⚠️ No se pudo obtener IP externa, usando fallback');
      const fallbackIP = 'IP_NO_DISPONIBLE';
      setDenunciaData(prev => ({ ...prev, ipUsuario: fallbackIP }));
      return fallbackIP;
    } catch (error) {
      console.error('❌ Error general obteniendo IP:', error);
      setDenunciaData(prev => ({ ...prev, ipUsuario: 'ERROR_IP' }));
      return 'ERROR_IP';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrMsg('');
    console.log('[UI] submit');
    if (!formData.mayorEdad) return alert('Debes confirmar que eres mayor de edad.');

    try {
      setCreating(true);
      console.log('[API] POST niubiz/session - Botón de Pago Web');
      
      // Obtener IP real antes de crear sesión
      const ipUsuario = await obtenerIPUsuario();
      console.log('🌐 Enviando IP real a Niubiz:', ipUsuario);
      
      // Crear sesión de pago según documentación oficial
      // Llamar al endpoint correcto
      const res = await fetch(apiRoutes.niubizSession, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: data?.ticket_price ?? 15,
          currency: 'PEN',
          clientIp: ipUsuario, // Enviar IP real obtenida dinámicamente
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

      // Solo usar modo simulación si NO tenemos sessionKey real
      if (r.testMode && !r.sessionKey) {
        console.log('🧪 MODO DE PRUEBA ACTIVADO - Sin credenciales reales de Niubiz');
        
        // En modo prueba, mostrar UI bonita y simular pago exitoso
        setTxInfo({ 
          purchaseNumber: Date.now().toString().slice(-10), 
          transactionId: `TEST-${Date.now()}`,
          testMode: true,
          sessionData: r,
          reason: 'Credenciales de test'
        });
        
        // Simular proceso de pago con progreso visual
        setTimeout(() => {
          console.log('🎭 Simulando autorización automática...');
          procearPagoExitoso(`TEST-${Date.now()}`, Date.now().toString().slice(-10));
        }, 4000);
        return;
      }

      // Si tenemos sessionKey, intentar checkout real aunque sea HTTP
      if (r.sessionKey) {
        console.log('✅ SessionKey real obtenida, intentando checkout real de Niubiz');
        
        // Cargar librería de Niubiz y configurar checkout
        try {
          await cargarLibreriaNiubiz();
          
          // Generar purchaseNumber solo números, ≤12 dígitos
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
          console.error('❌ Error cargando librería de Niubiz:', libError);
          setErrMsg('No se pudo cargar el checkout de Niubiz. Verifique que esté en HTTPS o contacte soporte.');
          setCreating(false);
          return;
        }
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
  const cargarLibreriaNiubiz = () => {
    return new Promise((resolve, reject) => {
      const SCRIPT_URL = 'https://static-content-qas.vnforapps.com/env/sandbox/js/checkout.js';
      console.log('📦 Cargando script oficial de Niubiz:', SCRIPT_URL);
      
      // Verificar si ya está cargado
      if (window.VisanetCheckout && typeof window.VisanetCheckout.configure === 'function') {
        console.log('✅ VisanetCheckout ya está cargado');
        resolve();
        return;
      }

      // Limpiar scripts anteriores de Niubiz
      const existingScripts = document.querySelectorAll('script[src*="checkout"], script[src*="payform"], script[src*="vnforapps"]');
      existingScripts.forEach(script => {
        script.remove();
        console.log('🧹 Script anterior eliminado:', script.src);
      });

      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      // No usar crossOrigin, type="module", ni import() - inyección clásica
      
      script.onload = () => {
        console.log(`✅ Script cargado desde: ${SCRIPT_URL}`);
        
        // Verificar que VisanetCheckout esté disponible
        setTimeout(() => {
          if (window.VisanetCheckout && typeof window.VisanetCheckout.configure === 'function') {
            console.log('✅ window.VisanetCheckout disponible');
            resolve();
          } else {
            console.error('❌ window.VisanetCheckout no disponible después de la carga');
            reject(new Error('VisanetCheckout no disponible después de cargar la librería'));
          }
        }, 1000);
      };
      
      script.onerror = (error) => {
        console.error(`❌ Error cargando desde ${SCRIPT_URL}:`, error);
        reject(new Error(`Error cargando librería de Niubiz desde ${SCRIPT_URL}`));
      };
      
      document.head.appendChild(script);
      
      // Timeout de seguridad
      setTimeout(() => {
        if (!window.VisanetCheckout) {
          console.error('⏰ Timeout cargando librería de Niubiz');
          reject(new Error('Timeout cargando librería de Niubiz'));
        }
      }, 10000);
    });
  };

  // Configurar el checkout de Niubiz según documentación
  const configurarCheckoutNiubiz = (sessionData, purchaseNumber) => {
    console.log('🔧 Configurando Niubiz Checkout...');
    
    try {
      if (!window.VisanetCheckout) {
        throw new Error('VisanetCheckout no está disponible');
      }

      if (typeof window.VisanetCheckout.configure !== 'function') {
        throw new Error('VisanetCheckout.configure no es una función');
      }

      // Validar que TODOS los parámetros obligatorios estén presentes
      const params = {
        action: 'pay', // OBLIGATORIO
        merchantid: sessionData.merchantId, // OBLIGATORIO 
        sessiontoken: sessionData.sessionKey, // OBLIGATORIO
        purchasenumber: purchaseNumber, // OBLIGATORIO - Solo números, ≤12 dígitos
        amount: parseFloat(sessionData.amount), // OBLIGATORIO - Asegurar que sea número
        currency: 'PEN', // Recomendado
        channel: 'web', // Recomendado
        expirationminutes: 15, // Recomendado
        timeouturl: 'https://anapse.github.io/app-webpremios/#/niubiz' // OBLIGATORIO - URL pública HTTPS
      };

      // Validaciones adicionales de formato
      if (!/^\d+$/.test(purchaseNumber)) {
        throw new Error('purchaseNumber debe contener solo números');
      }
      
      if (purchaseNumber.length > 12) {
        throw new Error('purchaseNumber no puede tener más de 12 dígitos');
      }
      
      if (isNaN(params.amount) || params.amount <= 0) {
        throw new Error('amount debe ser un número positivo');
      }

      // Logs de validación previos a configure()
      console.log('📋 Validando parámetros obligatorios:');
      console.log('  action:', params.action, '(obligatorio)');
      console.log('  merchantid:', params.merchantid, '(obligatorio)');
      console.log('  sessiontoken:', params.sessiontoken ? `${params.sessiontoken.substring(0, 10)}...` : 'MISSING', '(obligatorio)');
      console.log('  purchasenumber:', params.purchasenumber, `(obligatorio, longitud: ${params.purchasenumber.length})`);
      console.log('  amount:', params.amount, `(obligatorio, tipo: ${typeof params.amount})`);
      console.log('  timeouturl:', params.timeouturl, '(obligatorio)');
      console.log('  currency:', params.currency);
      console.log('  channel:', params.channel);
      console.log('  expirationminutes:', params.expirationminutes);

      // Verificar que ningún valor obligatorio esté undefined o vacío
      const requiredParams = ['action', 'merchantid', 'sessiontoken', 'purchasenumber', 'amount', 'timeouturl'];
      for (const param of requiredParams) {
        if (!params[param] || params[param] === undefined || params[param] === '') {
          throw new Error(`Parámetro obligatorio faltante o vacío: ${param}`);
        }
      }

      console.log('✅ Todos los parámetros obligatorios están presentes');

      // Configuración según documentación oficial del Botón de Pago Web
      window.VisanetCheckout.configure({
        ...params,
        
        // Callback documentado para capturar el token REAL
        complete: function(params) {
          console.log('✅ Checkout completado desde Niubiz:', params);
          setCreating(false);
          
          // Extraer token de forma tolerante
          const token = params?.transactionToken || params?.tokenId;
          
          if (!token) { 
            console.error('❌ No se recibió token del checkout de Niubiz');
            setErrMsg('No se recibió token de transacción del checkout. Intente nuevamente.');
            setTxInfo(null);
            return; 
          }
          
          console.log('🔑 Token real recibido:', token);
          // Enviar token REAL a autorización con el MISMO purchaseNumber
          procearPagoExitoso(token, purchaseNumber);
        },
        
        error: function(error) {
          console.error('❌ Error en el pago desde Niubiz:', error);
          
          // Guardar datos de denuncia automáticamente
          guardarDenuncia(error).then(resultado => {
            if (resultado) {
              console.log('📋 Denuncia registrada automáticamente por error de pago');
            }
          });
          
          setErrMsg(`Error en el proceso de pago: ${error.errorMessage || error.message || 'Intenta nuevamente'}`);
          setTxInfo(null);
          setCreating(false);
        },
        
        close: function() {
          console.log('ℹ️ Checkout cerrado por el usuario');
          setTxInfo(null);
          setCreating(false);
        }
      });

      console.log('✅ VisanetCheckout.configure() ejecutado exitosamente');
      console.log('📱 Abriendo checkout real de Niubiz...');
      
      // Pequeña pausa para asegurar que configure() se complete
      setTimeout(() => {
        try {
          window.VisanetCheckout.open();
          console.log('✅ VisanetCheckout.open() ejecutado');
        } catch (openError) {
          console.error('❌ Error al abrir checkout:', openError);
          setErrMsg(`Error al abrir el checkout: ${openError.message}`);
          setCreating(false);
        }
      }, 100);
      
    } catch (error) {
      console.error('❌ Error configurando checkout:', error);
      setErrMsg(`Error inicializando el checkout de Niubiz: ${error.message}`);
      setTxInfo(null);
      setCreating(false);
    }
  };

  // Procesar pago exitoso y autorizar transacción con token REAL
  const procearPagoExitoso = async (transactionToken, purchaseNumber) => {
    try {
      console.log('🔐 Autorizando transacción con token REAL...');
      console.log('📝 Datos de autorización:', {
        transactionToken,
        purchaseNumber,
        amount: data?.ticket_price ?? 15
      });
      
      // Autorizar la transacción según documentación
      const authResponse = await fetch(apiRoutes.niubizConfirm, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: transactionToken, // Token REAL del checkout como tokenId
          purchaseNumber,   // Mismo purchaseNumber usado en el checkout
          amount: data?.ticket_price ?? 15,
          currency: 'PEN'
        })
      });

      const authData = await authResponse.json();
      console.log('✅ Respuesta de autorización:', authData);

      // Verificar si el pago fue aprobado (código 000)
      const action = authData?.dataMap?.ACTION_CODE || authData?.actionCode;
      if (authData?.testMode || action === '000') {
        console.log('🎉 Pago APROBADO con código:', action);
        
        // Pago autorizado, crear ticket
        const save = await fetch(apiRoutes.tickets, {
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
        console.error('❌ Pago RECHAZADO con código:', action);
        
        // Guardar denuncia por pago rechazado
        const errorInfo = {
          errorCode: action,
          message: `Pago rechazado con código: ${action}`,
          errorMessage: `La transacción fue rechazada por el sistema de pagos (ACTION_CODE: ${action})`
        };
        
        guardarDenuncia(errorInfo).then(resultado => {
          if (resultado) {
            console.log('📋 Denuncia registrada por pago rechazado');
          }
        });
        
        setErrMsg(`Pago no autorizado (código: ${action}). Intenta nuevamente.`);
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
              {txInfo.reason === 'Credenciales de test'
                ? 'Simulación de pago - Configurar credenciales reales para checkout verdadero'
                : txInfo.fallbackMode 
                ? 'Simulación por error de librería - Verificar conectividad'
                : 'Modo de prueba activo'
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
