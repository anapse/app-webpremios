// routes/ticketRoutes.js

const express = require('express')
const router = express.Router()
const ticketController = require('../controllers/ticketController')

// Rutas para tickets
router.get('/', ticketController.getTickets)                    // GET /api/tickets - Todos los tickets
router.post('/', ticketController.createTicket)                // POST /api/tickets - Crear ticket
router.get('/dni/:dni', ticketController.getTicketsByDni)      // GET /api/tickets/dni/12345678 o 008027965 - Tickets por DNI/Carnet
router.get('/codigo/:codigo', ticketController.getTicketByCode) // GET /api/tickets/codigo/GZP001TK0001 - Ticket por código
router.patch('/:id/activate', ticketController.activateTicket) // PATCH /api/tickets/123/activate - Activar ticket pendiente

module.exports = router
