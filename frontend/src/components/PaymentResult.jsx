import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import '../styles/PaymentResult.css';

const PaymentResult = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [ticketData, setTicketData] = useState(null);
  const [ticketCode, setTicketCode] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    console.log('🔄 PaymentResult cargado');
    console.log('🌐 URL completa:', window.location.href);
    
    // Leer parámetros de URL
    const urlStatus = searchParams.get('status');
    const urlMessage = searchParams.get('message');
    const urlPurchase = searchParams.get('purchase');
    const urlTransactionToken = searchParams.get('transactionToken');
    const urlCustomerEmail = searchParams.get('customerEmail');
    const urlChannel = searchParams.get('channel');
    const urlCipCode = searchParams.get('cipCode');
    
    console.log('📋 Parámetros URL:', { 
      urlStatus, urlMessage, urlPurchase, 
      urlTransactionToken, urlCustomerEmail, urlChannel, urlCipCode 
    });
    
    // Leer datos de sessionStorage
    const payResultStr = sessionStorage.getItem('payResult');
    console.log('💾 PayResult en sessionStorage:', payResultStr);
    
    let payResult = null;
    if (payResultStr) {
      try {
        payResult = JSON.parse(payResultStr);
        console.log('📋 Datos de pago parseados:', payResult);
      } catch (error) {
        console.error('❌ Error parseando payResult:', error);
      }
    }

    // Limpiar sessionStorage después de leer
    if (payResultStr) {
      sessionStorage.removeItem('payResult');
    }

    // Determinar estado basado en URL o sessionStorage
    const finalStatus = urlStatus || payResult?.status || 'no_data';
    const finalMessage = urlMessage || payResult?.message || 'Sin información adicional';
    
    // Si tenemos datos de URL de Niubiz, construir payResult
    if (urlTransactionToken && urlStatus === 'success') {
      console.log('� Datos recibidos desde URL de Niubiz');
      payResult = {
        status: 'success',
        transactionToken: urlTransactionToken,
        customerEmail: urlCustomerEmail || '',
        channel: urlChannel || 'web',
        purchaseNumber: urlPurchase || `PUR_${Date.now()}`,
        amount: '15.00', // Valor por defecto, se debería obtener del contexto
        currency: 'PEN',
        fromUrl: true,
        timestamp: new Date().toISOString()
      };
    } else if (urlCipCode && urlStatus === 'pagoefectivo') {
      console.log('💰 Código CIP recibido desde URL');
      payResult = {
        status: 'pagoefectivo',
        cipCode: urlCipCode,
        channel: 'pagoefectivo',
        purchaseNumber: urlPurchase || `PUR_${Date.now()}`,
        amount: '15.00',
        currency: 'PEN',
        fromUrl: true,
        timestamp: new Date().toISOString()
      };
    }
    
    console.log('�🎯 Estado final:', finalStatus);
    console.log('💬 Mensaje final:', finalMessage);
    console.log('📦 PayResult final:', payResult);
    
    setStatus(finalStatus);
    setMessage(finalMessage);
    
    // Procesar según el estado
    switch (finalStatus) {
      case 'success':
        console.log('✅ Pago exitoso, procesando...');
        procesarPagoExitoso(payResult);
        break;
        
      case 'pagoefectivo':
        console.log('💰 PagoEfectivo detectado, procesando código CIP...');
        procesarPagoEfectivo(payResult);
        break;
        
      case 'error':
        console.error('❌ Error en el pago:', finalMessage);
        setTimeout(() => {
          navigate('/niubiz', { 
            state: { 
              error: finalMessage,
              returnData: payResult
            }
          });
        }, 5000);
        break;
        
      case 'cancel':
        console.log('🚫 Pago cancelado');
        setTimeout(() => {
          navigate('/niubiz', { 
            state: { 
              message: finalMessage,
              returnData: payResult
            }
          });
        }, 3000);
        break;
        
      case 'timeout':
        console.log('⏰ Pago expirado');
        setTimeout(() => {
          navigate('/niubiz', { 
            state: { 
              error: finalMessage,
              returnData: payResult
            }
          });
        }, 5000);
        break;
        
      default:
        console.warn('⚠️ Status desconocido:', finalStatus);
        setTimeout(() => {
          navigate('/niubiz', {
            state: {
              message: 'Estado de pago desconocido',
              returnData: payResult || { urlStatus, urlMessage, urlPurchase }
            }
          });
        }, 3000);
    }
  }, [navigate, searchParams]);

  // Función para procesar pago efectivo (CIP)
  const procesarPagoEfectivo = async (payResult) => {
    console.log('🔄 Procesando código CIP...');
    setProcessing(true);
    
    try {
      const { cipCode, purchaseNumber, amount, currency } = payResult;
      
      if (!cipCode) {
        throw new Error('Código CIP no recibido');
      }
      
      // Para PagoEfectivo, mostrar el código CIP sin autorizar todavía
      // El pago se completará cuando el usuario pague en el agente
      setStatus('pagoefectivo_pending');
      setMessage(`Código CIP generado: ${cipCode}`);
      setTicketData({
        cipCode,
        purchaseNumber,
        amount,
        currency,
        status: 'pendiente_pago',
        instrucciones: 'Acércate a cualquier agente autorizado y presenta este código CIP para completar tu pago.'
      });
      setProcessing(false);

    } catch (error) {
      console.error('❌ Error procesando PagoEfectivo:', error);
      setStatus('error');
      setMessage(`Error procesando PagoEfectivo: ${error.message}`);
      setProcessing(false);
      
      setTimeout(() => {
        navigate('/niubiz', { 
          state: { 
            error: `Error procesando PagoEfectivo: ${error.message}`,
            returnData: payResult
          }
        });
      }, 5000);
    }
  };

  // Función para procesar pago exitoso
  const procesarPagoExitoso = async (payResult) => {
    console.log('🔄 Procesando pago exitoso...');
    setProcessing(true);
    
    try {
      const { transactionToken, purchaseNumber, amount, currency, formData } = payResult;
      
      if (!transactionToken) {
        throw new Error('Token de transacción no recibido');
      }
      
      // Si no tenemos formData (viene de URL), necesitamos datos por defecto
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

      // 2. Validar respuesta
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
          actionCode: code,
          actionDescription: authData.dataMap?.ACTION_DESCRIPTION || 'Aprobado',
          brand: authData.dataMap?.BRAND || 'N/A',
          cardType: authData.dataMap?.CARD_TYPE || 'N/A',
          panMask: authData.dataMap?.PAN || 'N/A',
          traceNumber: authData.dataMap?.TRACE_NUMBER || 'N/A',
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
      
      // 5. Actualizar estado
      setTicketCode(saved.codigo_ticket);
      setTicketData({
        ...ticketData,
        codigo_ticket: saved.codigo_ticket,
        authData,
        saved
      });
      setProcessing(false);

    } catch (error) {
      console.error('❌ Error procesando pago exitoso:', error);
      setStatus('error');
      setMessage(`Error procesando el pago: ${error.message}`);
      setProcessing(false);
      
      setTimeout(() => {
        navigate('/niubiz', { 
          state: { 
            error: `Error procesando el pago: ${error.message}`,
            returnData: payResult
          }
        });
      }, 5000);
    }
  };

  // Función para descargar PDF del ticket
  const descargarPDF = () => {
    if (!ticketData || !ticketCode) return;
    
    const doc = new jsPDF();
    const datosPago = ticketData.datos_pago;
    
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
    doc.text(`Nombre: ${ticketData.nombres} ${ticketData.apellidos}`, 20, 55);
    doc.text(`DNI: ${ticketData.dni}`, 20, 65);
    doc.text(`Teléfono: ${ticketData.telefono}`, 20, 75);
    doc.text(`Departamento: ${ticketData.departamento}`, 20, 85);
    doc.text(`Código de Ticket: ${ticketCode}`, 20, 95);
    
    // Información del pago
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
      doc.text(`Fecha de Pago: ${datosPago.fechaPago}`, 20, 180);
      doc.text(`Hora de Pago: ${datosPago.horaPago}`, 20, 190);
    }
    
    // Pie de página
    doc.setFontSize(9);
    doc.text('Game Ztore - Tu oportunidad de ganar', 20, 260);
    doc.text(`Generado el: ${new Date().toLocaleString('es-PE')}`, 20, 270);
    doc.line(20, 275, 190, 275);
    
    doc.save(`Ticket_${ticketCode}.pdf`);
  };

  // Función para ir al inicio
  const irAlInicio = () => {
    navigate('/');
  };

  // Función para intentar nuevamente
  const intentarNuevamente = () => {
    navigate('/niubiz');
  };

  return (
    <div className="payment-result">
      <div className="payment-result-container">
        
        {/* Estado: Loading */}
        {status === 'loading' && (
          <div className="payment-result-content">
            <div className="payment-result-icon loading-icon">
              <div className="spinner"></div>
            </div>
            <h2>Procesando resultado del pago...</h2>
            <p>Por favor espera mientras verificamos tu transacción</p>
          </div>
        )}

        {/* Estado: PagoEfectivo Pending */}
        {status === 'pagoefectivo_pending' && (
          <div className="payment-result-content pagoefectivo">
            <div className="payment-result-icon pagoefectivo-icon">💰</div>
            <h2>Código CIP Generado</h2>
            <p>Tu código de pago ha sido generado exitosamente</p>
            
            <div className="cip-info">
              <h3>Código CIP:</h3>
              <div className="cip-code">{ticketData?.cipCode}</div>
              <p className="cip-instructions">{ticketData?.instrucciones}</p>
            </div>

            <div className="payment-result-actions">
              <button onClick={irAlInicio} className="btn-primary">
                🏠 Entendido
              </button>
            </div>
          </div>
        )}

        {/* Estado: Success */}
        {status === 'success' && !processing && ticketCode && (
          <div className="payment-result-content success">
            <div className="payment-result-icon success-icon">✅</div>
            <h2>¡Pago Exitoso!</h2>
            <p>Tu transacción ha sido procesada correctamente</p>
            
            <div className="ticket-info">
              <h3>Tu número de ticket es:</h3>
              <div className="ticket-code">{ticketCode}</div>
            </div>

            <div className="payment-result-actions">
              <button onClick={descargarPDF} className="btn-primary">
                📄 Descargar PDF
              </button>
              <button onClick={irAlInicio} className="btn-secondary">
                🏠 Ir al inicio
              </button>
            </div>
          </div>
        )}

        {/* Estado: Success pero aún procesando */}
        {status === 'success' && processing && (
          <div className="payment-result-content">
            <div className="payment-result-icon loading-icon">
              <div className="spinner"></div>
            </div>
            <h2>¡Pago Exitoso!</h2>
            <p>Creando tu ticket...</p>
            <p className="processing-note">Esto puede tomar unos segundos</p>
          </div>
        )}

        {/* Estado: Error */}
        {status === 'error' && (
          <div className="payment-result-content error">
            <div className="payment-result-icon error-icon">❌</div>
            <h2>Error en el Pago</h2>
            <p>Hubo un problema procesando tu transacción</p>
            <div className="error-message">{message}</div>
            
            <div className="payment-result-actions">
              <button onClick={intentarNuevamente} className="btn-primary">
                🔄 Intentar nuevamente
              </button>
              <button onClick={irAlInicio} className="btn-secondary">
                🏠 Ir al inicio
              </button>
            </div>
            
            <p className="redirect-note">Redirigiendo automáticamente en 5 segundos...</p>
          </div>
        )}

        {/* Estado: Cancel */}
        {status === 'cancel' && (
          <div className="payment-result-content cancel">
            <div className="payment-result-icon cancel-icon">🚫</div>
            <h2>Pago Cancelado</h2>
            <p>El pago fue cancelado por el usuario</p>
            <div className="info-message">{message}</div>
            
            <div className="payment-result-actions">
              <button onClick={intentarNuevamente} className="btn-primary">
                🔄 Intentar nuevamente
              </button>
              <button onClick={irAlInicio} className="btn-secondary">
                🏠 Ir al inicio
              </button>
            </div>
            
            <p className="redirect-note">Redirigiendo automáticamente en 3 segundos...</p>
          </div>
        )}

        {/* Estado: Timeout */}
        {status === 'timeout' && (
          <div className="payment-result-content timeout">
            <div className="payment-result-icon timeout-icon">⏰</div>
            <h2>Tiempo Agotado</h2>
            <p>El tiempo para completar el pago ha expirado</p>
            <div className="info-message">{message}</div>
            
            <div className="payment-result-actions">
              <button onClick={intentarNuevamente} className="btn-primary">
                🔄 Intentar nuevamente
              </button>
              <button onClick={irAlInicio} className="btn-secondary">
                🏠 Ir al inicio
              </button>
            </div>
            
            <p className="redirect-note">Redirigiendo automáticamente en 5 segundos...</p>
          </div>
        )}

        {/* Estado: No Data */}
        {status === 'no_data' && (
          <div className="payment-result-content no-data">
            <div className="payment-result-icon warning-icon">⚠️</div>
            <h2>Sin Datos de Transacción</h2>
            <p>No se recibieron parámetros del pago desde Niubiz</p>
            <div className="info-message">{message}</div>
            
            <div className="payment-result-actions">
              <button onClick={intentarNuevamente} className="btn-primary">
                🔄 Intentar nuevamente
              </button>
              <button onClick={irAlInicio} className="btn-secondary">
                🏠 Ir al inicio
              </button>
            </div>
            
            <p className="redirect-note">Redirigiendo automáticamente en 3 segundos...</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default PaymentResult;
