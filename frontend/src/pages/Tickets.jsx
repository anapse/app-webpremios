import React, { useState } from "react";
import useFetch from "../hooks/useFetch";
import apiRoutes from "../apiRoutes";
import "../styles/Tickets.css";

export default function Tickets() {
    const [dni, setDni] = useState("");
    const [codigoTicket, setCodigoTicket] = useState("");
    const [searchMode, setSearchMode] = useState("dni"); // "dni" o "codigo"
    const [hasSearched, setHasSearched] = useState(false);

    // URL de búsqueda dinámica
    const searchUrl = hasSearched 
        ? (searchMode === "dni" && dni 
            ? apiRoutes.ticketsByDni(dni)
            : searchMode === "codigo" && codigoTicket
            ? apiRoutes.ticketByCode(codigoTicket)
            : null)
        : null;

    const { 
        data: ticketsData, 
        loading: loadingTickets, 
        error: errorTickets 
    } = useFetch(searchUrl, { useGlobalLoader: true });

    const handleSearch = (e) => {
        e.preventDefault();
        if ((searchMode === "dni" && dni.trim()) || (searchMode === "codigo" && codigoTicket.trim())) {
            setHasSearched(true);
        }
    };

    const resetSearch = () => {
        setDni("");
        setCodigoTicket("");
        setHasSearched(false);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getEstadoPagoColor = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'pagado':
            case 'completado':
                return '#28a745';
            case 'pendiente':
                return '#ffc107';
            case 'rechazado':
            case 'fallido':
                return '#dc3545';
            default:
                return '#6c757d';
        }
    };

    const renderTickets = () => {
        if (!hasSearched) return null;

        if (loadingTickets) {
            return (
                <div className="tickets-loading">
                    <p>🔍 Buscando tickets...</p>
                </div>
            );
        }

        if (errorTickets) {
            return (
                <div className="tickets-error">
                    <p>❌ Error al buscar tickets: {errorTickets}</p>
                    <button onClick={resetSearch} className="btn-reset">
                        Intentar de nuevo
                    </button>
                </div>
            );
        }

        // Para búsqueda por código (un solo ticket)
        if (searchMode === "codigo" && ticketsData) {
            const ticket = ticketsData;
            return (
                <div className="tickets-results">
                    <h3>🎟️ Ticket encontrado</h3>
                    <div className="ticket-card">
                        <div className="ticket-header">
                            <h4>{ticket.codigo_ticket}</h4>
                            <span 
                                className="estado-badge"
                                style={{ backgroundColor: getEstadoPagoColor(ticket.estado_pago) }}
                            >
                                {ticket.estado_pago}
                            </span>
                        </div>
                        <div className="ticket-info">
                            <p><strong>Nombre:</strong> {ticket.nombres}</p>
                            <p><strong>DNI/CE:</strong> {ticket.dni}</p>
                            <p><strong>Teléfono:</strong> {ticket.telefono}</p>
                            <p><strong>Departamento:</strong> {ticket.departamento}</p>
                            <p><strong>Fecha:</strong> {formatDate(ticket.fecha)}</p>
                        </div>
                    </div>
                </div>
            );
        }

        // Para búsqueda por DNI/CE (múltiples tickets)
        if (searchMode === "dni" && Array.isArray(ticketsData)) {
            if (ticketsData.length === 0) {
                return (
                    <div className="tickets-empty">
                        <p>🔍 No se encontraron tickets para el DNI/CE: {dni}</p>
                        <button onClick={resetSearch} className="btn-reset">
                            Nueva búsqueda
                        </button>
                    </div>
                );
            }

            return (
                <div className="tickets-results">
                    <h3>🎟️ Tickets encontrados ({ticketsData.length})</h3>
                    <div className="tickets-grid">
                        {ticketsData.map((ticket) => (
                            <div key={ticket.id} className="ticket-card">
                                <div className="ticket-header">
                                    <h4>{ticket.codigo_ticket}</h4>
                                    <span 
                                        className="estado-badge"
                                        style={{ backgroundColor: getEstadoPagoColor(ticket.estado_pago) }}
                                    >
                                        {ticket.estado_pago}
                                    </span>
                                </div>
                                <div className="ticket-info">
                                    <p><strong>Sorteo:</strong> {ticket.nombre_sorteo || `Sorteo #${ticket.sorteo_id}`}</p>
                                    <p><strong>Fecha:</strong> {formatDate(ticket.fecha)}</p>
                                    <p><strong>Estado:</strong> {ticket.estado_pago}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="tickets-page">
            <div className="container">
                <header className="tickets-header">
                    <h1>🎟️ Mis Tickets</h1>
                    <p>Busca tus tickets por DNI/CE o código de ticket</p>
                </header>

                <div className="search-section">
                    <div className="search-modes">
                        <button 
                            className={`mode-btn ${searchMode === "dni" ? "active" : ""}`}
                            onClick={() => setSearchMode("dni")}
                        >
                            Buscar por DNI / CE
                        </button>
                        <button 
                            className={`mode-btn ${searchMode === "codigo" ? "active" : ""}`}
                            onClick={() => setSearchMode("codigo")}
                        >
                            Buscar por Código
                        </button>
                    </div>

                    <form onSubmit={handleSearch} className="search-form">
                        {searchMode === "dni" ? (
                            <div className="form-group">
                                <label htmlFor="dni">DNI o Carnet de Extranjería:</label>
                                <input
                                    type="text"
                                    id="dni"
                                    value={dni}
                                    onChange={(e) => setDni(e.target.value)}
                                    placeholder="Ingresa tu DNI o Carnet de Extranjería"
                                    maxLength={12}
                                    pattern="[0-9]{8,12}"
                                    required
                                />
                            </div>
                        ) : (
                            <div className="form-group">
                                <label htmlFor="codigo">Código del Ticket:</label>
                                <input
                                    type="text"
                                    id="codigo"
                                    value={codigoTicket}
                                    onChange={(e) => setCodigoTicket(e.target.value.toUpperCase())}
                                    placeholder="Ej: GZP001TK0001"
                                    required
                                />
                            </div>
                        )}

                        <div className="form-actions">
                            <button type="submit" className="btn-search">
                                🔍 Buscar Tickets
                            </button>
                            {hasSearched && (
                                <button type="button" onClick={resetSearch} className="btn-reset">
                                    Nueva búsqueda
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {renderTickets()}
            </div>
        </div>
    );
}
