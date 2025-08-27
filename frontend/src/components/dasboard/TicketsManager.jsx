import React, { useState, useEffect } from 'react';
import './TicketsManager.css';

const TicketsManager = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('pendiente'); // Estado por defecto

  // Opciones del filtro de estado
  const statusOptions = [
    { value: 'pendiente', label: '⏳ Pendientes', count: 0 },
    { value: 'pagado', label: '✅ Aceptados', count: 0 },
    { value: 'rechazado', label: '❌ Rechazados', count: 0 },
    { value: 'todos', label: '📋 Todos', count: 0 }
  ];

  // Cargar tickets por estado
  const cargarTickets = async (status = statusFilter) => {
    setLoading(true);
    try {
      console.log(`🔄 Cargando tickets con estado: ${status}`);
      const response = await fetch(`/api/config/tickets?status=${status}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Datos recibidos del fetch:', data);
      
      // Verificar si hay error en la respuesta pero se envió un array vacío
      if (data.error && data.tickets) {
        console.warn('⚠️ Error en backend pero se recibió array:', data.error);
        setTickets(data.tickets); // Array vacío para evitar errores
        setMessage('⚠️ Problema al cargar tickets. Verifique la configuración de la base de datos.');
      } else if (Array.isArray(data)) {
        setTickets(data);
        setMessage('');
      } else {
        console.error('❌ Respuesta no es un array:', data);
        setTickets([]);
        setMessage('❌ Error: Respuesta inválida del servidor');
      }
      
    } catch (error) {
      console.error('❌ Error al cargar tickets:', error);
      setTickets([]); // Array vacío para evitar errores
      setMessage('❌ Error de conexión. Verifique que el servidor esté funcionando.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTickets();
  }, [statusFilter]); // Recargar cuando cambie el filtro

  // Manejar cambio de filtro
  const handleStatusChange = (newStatus) => {
    setStatusFilter(newStatus);
    cargarTickets(newStatus);
  };

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
        cargarTickets(); // Recargar lista
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
        cargarTickets(); // Recargar lista
        setShowModal(false);
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error al rechazar ticket:', error);
      alert('Error de conexión');
    }
  };

  // Obtener estado en español y estilo
  const getStatusDisplay = (estado) => {
    switch (estado) {
      case 'pendiente':
        return { text: 'PENDIENTE', class: 'pending' };
      case 'pagado':
        return { text: 'ACEPTADO', class: 'accepted' };
      case 'rechazado':
        return { text: 'RECHAZADO', class: 'rejected' };
      default:
        return { text: estado.toUpperCase(), class: 'unknown' };
    }
  };

  const verDetalles = (ticket) => {
    setSelectedTicket(ticket);
    setShowModal(true);
  };

  return (
    <div className="tickets-manager">
      <div className="manager-header">
        <h3>📋 Gestión de Tickets</h3>
        <div className="header-controls">
          <select 
            value={statusFilter} 
            onChange={(e) => handleStatusChange(e.target.value)}
            className="status-filter"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button onClick={() => cargarTickets()} className="btn-refresh">
            🔄 Actualizar
          </button>
        </div>
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
          {tickets.length === 0 ? (
            <div className="no-tickets">
              {statusFilter === 'pendiente' && '✅ No hay tickets pendientes'}
              {statusFilter === 'pagado' && '📭 No hay tickets aceptados'}
              {statusFilter === 'rechazado' && '📭 No hay tickets rechazados'}
              {statusFilter === 'todos' && '📭 No hay tickets registrados'}
            </div>
          ) : (
            tickets.map((ticket) => {
              const statusDisplay = getStatusDisplay(ticket.estado_pago);
              return (
                <div key={ticket.id} className="ticket-card">
                  <div className="ticket-header">
                    <h4>{ticket.codigo_ticket}</h4>
                    <span className={`ticket-status ${statusDisplay.class}`}>
                      {statusDisplay.text}
                    </span>
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
                      👁️ Ver Detalles
                    </button>
                  </div>
                </div>
              );
            })
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
                  <p><strong>Estado:</strong> 
                    <span className={`status-${getStatusDisplay(selectedTicket.estado_pago).class}`}>
                      {getStatusDisplay(selectedTicket.estado_pago).text}
                    </span>
                  </p>
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
              {selectedTicket.estado_pago === 'pendiente' && (
                <>
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
                </>
              )}
              {selectedTicket.estado_pago === 'pagado' && (
                <div className="status-info accepted">
                  ✅ Este ticket ya está activado
                </div>
              )}
              {selectedTicket.estado_pago === 'rechazado' && (
                <div className="status-info rejected">
                  ❌ Este ticket fue rechazado
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketsManager;
