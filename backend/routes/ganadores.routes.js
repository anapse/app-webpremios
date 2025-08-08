const express = require('express');
const router = express.Router();
const { getGanadores, addGanador } = require('../controllers/ganadores.controller');

router.get('/', getGanadores);
router.post('/', addGanador);

module.exports = router;
