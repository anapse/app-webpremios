const express = require('express');
const router = express.Router();
const {
    getHomeBanner,
    updateHomeBanner
} = require('../controllers/homeBanner.controller');

// Obtener banner activo del home
router.get('/', getHomeBanner);

// Actualizar banner del home
router.put('/', updateHomeBanner);

module.exports = router;
