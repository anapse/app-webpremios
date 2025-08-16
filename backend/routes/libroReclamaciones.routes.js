const express = require('express');
const router = express.Router();
const {
    crearReclamo,
    getReclamos,
    updateEstado
} = require('../controllers/libroReclamacionesController'); // ← mismo patrón que ganadores

// Crear reclamo
router.post('/', crearReclamo);

// Listar (con filtros opcionales ?estado=&codigo=)
router.get('/', getReclamos);

// Actualizar estado
router.patch('/estado', updateEstado);

module.exports = router;
