import React, { useState, useEffect } from 'react';
import './TicketsManager.css';

const TicketsManager = () => {
  const [ticketsPendientes, setTicketsPendientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');

  // Cargar tickets pendientes
  const cargarTicketsPendientes = async () => {
    setLoading(true);
    try {
      console.log('🔄 Cargando tickets pendientes...');
      const response = await fetch('/api/config/tickets/pending');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Datos recibidos del fetch:', data);
      
      // Verificar si hay error en la respuesta pero se envió un array vacío
      if (data.error && data.tickets) {
        console.warn('⚠️ Error en backend pero se recibió array:', data.error);
        setTicketsPendientes(data.tickets); // Array vacío para evitar errores
        setMessage('⚠️ Problema al cargar tickets. Verifique la configuración de la base de datos.');
      } else if (Array.isArray(data)) {
        setTicketsPendientes(data);
        setMessage('');
      } else {
        console.error('❌ Respuesta no es un array:', data);
        setTicketsPendientes([]);
        setMessage('❌ Error: Respuesta inválida del servidor');
      }
      
    } catch (error) {
      console.error('❌ Error al cargar tickets:', error);
      setTicketsPendientes([]); // Array vacío para evitar errores
      setMessage('❌ Error de conexión. Verifique que el servidor esté funcionando.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTicketsPendientes();
  }, []);

  // Activar ticket
  const activarTicket = async (ticketId) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/activate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado_pago: 'pagado' })
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(`✅ ${result.message}`);
        cargarTicketsPendientes(); // Recargar lista
        setShowModal(false);
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error al activar ticket:', error);
      alert('Error de conexión');
    }
  };

  // Rechazar ticket
  const rechazarTicket = async (ticketId) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/activate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado_pago: 'rechazado' })
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(`✅ Ticket rechazado: ${result.codigo_ticket}`);
        cargarTicketsPendientes(); // Recargar lista
        setShowModal(false);
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error al rechazar ticket:', error);
      alert('Error de conexión');
    }
  };

  const verDetalles = (ticket) => {
    setSelectedTicket(ticket);
    setShowModal(true);
  };

  return (
    <div className="tickets-manager">
      <div className="manager-header">
        <h3>📋 Gestión de Tickets Pendientes</h3>
        <button onClick={cargarTicketsPendientes} className="btn-refresh">
          🔄 Actualizar
        </button>
      </div>

      {message && (
        <div className={`tickets-message ${message.includes('❌') ? 'error' : 'warning'}`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="loading">Cargando tickets...</div>
      ) : (
        <div className="tickets-grid">
          {ticketsPendientes.length === 0 ? (
            <div className="no-tickets">
              ✅ No hay tickets pendientes de activación
            </div>
          ) : (
            ticketsPendientes.map((ticket) => (
              <div key={ticket.id} className="ticket-card">
                <div className="ticket-header">
                  <h4>{ticket.codigo_ticket}</h4>
                  <span className="ticket-status pending">PENDIENTE</span>
                </div>
                
                <div className="ticket-info">
                  <p><strong>Nombre:</strong> {ticket.nombres} {ticket.apellidos}</p>
                  <p><strong>DNI:</strong> {ticket.dni}</p>
                  <p><strong>Teléfono:</strong> {ticket.telefono}</p>
                  <p><strong>Departamento:</strong> {ticket.departamento}</p>
                  <p><strong>Fecha:</strong> {new Date(ticket.fecha).toLocaleString()}</p>
                  <p><strong>Precio:</strong> S/ {ticket.ticket_price}</p>
                </div>

                <div className="ticket-actions">
                  <button 
                    onClick={() => verDetalles(ticket)}
                    className="btn-details"
                  >
                    👁️ Ver Comprobante
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal para ver detalles del ticket */}
      {showModal && selectedTicket && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎫 Ticket: {selectedTicket.codigo_ticket}</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="ticket-details">
                <div className="details-section">
                  <h4>📋 Datos del Participante</h4>
                  <p><strong>Nombre:</strong> {selectedTicket.nombres} {selectedTicket.apellidos}</p>
                  <p><strong>DNI:</strong> {selectedTicket.dni}</p>
                  <p><strong>Teléfono:</strong> {selectedTicket.telefono}</p>
                  <p><strong>Departamento:</strong> {selectedTicket.departamento}</p>
                  <p><strong>Fecha de registro:</strong> {new Date(selectedTicket.fecha).toLocaleString()}</p>
                </div>

                <div className="details-section">
                  <h4>💰 Información del Pago</h4>
                  <p><strong>Monto:</strong> S/ {selectedTicket.ticket_price}</p>
                  <p><strong>Estado:</strong> <span className="status-pending">PENDIENTE</span></p>
                </div>

                {selectedTicket.comprobante_base64 && (
                  <div className="details-section">
                    <h4>📷 Comprobante de Pago</h4>
                    <div className="comprobante-container">
                      <img 
                        src={selectedTicket.comprobante_base64} 
                        alt="Comprobante de pago"
                        className="comprobante-image"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => rechazarTicket(selectedTicket.id)}
                className="btn-reject"
              >
                ❌ Rechazar
              </button>
              <button 
                onClick={() => activarTicket(selectedTicket.id)}
                className="btn-activate"
              >
                ✅ Activar Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketsManager;
