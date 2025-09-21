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
    
    // Información del ticket
    let y = 35;
    const lineHeight = 6;
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Código: ${ticketCode}`, 5, y);
    y += lineHeight;
    
    doc.setFontSize(10);
    doc.text(`Participante: ${ticketData.nombre || 'N/A'}`, 5, y);
    y += lineHeight;
    doc.text(`DNI: ${ticketData.dni || 'N/A'}`, 5, y);
    y += lineHeight;
    doc.text(`Email: ${ticketData.email || 'N/A'}`, 5, y);
    y += lineHeight * 2;
    
    doc.text(`Monto: S/ ${ticketData.datos_pago?.amount || '15.00'}`, 5, y);
    y += lineHeight;
    doc.text(`Estado: ${ticketData.estado_pago?.toUpperCase() || 'PAGADO'}`, 5, y);
    y += lineHeight;
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, 5, y);
    y += lineHeight;
    doc.text(`Hora: ${new Date().toLocaleTimeString('es-PE')}`, 5, y);
    y += lineHeight * 2;
    
    // ID de transacción (pequeño)
    doc.setFontSize(8);
    doc.text(`Trans: ${ticketData.datos_pago?.transactionId?.substring(0, 20) || 'N/A'}...`, 5, y);
    
    // Footer
    y += lineHeight * 3;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('¡Buena suerte!', 40, y, { align: 'center' });
    doc.text('gameztorepremios.com', 40, y + lineHeight, { align: 'center' });
    
    doc.save(`ticket_${ticketCode}.pdf`);
  };

  useEffect(() => {
    // Verificar parámetros de URL (datos de Niubiz)
    const urlStatus = searchParams.get('status');
    const urlTicketStatus = searchParams.get('ticketStatus');
    const urlPaymentMessage = searchParams.get('paymentMessage');
    const urlTransactionToken = searchParams.get('transactionToken');
    const urlCustomerEmail = searchParams.get('customerEmail');
    const urlChannel = searchParams.get('channel');
    const urlPurchaseNumber = searchParams.get('purchaseNumber');
    const urlAmount = searchParams.get('amount');
    const urlCurrency = searchParams.get('currency');
    const urlFormDataStr = searchParams.get('formData');

    console.log('📋 URL Params:', { 
      status: urlStatus, 
      ticketStatus: urlTicketStatus, 
      token: urlTransactionToken ? 'Present' : 'Missing'
    });

    // MANEJAR ESTADO DEL TICKET BASADO EN LA VALIDACIÓN DEL BACKEND
    if (urlTransactionToken) {
      
      // Verificar si el pago fue rechazado
      if (urlStatus === 'rejected' || urlTicketStatus === 'RECHAZADO') {
        console.log('❌ Pago rechazado');
        setStatus('rejected');
        setErrorMessage(urlPaymentMessage || 'Pago rechazado');
        return;
      }
      
      // Pago aprobado - procesar
      console.log('✅ Pago aprobado');
      setStatus('success');
      
      // Parsear formData
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
        status: urlStatus === 'yape_success' ? 'yape_success' : 'success',
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
      
      // Procesar según el canal
      if (urlChannel === 'yape' || urlStatus === 'yape_success') {
        console.log('📱 Procesando como Yape');
        procesarPagoYape(payResult);
      } else {
        console.log('💳 Procesando como tarjeta normal');
        procesarPagoExitoso(payResult);
      }
      return;
    }

    // Si no hay token, manejar estados simples
    const simpleStatus = searchParams.get('status');
    if (simpleStatus === 'error') {
      setStatus('error');
      setErrorMessage('Error en el procesamiento del pago');
    } else if (simpleStatus === 'cancel') {
      setStatus('cancel');
    } else {
      setStatus('no_data');
    }
  }, [navigate, searchParams]);

  // Función para procesar pago exitoso (con autorización CVV)
  const procesarPagoExitoso = async (payResult) => {
    console.log('🔄 Procesando pago exitoso...');
    
    try {
      const { transactionToken, purchaseNumber, amount, currency, formData } = payResult;
      
      if (!transactionToken) {
        throw new Error('Token de transacción no recibido');
      }

      // Hacer la llamada de autorización
      const authResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/niubiz/authorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionToken,
          purchaseNumber: purchaseNumber || Date.now().toString().slice(-10),
          amount: amount || '15.00',
          currency: currency || 'PEN'
        }),
      });

      if (!authResponse.ok) {
        const errorData = await authResponse.json();
        throw new Error(errorData.error || 'Error en la autorización');
      }

      const authData = await authResponse.json();
      console.log('🏦 Respuesta de autorización:', authData);

      const code = authData?.dataMap?.ACTION_CODE || authData?.actionCode;
      if (code !== '000') {
        throw new Error(`Pago no autorizado (código: ${code})`);
      }

      // Construir ticketData
      const ticketData = {
        ...formData,
        estado_pago: 'pagado',
        token_yape: authData.dataMap?.TRANSACTION_ID || transactionToken,
        id_transaccion: authData.dataMap?.TRANSACTION_ID || transactionToken,
        datos_pago: {
          transactionId: authData.dataMap?.TRANSACTION_ID || transactionToken,
          amount: amount || '15.00',
          currency: currency || 'PEN',
          channel: 'web',
          authorizationCode: authData.dataMap?.AUTHORIZATION_CODE,
          actionCode: code,
          fechaPago: new Date().toLocaleDateString('es-PE'),
          horaPago: new Date().toLocaleTimeString('es-PE'),
          paymentMethod: 'card'
        }
      };

      // Guardar ticket en backend
      const saveResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
      });

      if (!saveResponse.ok) {
        throw new Error('Error guardando el ticket');
      }

      const savedTicket = await saveResponse.json();
      const codigo = savedTicket.codigo || `TK${Date.now().toString().slice(-8)}`;

      setTicketCode(codigo);
      setTicketData({ ...ticketData, saved: savedTicket });
      setStatus('success');

      // Limpiar sessionStorage
      sessionStorage.removeItem('niubizPayResult');

    } catch (error) {
      console.error('❌ Error procesando pago:', error);
      setStatus('error');
      setErrorMessage(error.message);
    }
  };

  // Función para procesar pago con Yape (sin autorización CVV)
  const procesarPagoYape = async (payResult) => {
    console.log('🔄 Procesando pago con Yape...');
    
    try {
      const { transactionToken, purchaseNumber, amount, currency, formData } = payResult;
      
      if (!transactionToken) {
        throw new Error('Token de transacción no recibido');
      }

      // Para Yape, construir directamente el ticketData sin autorización CVV
      const ticketData = {
        ...formData,
        estado_pago: 'pagado',
        token_yape: transactionToken,
        id_transaccion: transactionToken,
        datos_pago: {
          transactionId: transactionToken,
          amount: amount || '15.00',
          currency: currency || 'PEN',
          channel: 'yape',
          fechaPago: new Date().toLocaleDateString('es-PE'),
          horaPago: new Date().toLocaleTimeString('es-PE'),
          paymentMethod: 'yape'
        }
      };

      // Guardar ticket en backend
      const saveResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
      });

      if (!saveResponse.ok) {
        throw new Error('Error guardando el ticket de Yape');
      }

      const savedTicket = await saveResponse.json();
      const codigo = savedTicket.codigo || `YP${Date.now().toString().slice(-8)}`;

      setTicketCode(codigo);
      setTicketData({ ...ticketData, saved: savedTicket });
      setStatus('success');

      // Limpiar sessionStorage
      sessionStorage.removeItem('niubizPayResult');

    } catch (error) {
      console.error('❌ Error procesando pago Yape:', error);
      setStatus('error');
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="niubiz-return-container">
      <div className="payment-result-wrapper">
        {status === 'processing' && (
          <>
            <div className="payment-icon">⏳</div>
            <h2>Procesando Pago...</h2>
            <p>Estamos verificando tu transacción con Niubiz</p>
            <div className="spinner"></div>
          </>
        )}

        {status === 'success' && ticketCode && ticketData && (
          <>
            <div className="payment-icon">✅</div>
            <h2>¡Pago Exitoso!</h2>
            <p>Tu ticket de participación ha sido generado</p>
            
            {/* Ticket con formato tikera para impresión */}
            <div className="ticket-print-format" id="ticket-content">
              {/* Header del ticket */}
              <div className="ticket-header">
                <img 
                  src="/logo128.png" 
                  alt="Game Ztore" 
                  className="ticket-logo"
                  onLoad={() => console.log('✅ Spinner image loaded')}
                  onError={(e) => {
                    console.log('❌ Error loading logo, using text fallback');
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'block';
                  }}
                />
                <div className="ticket-logo-fallback" style={{ display: 'none' }}>
                  <span className="logo-text">GAME ZTORE</span>
                </div>
                <div className="ticket-title">TICKET DE PARTICIPACIÓN</div>
              </div>

              {/* Código del ticket destacado */}
              <div className="ticket-code-section">
                <div className="ticket-code">{ticketCode}</div>
              </div>

              {/* Detalles de la transacción */}
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
                
                {/* Información del participante */}
                <div className="ticket-separator"></div>
                
                <div className="ticket-detail-row">
                  <span><strong>Participante:</strong></span>
                  <span>{ticketData?.nombre || 'N/A'}</span>
                </div>
                
                <div className="ticket-detail-row">
                  <span><strong>DNI:</strong></span>
                  <span>{ticketData?.dni || 'N/A'}</span>
                </div>
                
                <div className="ticket-detail-row">
                  <span><strong>Email:</strong></span>
                  <span style={{ fontSize: '10px' }}>{ticketData?.email || 'N/A'}</span>
                </div>
              </div>

              {/* Footer del ticket */}
              <div className="ticket-footer">
                <div className="success-message">¡Buena suerte!</div>
                <div className="website">gameztorepremios.com</div>
              </div>
            </div>

            <div className="action-buttons">
              <button onClick={descargarPDF} className="action-button success">
                📄 Descargar PDF
              </button>
              <button 
                onClick={() => window.print()}
                className="action-button secondary"
              >
                🖨️ Imprimir Ticket
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="action-button primary"
              >
                🏠 Ir al inicio
              </button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="payment-icon">❌</div>
            <h2>Error en el Pago</h2>
            <p>{errorMessage || 'Hubo un problema procesando tu pago'}</p>
            
            <div className="transaction-info error">
              <h3 className="error">Detalles del Error</h3>
              
              <div className="transaction-detail">
                <strong>📋 Estado:</strong>
                <span className="transaction-detail-value error">❌ ERROR</span>
              </div>
              
              <div className="transaction-detail">
                <strong>💬 Mensaje:</strong>
                <span className="transaction-detail-value">{errorMessage}</span>
              </div>
              
              <div className="transaction-detail">
                <strong>🕐 Fecha y Hora:</strong>
                <span className="transaction-detail-value">
                  {new Date().toLocaleDateString('es-PE')} - {new Date().toLocaleTimeString('es-PE')}
                </span>
              </div>
              
              <div className="info-box error">
                <strong>❗ Posibles causas:</strong>
                <ul>
                  <li>Problemas de conexión con Niubiz</li>
                  <li>Datos de tarjeta incorrectos</li>
                  <li>Fondos insuficientes</li>
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
                className="action-button primary"
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
            <div className="payment-icon">❓</div>
            <h2>Sin Datos de Pago</h2>
            <p>No se encontraron datos de la transacción</p>
            
            <div className="transaction-info info">
              <h3 className="info">Información</h3>
              
              <div className="transaction-detail">
                <strong>📋 Estado:</strong>
                <span className="transaction-detail-value info">❓ SIN DATOS</span>
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
                  <li>Verificar si el pago se procesó correctamente</li>
                  <li>Intentar realizar el pago nuevamente</li>
                  <li>Contactar con soporte para verificar tu transacción</li>
                </ul>
              </div>
            </div>
            
            <div className="action-buttons">
              <button 
                onClick={() => window.location.href = '/niubiz'}
                className="action-button primary"
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
      </div>
    </div>
  );
};

export default NiubizReturn;