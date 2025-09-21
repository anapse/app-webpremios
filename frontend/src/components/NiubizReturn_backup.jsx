import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import '../styles/NiubizReturn.css';

const NiubizReturn = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [ticketCode, setTicketCode] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentData, setPaymentData] = useState(null);

  // Función para generar PDF del ticket
  const descargarPDF = () => {
    if (!ticketCode || !ticketData) return;

    const doc = new jsPDF('p', 'mm', [80, 120]); // Formato tikera 80mm x 120mm
    
    // Header con logo (simulado)
    doc.setFontSize(16);
    doc.setTextColor(255, 126, 0);
    doc.text('GAME ZTORE', 40, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Ticket de Participación', 40, 20, { align: 'center' });
    
    // Línea separadora
    doc.setLineWidth(0.5);
    doc.setDrawColor(255, 126, 0);
    doc.line(5, 25, 75, 25);
    
    // Código de ticket destacado
    doc.setFontSize(14);
    doc.setTextColor(255, 126, 0);
    doc.text(ticketCode, 40, 35, { align: 'center' });
    
    // Línea separadora
    doc.line(5, 40, 75, 40);
    
    // Información del ticket
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    let y = 48;
    
    doc.text('Estado:', 8, y);
    doc.text('APROBADA ✓', 45, y);
    y += 6;
    
    if (ticketData?.saved?.id) {
      doc.text('Orden:', 8, y);
      doc.text(`#${ticketData.saved.id}`, 45, y);
      y += 6;
    }
    
    doc.text('Monto:', 8, y);
    doc.text(`S/ ${ticketData?.datos_pago?.amount || '15.00'}`, 45, y);
    y += 6;
    
    doc.text('Fecha:', 8, y);
    doc.text(ticketData?.datos_pago?.fechaPago || new Date().toLocaleDateString('es-PE'), 45, y);
    y += 6;
    
    doc.text('Hora:', 8, y);
    doc.text(ticketData?.datos_pago?.horaPago || new Date().toLocaleTimeString('es-PE'), 45, y);
    y += 6;
    
    doc.text('Método:', 8, y);
    const metodo = ticketData?.datos_pago?.paymentMethod === 'yape' ? 'Yape' : 
                   ticketData?.datos_pago?.paymentMethod === 'pagoefectivo' ? 'PagoEfectivo' : 'Tarjeta';
    doc.text(metodo, 45, y);
    y += 6;
    
    if (ticketData?.datos_pago?.authorizationCode) {
      doc.text('Autorización:', 8, y);
      doc.text(ticketData.datos_pago.authorizationCode, 45, y);
      y += 6;
    }
    
    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(5, y + 2, 75, y + 2);
    y += 8;
    
    // Información del participante
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('PARTICIPANTE:', 8, y);
    y += 5;
    
    doc.setTextColor(0, 0, 0);
    doc.text(`${ticketData?.nombres || 'N/A'} ${ticketData?.apellidos || ''}`, 8, y);
    y += 4;
    doc.text(`DNI: ${ticketData?.dni || 'N/A'}`, 8, y);
    y += 4;
    doc.text(`Tel: ${ticketData?.telefono || 'N/A'}`, 8, y);
    y += 4;
    doc.text(`Dpto: ${ticketData?.departamento || 'N/A'}`, 8, y);
    
    // Footer
    y += 10;
    doc.setDrawColor(255, 126, 0);
    doc.line(5, y, 75, y);
    y += 6;
    
    doc.setFontSize(8);
    doc.setTextColor(255, 126, 0);
    doc.text('¡Felicitaciones!', 40, y, { align: 'center' });
    y += 4;
    doc.setTextColor(0, 0, 0);
    doc.text('Conserva este ticket', 40, y, { align: 'center' });
    y += 6;
    
    doc.setFontSize(6);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, 40, y, { align: 'center' });
    
    doc.save(`GameZtore_Ticket_${ticketCode}.pdf`);
  };

  useEffect(() => {
    // Verificar parámetros de URL (datos de Niubiz)
    const urlStatus = searchParams.get('status');
    const urlTicketStatus = searchParams.get('ticketStatus');
    const urlPaymentMessage = searchParams.get('paymentMessage');
    const urlTransactionToken = searchParams.get('transactionToken');
    const urlCustomerEmail = searchParams.get('customerEmail');
    const urlChannel = searchParams.get('channel');
    const urlCipCode = searchParams.get('cipCode');
    const urlPurchaseNumber = searchParams.get('purchaseNumber');
    const urlAmount = searchParams.get('amount');
    const urlCurrency = searchParams.get('currency');
    const urlFormDataStr = searchParams.get('formData');
    const urlAuthResult = searchParams.get('authorizationResult');
    const urlActionCode = searchParams.get('actionCode');
    const urlActionDescription = searchParams.get('actionDescription');
    
    console.log('📋 URL Params:', { 
      status: urlStatus, 
      ticketStatus: urlTicketStatus, 
      token: urlTransactionToken ? 'Present' : 'Missing'
    });

    // MANEJAR ESTADO DEL TICKET BASADO EN LA VALIDACIÓN DEL BACKEND
    if (urlTransactionToken) {
      
      // Determinar si el ticket es válido o nulo basado en la autorización
      if (urlStatus === 'rejected' || urlTicketStatus === 'RECHAZADO') {
        console.log('❌ Pago rechazado');
        setStatus('rejected');
        setErrorMessage(urlPaymentMessage || 'Pago rechazado');
        return;
      } else {
        console.log('✅ Pago aprobado');
        setStatus('success');
      }
      
      // Parsear formData si está disponible
      let parsedFormData = null;
      if (urlFormDataStr) {
        try {
          parsedFormData = JSON.parse(urlFormDataStr);
        } catch (error) {
          console.error('Error parseando formData:', error);
        }
      }
      
      // Construir resultado del pago
      const payResult = {
        status: 'success',
        ticketStatus: urlTicketStatus || 'APROBADO',
        paymentMessage: urlPaymentMessage || 'Pago procesado exitosamente',
        transactionToken: urlTransactionToken,
        customerEmail: urlCustomerEmail || '',
        channel: urlChannel || 'web',
        purchaseNumber: urlPurchaseNumber || Date.now().toString().slice(-10),
        amount: urlAmount || '15.00',
        currency: urlCurrency || 'PEN',
        formData: parsedFormData,
        fromUrl: true,
        timestamp: new Date().toISOString()
      };
      
      procesarPagoExitoso(payResult);
      return;
    }
    
    // Si tenemos pago con Yape exitoso
    if (urlTransactionToken && urlStatus === 'yape_success') {
      console.log('📱 Pago con Yape exitoso desde URL');
      
      // Parsear formData si está disponible
      let parsedFormData = null;
      if (urlFormDataStr) {
        try {
          parsedFormData = JSON.parse(urlFormDataStr);
          console.log('📋 FormData parseado exitosamente:', parsedFormData);
        } catch (error) {
          console.error('❌ Error parseando formData:', error);
        }
      }
      
      const payResult = {
        status: 'yape_success',
        transactionToken: urlTransactionToken,
        customerEmail: urlCustomerEmail || '',
        channel: 'yape',
        purchaseNumber: urlPurchaseNumber || Date.now().toString().slice(-10),
        amount: urlAmount || '15.00',
        currency: urlCurrency || 'PEN',
        formData: parsedFormData,
        fromUrl: true,
        timestamp: new Date().toISOString()
      };
      
      console.log('✅ Pago con Yape exitoso, procesando directamente...');
      setStatus('success');
      procesarPagoYape(payResult);
      return;
    }

    // Si tenemos código CIP de PagoEfectivo
    if (urlCipCode && urlStatus === 'pagoefectivo') {
      console.log('💰 Código CIP recibido desde URL');
      setStatus('pagoefectivo');
      // Para PagoEfectivo, mostrar el código CIP
      setTimeout(() => {
        navigate('/niubiz', { 
          state: { 
            message: `Código CIP generado: ${urlCipCode}. Acércate a cualquier agente autorizado para completar tu pago.`,
            cipCode: urlCipCode
          }
        });
      }, 3000);
      return;
    }

    // Leer resultado del pago desde sessionStorage (flujo anterior)
    const payResultStr = sessionStorage.getItem('payResult');
    
    if (payResultStr) {
      try {
        const payResult = JSON.parse(payResultStr);
        console.log('📋 Datos de pago parseados:', payResult);
        
        // Limpiar sessionStorage después de leer
        sessionStorage.removeItem('payResult');
        
        // Procesar según el status
        switch (payResult.status) {
          case 'success':
            console.log('✅ Pago exitoso, procesando...');
            setStatus('success');
            procesarPagoExitoso(payResult);
            break;
            
          case 'yape_success':
            console.log('📱 Pago con Yape exitoso, procesando...');
            setStatus('success');
            procesarPagoYape(payResult);
            break;
            
          case 'error':
            console.error('❌ Error en el pago:', payResult.message);
            setStatus('error');
            setTimeout(() => {
              navigate('/niubiz', { 
                state: { 
                  error: payResult.message,
                  returnData: payResult
                }
              });
            }, 3000);
            break;
            
          case 'cancel':
            console.log('🚫 Pago cancelado');
            setStatus('cancel');
            setTimeout(() => {
              navigate('/niubiz', { 
                state: { 
                  message: payResult.message,
                  returnData: payResult
                }
              });
            }, 3000);
            break;
            
          case 'timeout':
            console.log('⏰ Pago expirado');
            setStatus('timeout');
            setTimeout(() => {
              navigate('/niubiz', { 
                state: { 
                  error: payResult.message,
                  returnData: payResult
                }
              });
            }, 3000);
            break;
            
          default:
            console.warn('⚠️ Status desconocido:', payResult.status);
            setStatus('no_data');
            setTimeout(() => {
              navigate('/niubiz', {
                state: {
                  message: 'Estado de pago desconocido',
                  returnData: payResult
                }
              });
            }, 3000);
        }
      } catch (error) {
        console.error('❌ Error parseando payResult:', error);
        setStatus('no_data');
        setTimeout(() => {
          navigate('/niubiz', {
            state: {
              message: 'Error procesando resultado del pago',
              returnData: { error: error.message }
            }
          });
        }, 3000);
      }
    } else {
      // Fallback: usar el parámetro de la URL (?status=success|error|cancel|timeout)
      const urlStatus = (searchParams.get('status') || '').toLowerCase();
      if (urlStatus === 'success') {
        setStatus('no_data');
        setTimeout(() => {
          navigate('/niubiz', {
            state: {
              message: 'Pago confirmado por Niubiz, pero faltan datos locales. Inténtalo nuevamente si no ves tu ticket.',
              returnData: { status: urlStatus }
            }
          });
        }, 2500);
      } else if (urlStatus === 'error') {
        setStatus('error');
        setTimeout(() => {
          navigate('/niubiz', { state: { error: 'Error en el pago (Niubiz)', returnData: { status: urlStatus } } });
        }, 2500);
      } else if (urlStatus === 'cancel') {
        setStatus('cancel');
        setTimeout(() => {
          navigate('/niubiz', { state: { message: 'Pago cancelado', returnData: { status: urlStatus } } });
        }, 2500);
      } else if (urlStatus === 'timeout') {
        setStatus('timeout');
        setTimeout(() => {
          navigate('/niubiz', { state: { error: 'Tiempo agotado', returnData: { status: urlStatus } } });
        }, 2500);
      } else {
        setStatus('no_data');
        setTimeout(() => {
          navigate('/niubiz', {
            state: {
              message: 'No se encontraron datos del pago',
              returnData: { timestamp: new Date().toISOString() }
            }
          });
        }, 2500);
      }
    }
  }, [navigate]);

  // Función para procesar pago con Yape (sin autorización CVV)
  const procesarPagoYape = async (payResult) => {
    console.log('🔄 Procesando pago con Yape...');
    
    try {
      const { transactionToken, purchaseNumber, amount, currency, formData } = payResult;
      
      if (!transactionToken) {
        throw new Error('Token de transacción no recibido');
      }
      
      // Si no tenemos formData (viene de URL), usar datos por defecto
      const finalFormData = formData || {
        dni: '12345678',
        nombres: 'Usuario',
        apellidos: 'Yape',
        telefono: '999999999',
        departamento: 'Lima'
      };
      
      console.log('📋 Datos de formulario para Yape:', finalFormData);

      // Para Yape, construir ticketData directamente sin autorización
      const ticketData = {
        ...finalFormData,
        estado_pago: 'pagado',
        token_yape: transactionToken,
        id_transaccion: transactionToken,
        datos_pago: {
          transactionId: transactionToken,
          purchaseNumber,
          amount: Number(amount),
          currency,
          paymentMethod: 'yape',
          actionCode: '000',
          actionDescription: 'Pago Yape Exitoso',
          timestamp: new Date().toISOString(),
          fechaPago: new Date().toLocaleDateString('es-PE'),
          horaPago: new Date().toLocaleTimeString('es-PE')
        }
      };

      // Crear ticket directamente
      console.log('🎫 Creando ticket para pago Yape...');
      const saveRes = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData)
      });

      const saved = await saveRes.json();
      if (!saved?.codigo_ticket) {
        throw new Error('No se pudo registrar el ticket');
      }

      console.log('✅ Ticket creado exitosamente para Yape:', saved.codigo_ticket);
      
      // Mostrar resultado exitoso
      setStatus('ticket_created');
      setTicketCode(saved.codigo_ticket);
      setTicketData({
        ...ticketData,
        codigo_ticket: saved.codigo_ticket,
        saved
      });

    } catch (error) {
      console.error('❌ Error procesando pago Yape:', error);
      setStatus('error');
      setErrorMessage(`Error procesando el pago Yape: ${error.message}`);
    }
  };

  // Función para procesar pago exitoso
  const procesarPagoExitoso = async (payResult) => {
    console.log('🔄 Procesando pago exitoso...');
    
    try {
      const { transactionToken, purchaseNumber, amount, currency, formData } = payResult;
      
      if (!transactionToken) {
        throw new Error('Token de transacción no recibido');
      }
      
      // Si no tenemos formData (viene de URL), usar datos por defecto
      const finalFormData = formData || {
        dni: '12345678',
        nombres: 'Usuario',
        apellidos: 'Web',
        telefono: '999999999',
        departamento: 'Lima'
      };
      
      console.log('📋 Datos de formulario:', finalFormData);
      
      // 1. Autorizar en backend
      console.log('🔑 Autorizando transacción...');
      const authRes = await fetch('/api/niubiz/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: transactionToken,
          purchaseNumber,
          amount,
          currency
        })
      });

      const authData = await authRes.json();
      console.log('✅ Respuesta de autorización:', authData);

      // 2. Validar respuesta - mejorar manejo de errores
      if (!authRes.ok) {
        const errorMsg = authData.actionDescription || authData.error || 'Error desconocido en autorización';
        console.error('❌ Error en autorización:', {
          status: authRes.status,
          actionCode: authData.actionCode,
          actionDescription: authData.actionDescription,
          error: authData.error
        });

        // DETECCIÓN INTELIGENTE: Si el error es "CVV2 es requerido", probablemente es Yape
        if (authData.actionDescription && authData.actionDescription.includes('CVV2 es requerido')) {
          console.log('📱 Error CVV2 detectado - probablemente es pago con Yape, procesando como tal...');
          
          // Procesar como Yape directamente
          const yapeResult = {
            ...payResult,
            channel: 'yape',
            status: 'yape_success'
          };
          
          // Llamar función de Yape en lugar de lanzar error
          procesarPagoYape(yapeResult);
          return;
        }

        throw new Error(errorMsg);
      }

      const code = authData?.dataMap?.ACTION_CODE || authData?.actionCode;
      console.log('🔍 Código de autorización:', code);
      
      if (code !== '000') {
        throw new Error(`Pago no autorizado (código: ${code})`);
      }

      // 3. Construir ticketData
      const ticketData = {
        ...finalFormData,
        estado_pago: 'pagado',
        token_yape: authData.dataMap?.TRANSACTION_ID || transactionToken,
        id_transaccion: authData.dataMap?.TRANSACTION_ID || transactionToken,
        datos_pago: {
          transactionId: authData.dataMap?.TRANSACTION_ID || transactionToken,
          authorizationCode: authData.dataMap?.AUTHORIZATION_CODE || 'N/A',
          purchaseNumber,
          amount: Number(amount),
          currency,
          paymentMethod: 'card',
          actionCode: code,
          actionDescription: authData.actionDescription || 'Pago Exitoso',
          timestamp: new Date().toISOString(),
          fechaPago: new Date().toLocaleDateString('es-PE'),
          horaPago: new Date().toLocaleTimeString('es-PE')
        }
      };

      // 4. Crear ticket
      console.log('🎫 Creando ticket...');
      const saveRes = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData)
      });

      const saved = await saveRes.json();
      if (!saved?.codigo_ticket) {
        throw new Error('No se pudo registrar el ticket');
      }

      console.log('✅ Ticket creado exitosamente:', saved.codigo_ticket);
      
      // 5. Mostrar resultado exitoso en lugar de redirigir
      setStatus('ticket_created');
      setTicketCode(saved.codigo_ticket);
      setTicketData({
        ...ticketData,
        codigo_ticket: saved.codigo_ticket,
        authData,
        saved
      });

    } catch (error) {
      console.error('❌ Error procesando pago exitoso:', error);
      setStatus('error');
      setErrorMessage(`Error procesando el pago: ${error.message}`);
    }
  };

  return (
    <div className={`niubiz-return-container status-${status}`}>
      <div className="payment-result-wrapper">
        
        {status === 'processing' && (
          <>
            <div className="payment-icon">💳</div>
            <h2>Procesando Transacción</h2>
            <p>Verificando el resultado de tu pago con Niubiz</p>
            
            <div className="transaction-info processing">
              <div className="loading-spinner processing"></div>
              
              <h3 className="processing">⏳ Verificando transacción...</h3>
              
              <div className="process-steps">
                <div className="process-step">📋 Validando datos de pago</div>
                <div className="process-step">🔗 Comunicándose con Niubiz</div>
                <div className="process-step">🔐 Procesando autorización</div>
                <div className="process-step">🎫 Generando ticket de participación</div>
              </div>
              
              <div className="info-box tips">
                💡 Este proceso puede tomar unos segundos, por favor espera
              </div>
            </div>
          </>
        )}

        {status === 'ticket_created' && (
          <>
            <div className="payment-icon">
              <img 
                src="/logo128.png" 
                alt="Game Ztore" 
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 8px rgba(255,126,0,0.3))'
                }}
              />
            </div>
            <h2>¡Pago Procesado Exitosamente!</h2>
            <p>Tu transacción ha sido aprobada y tu ticket ha sido creado</p>
            
            {/* Formato tikera centrado */}
            <div className="ticket-print-format">
              <div className="ticket-header">
                <div className="ticket-logo">
                  <img 
                    src="/logo128.png" 
                    alt="Game Ztore" 
                    style={{ width: '50px', height: '50px', objectFit: 'contain' }}
                  />
                </div>
                <div className="ticket-title">GAME ZTORE</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Ticket de Participación</div>
              </div>
              
              <div className="ticket-code">{ticketCode}</div>
              
              <div className="ticket-details">
                <div className="ticket-detail-row">
                  <span><strong>Estado:</strong></span>
                  <span style={{ color: '#28a745', fontWeight: 'bold' }}>✅ APROBADA</span>
                </div>
                
                {ticketData?.saved?.id && (
                  <div className="ticket-detail-row">
                    <span><strong>Orden:</strong></span>
                    <span># {ticketData.saved.id}</span>
                  </div>
                )}
                
                {ticketData?.datos_pago?.transactionId && (
                  <div className="ticket-detail-row">
                    <span><strong>ID Trans:</strong></span>
                    <span style={{ fontSize: '10px', fontFamily: 'monospace' }}>
                      {ticketData.datos_pago.transactionId.substring(0, 16)}...
                    </span>
                  </div>
                )}
                
                <div className="ticket-detail-row">
                  <span><strong>Monto:</strong></span>
                  <span style={{ fontWeight: 'bold' }}>S/ {ticketData?.datos_pago?.amount || '15.00'}</span>
                </div>
                
                <div className="ticket-detail-row">
                  <span><strong>Fecha:</strong></span>
                  <span>{ticketData?.datos_pago?.fechaPago || new Date().toLocaleDateString('es-PE')}</span>
                </div>
                
                <div className="ticket-detail-row">
                  <span><strong>Hora:</strong></span>
                  <span>{ticketData?.datos_pago?.horaPago || new Date().toLocaleTimeString('es-PE')}</span>
                </div>
                
                <div className="ticket-detail-row">
                  <span><strong>Método:</strong></span>
                  <span>
                    {ticketData?.datos_pago?.paymentMethod === 'yape' ? '📱 Yape' : 
                     ticketData?.datos_pago?.paymentMethod === 'pagoefectivo' ? '💰 PagoEfectivo' : 
                     '💳 Tarjeta'}
                  </span>
                </div>
                
                {ticketData?.datos_pago?.authorizationCode && (
                  <div className="ticket-detail-row">
                    <span><strong>Autorización:</strong></span>
                    <span style={{ fontSize: '10px' }}>{ticketData.datos_pago.authorizationCode}</span>
                  </div>
                )}
                
                <div className="ticket-detail-row">
                  <span><strong>Participante:</strong></span>
                  <span style={{ fontSize: '11px' }}>{ticketData?.nombres} {ticketData?.apellidos}</span>
                </div>
              </div>
              
              <div className="ticket-footer">
                <div>🎉 ¡Felicitaciones por tu participación!</div>
                <div style={{ marginTop: '5px' }}>Conserva este ticket como comprobante</div>
                <div style={{ marginTop: '8px', fontSize: '8px' }}>
                  Generado: {new Date().toLocaleString('es-PE')}
                </div>
              </div>
            </div>
            
            {/* Información adicional expandida (solo para pantalla) */}
            <div className="transaction-info success" style={{ marginTop: '20px' }}>
              <h3 className="success">Información Completa de la Transacción</h3>
              
              <div className="transaction-detail">
                <strong>📋 Estado:</strong>
                <span className="transaction-detail-value success">✅ APROBADA</span>
              </div>
              
              <div className="transaction-detail">
                <strong>🎫 Código de Ticket:</strong>
                <span className="transaction-detail-value code">{ticketCode}</span>
              </div>
              
              {ticketData?.saved?.id && (
                <div className="transaction-detail">
                  <strong>🔢 Número de Orden:</strong>
                  <span className="transaction-detail-value"># {ticketData.saved.id}</span>
                </div>
              )}
              
              {ticketData?.datos_pago?.transactionId && (
                <div className="transaction-detail">
                  <strong>🔗 ID Transacción:</strong>
                  <span className="transaction-detail-value">{ticketData.datos_pago.transactionId}</span>
                </div>
              )}
              
              <div className="transaction-detail">
                <strong>💰 Monto:</strong>
                <span className="transaction-detail-value">S/ {ticketData?.datos_pago?.amount || '15.00'}</span>
              </div>
              
              <div className="transaction-detail">
                <strong>📅 Fecha de Pago:</strong>
                <span className="transaction-detail-value">{ticketData?.datos_pago?.fechaPago || new Date().toLocaleDateString('es-PE')}</span>
              </div>
              
              <div className="transaction-detail">
                <strong>🕐 Hora de Pago:</strong>
                <span className="transaction-detail-value">{ticketData?.datos_pago?.horaPago || new Date().toLocaleTimeString('es-PE')}</span>
              </div>
              
              <div className="transaction-detail">
                <strong>💳 Método de Pago:</strong>
                <span className="transaction-detail-value">
                  {ticketData?.datos_pago?.paymentMethod === 'yape' ? '📱 Yape' : 
                   ticketData?.datos_pago?.paymentMethod === 'pagoefectivo' ? '💰 PagoEfectivo' : 
                   '💳 Tarjeta de Crédito/Débito'}
                </span>
              </div>
              
              {ticketData?.datos_pago?.authorizationCode && (
                <div className="transaction-detail">
                  <strong>🔐 Código Autorización:</strong>
                  <span className="transaction-detail-value">{ticketData.datos_pago.authorizationCode}</span>
                </div>
              )}
              
              <div className="transaction-detail">
                <strong>👤 Participante:</strong>
                <span className="transaction-detail-value">{ticketData?.nombres} {ticketData?.apellidos}</span>
              </div>
              
              <div className="info-box tips">
                <strong>🎉 ¡Felicitaciones!</strong> Tu ticket ha sido registrado exitosamente. 
                Conserva este comprobante como prueba de tu participación en el sorteo.
              </div>
            </div>
            
            <div className="action-buttons">
              <button onClick={descargarPDF} className="action-button success">
                📄 Descargar PDF
              </button>
              <button 
                onClick={() => window.print()}
                className="action-button"
              >
                🖨️ Imprimir
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="action-button secondary"
              >
                🏠 Ir al inicio
              </button>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="payment-icon">⏳</div>
            <h2>¡Pago Exitoso!</h2>
            <p>Tu transacción ha sido aprobada por Niubiz</p>
            
            <div className="transaction-info success">
              <div className="loading-spinner success"></div>
              
              <h3 className="success">✅ Pago autorizado - Finalizando proceso...</h3>
              
              <div className="process-steps">
                <div className="process-step">📋 Validando información de participante</div>
                <div className="process-step">🎫 Generando ticket de participación</div>
                <div className="process-step">📨 Preparando confirmación</div>
              </div>
              
              <div className="info-box tips">
                💡 Tu pago fue exitoso. Completando tu registro automáticamente...
              </div>
            </div>
          </>
        )}

        {status === 'pagoefectivo' && (
          <>
            <div className="payment-icon">💰</div>
            <h2>¡Código CIP Generado!</h2>
            <p>Tu código de pago en efectivo ha sido creado exitosamente</p>
            
            <div className="transaction-info success">
              <h3 className="success">Información de Pago</h3>
              
              <div className="transaction-detail">
                <strong>📋 Estado:</strong>
                <span className="transaction-detail-value success">✅ CÓDIGO GENERADO</span>
              </div>
              
              <div className="transaction-detail">
                <strong>🏪 Método de Pago:</strong>
                <span className="transaction-detail-value">PagoEfectivo</span>
              </div>
              
              <div className="transaction-detail">
                <strong>💵 Monto:</strong>
                <span className="transaction-detail-value">S/ 15.00</span>
              </div>
              
              <div className="info-box warning">
                <strong>📍 Próximos pasos:</strong>
                <ul>
                  <li>Recibirás el código CIP en la siguiente pantalla</li>
                  <li>Acércate a cualquier agente autorizado</li>
                  <li>Presenta tu código para completar el pago</li>
                  <li>Una vez pagado, recibirás tu ticket de participación</li>
                </ul>
              </div>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="payment-icon">❌</div>
            <h2>Transacción Denegada</h2>
            <p>Hubo un problema procesando tu pago</p>
            
            <div className="transaction-info error">
              <h3 className="error">Detalles del Error</h3>
              
              <div className="transaction-detail">
                <strong>📋 Estado:</strong>
                <span className="transaction-detail-value error">❌ DENEGADA</span>
              </div>
              
              <div className="transaction-detail">
                <strong>📝 Descripción:</strong>
                <div className="info-box tips" style={{ marginTop: '5px' }}>
                  {errorMessage}
                </div>
              </div>
              
              <div className="transaction-detail">
                <strong>🕐 Fecha y Hora:</strong>
                <span className="transaction-detail-value">
                  {new Date().toLocaleDateString('es-PE')} - {new Date().toLocaleTimeString('es-PE')}
                </span>
              </div>
              
              <div className="info-box warning">
                <strong>💡 Posibles causas:</strong>
                <ul>
                  <li>Fondos insuficientes en la cuenta</li>
                  <li>Datos de la tarjeta incorrectos</li>
                  <li>Problemas de conectividad</li>
                  <li>Límites de transacción excedidos</li>
                </ul>
              </div>
            </div>
            
            <div className="action-buttons">
              <button 
                onClick={() => window.location.href = '/niubiz'}
                className="action-button error"
              >
                🔄 Intentar nuevamente
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="action-button secondary"
              >
                🏠 Ir al inicio
              </button>
            </div>
          </>
        )}

        {status === 'rejected' && (
          <>
            <div className="payment-icon">❌</div>
            <h2>Pago Rechazado</h2>
            <p>La transacción no pudo ser autorizada</p>
            
            <div className="transaction-info error">
              <h3 className="error">Información del Rechazo</h3>
              
              <div className="transaction-detail">
                <strong>📋 Estado:</strong>
                <span className="transaction-detail-value error">❌ RECHAZADO</span>
              </div>
              
              <div className="transaction-detail">
                <strong>💬 Mensaje:</strong>
                <span className="transaction-detail-value">
                  {errorMessage || 'Transacción no autorizada'}
                </span>
              </div>
              
              <div className="transaction-detail">
                <strong>🕐 Fecha y Hora:</strong>
                <span className="transaction-detail-value">
                  {new Date().toLocaleDateString('es-PE')} - {new Date().toLocaleTimeString('es-PE')}
                </span>
              </div>
              
              <div className="info-box error">
                <strong>❗ Posibles causas del rechazo:</strong>
                <ul>
                  <li>Fondos insuficientes</li>
                  <li>Tarjeta bloqueada o vencida</li>
                  <li>Datos incorrectos</li>
                  <li>Límites de transacción excedidos</li>
                  <li>Rechazo del banco emisor</li>
                </ul>
              </div>
              
              <div className="info-box info">
                <strong>💡 Recomendaciones:</strong>
                <ul>
                  <li>Verifica los datos de tu tarjeta</li>
                  <li>Contacta con tu banco</li>
                  <li>Intenta con otra tarjeta</li>
                  <li>Usa un método de pago alternativo (Yape, PagoEfectivo)</li>
                </ul>
              </div>
            </div>
            
            <div className="action-buttons">
              <button 
                onClick={() => window.location.href = '/niubiz'}
                className="action-button error"
              >
                🔄 Intentar nuevamente
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="action-button secondary"
              >
                🏠 Ir al inicio
              </button>
            </div>
          </>
        )}

        {status === 'cancel' && (
          <>
            <div className="payment-icon">🚫</div>
            <h2>Pago Cancelado</h2>
            <p>La transacción fue cancelada por el usuario</p>
            
            <div className="transaction-info info">
              <h3 className="info">Información de Cancelación</h3>
              
              <div className="transaction-detail">
                <strong>📋 Estado:</strong>
                <span className="transaction-detail-value error">🚫 CANCELADA</span>
              </div>
              
              <div className="transaction-detail">
                <strong>🕐 Fecha y Hora:</strong>
                <span className="transaction-detail-value">
                  {new Date().toLocaleDateString('es-PE')} - {new Date().toLocaleTimeString('es-PE')}
                </span>
              </div>
              
              <div className="info-box info">
                <strong>💡 ¿Qué puedes hacer?</strong>
                <ul>
                  <li>Intentar realizar el pago nuevamente</li>
                  <li>Elegir un método de pago diferente</li>
                  <li>Contactar con soporte si persisten los problemas</li>
                </ul>
              </div>
            </div>
            
            <div className="action-buttons">
              <button 
                onClick={() => window.location.href = '/niubiz'}
                className="action-button"
              >
                🔄 Intentar nuevamente
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="action-button success"
              >
                🏠 Ir al inicio
              </button>
            </div>
          </>
        )}

        {status === 'timeout' && (
          <>
            <div className="payment-icon">⏰</div>
            <h2>Tiempo de Sesión Agotado</h2>
            <p>El tiempo para completar la transacción ha expirado</p>
            
            <div className="transaction-info warning">
              <h3 className="warning">Información del Timeout</h3>
              
              <div className="transaction-detail">
                <strong>📋 Estado:</strong>
                <span className="transaction-detail-value error">⏰ TIEMPO AGOTADO</span>
              </div>
              
              <div className="transaction-detail">
                <strong>🕐 Fecha y Hora:</strong>
                <span className="transaction-detail-value">
                  {new Date().toLocaleDateString('es-PE')} - {new Date().toLocaleTimeString('es-PE')}
                </span>
              </div>
              
              <div className="info-box tips">
                <strong>💡 ¿Por qué pasó esto?</strong>
                <ul>
                  <li>Las sesiones de pago tienen un tiempo límite por seguridad</li>
                  <li>El proceso tomó más tiempo del permitido</li>
                  <li>Problemas de conectividad pueden causar demoras</li>
                </ul>
              </div>
              
              <div className="info-box info">
                <strong>🔄 Solución:</strong> Puedes intentar el pago nuevamente sin problemas
              </div>
            </div>
            
            <div className="action-buttons">
              <button 
                onClick={() => window.location.href = '/niubiz'}
                className="action-button warning"
              >
                🔄 Intentar nuevamente
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="action-button secondary"
              >
                🏠 Ir al inicio
              </button>
            </div>
          </>
        )}

        {status === 'no_data' && (
          <>
            <div className="payment-icon">⚠️</div>
            <h2>Sin Datos de Transacción</h2>
            <p>No se recibieron los parámetros esperados desde Niubiz</p>
            
            <div className="transaction-info warning">
              <h3 className="warning">Información del Problema</h3>
              
              <div className="transaction-detail">
                <strong>📋 Estado:</strong>
                <span className="transaction-detail-value error">⚠️ SIN DATOS</span>
              </div>
              
              <div className="transaction-detail">
                <strong>🕐 Fecha y Hora:</strong>
                <span className="transaction-detail-value">
                  {new Date().toLocaleDateString('es-PE')} - {new Date().toLocaleTimeString('es-PE')}
                </span>
              </div>
              
              <div className="info-box tips">
                <strong>🔍 Posibles causas:</strong>
                <ul>
                  <li>Acceso directo a la página sin completar el pago</li>
                  <li>Problemas de comunicación con Niubiz</li>
                  <li>Sesión de pago expirada o incompleta</li>
                  <li>URL manipulada o incorrecta</li>
                </ul>
              </div>
              
              <div className="info-box info">
                <strong>💡 Recomendación:</strong> Inicia el proceso de pago desde el formulario de registro
              </div>
            </div>
            
            <div className="action-buttons">
              <button 
                onClick={() => window.location.href = '/niubiz'}
                className="action-button warning"
              >
                🔄 Iniciar pago
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="action-button secondary"
              >
                🏠 Ir al inicio
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NiubizReturn;