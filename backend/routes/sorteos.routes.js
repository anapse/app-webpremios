const express = require('express');
const router = express.Router();
const {
    getSorteos,
    getSorteoAnterior,
    getSorteoSiguiente,
    getSorteoById,
    createSorteo,
    updateSorteoById
} = require('../controllers/sorteos.controller');

// Rutas específicas primero
router.get('/ultimo', getSorteoAnterior);
router.get('/proximo', getSorteoSiguiente);
// Rutas generales
router.get('/', getSorteos);
router.post('/', createSorteo);

// Rutas con parámetros al final
router.get('/:id', getSorteoById);
router.patch('/:id', updateSorteoById);

module.exports = router;
