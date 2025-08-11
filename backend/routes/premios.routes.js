const express = require('express');
const router = express.Router();
const {
    getPremios,
    createPremio,
    updatePremioById, // patch para uno

    deletePremioById
} = require('../controllers/premios.controller');

// Obtener premios (opcionalmente por sorteo_id)
router.get('/', getPremios);

// Crear premio individual
router.post('/', createPremio);

// Actualizar un premio por ID
router.patch('/:id', updatePremioById);



// Eliminar premio por ID
router.delete('/:id', deletePremioById);

module.exports = router;
