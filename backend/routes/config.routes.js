// routes/config.routes.js
const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');

// Configuración del sistema
router.get('/', configController.getConfig);                    // GET /api/config
router.put('/', configController.updateConfig);                // PUT /api/config
router.get('/tickets', configController.getTicketsByStatus);    // GET /api/config/tickets?status=pendiente
router.get('/tickets/pending', configController.getPendingTickets); // GET /api/config/tickets/pending (compatibilidad)

module.exports = router;
