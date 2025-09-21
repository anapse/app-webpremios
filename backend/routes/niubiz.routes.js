// routes/niubiz.routes.js
const express = require('express');
const niubizController = require('../controllers/niubiz.controller');
const router = express.Router();

router.get('/ping', (req, res) => res.json({ ok: true, service: 'niubiz' }));

// Función para verificar si tenemos credenciales reales
const hasRealCredentials = () => {
    const { NIUBIZ_USER, NIUBIZ_PASS, NIUBIZ_MERCHANT } = process.env;
    const hasReal = NIUBIZ_USER && NIUBIZ_PASS && NIUBIZ_MERCHANT &&
        NIUBIZ_USER !== 'tu_user' &&
        NIUBIZ_PASS !== 'tu_pass' &&
        NIUBIZ_MERCHANT !== 'tu_merchant_id';

    console.log('🔍 Verificando credenciales reales:', {
        hasUser: !!NIUBIZ_USER,
        hasPass: !!NIUBIZ_PASS,
        hasMerchant: !!NIUBIZ_MERCHANT,
        userNotDefault: NIUBIZ_USER !== 'tu_user',
        passNotDefault: NIUBIZ_PASS !== 'tu_pass',
        merchantNotDefault: NIUBIZ_MERCHANT !== 'tu_merchant_id',
        finalResult: hasReal
    });

    return hasReal;
};

// ---- ENDPOINTS PRINCIPALES SEGÚN DOCUMENTACIÓN ----

// POST /api/niubiz/session - Alias para session/create
router.post('/session', (req, res) => {
    console.log('📝 POST /session - redirigiendo a /session/create');
    return niubizController.createSession(req, res);
});

// POST /api/niubiz/session/create - Crear token de sesión para Botón de Pago Web
router.post('/session/create', (req, res) => {
    console.log('📝 POST /session/create - Body:', req.body);

    if (hasRealCredentials()) {
        return niubizController.createSession(req, res);
    }

    // Modo de prueba con sesión simulada - URLs de producción para testing
    const purchaseNumber = Date.now().toString().slice(-10);
    const expirationTimestamp = Date.now() + 900000; // Simular expiración en 15 minutos

    return res.json({
        sessionKey: `sess_test_${purchaseNumber}`,
        expirationTime: expirationTimestamp, // ENVIAR TIMESTAMP EXACTO
        merchantId: 'TEST_MERCHANT',
        purchaseNumber: purchaseNumber,
        amountStr: parseFloat(req.body.amount || '15.00').toFixed(2), // String con 2 decimales
        currency: 'PEN',
        checkoutUrl: 'https://static-content.vnforapps.com/v2/js/checkout.js', // Producción para testing
        staticContentBase: 'https://static-content.vnforapps.com', // Producción para testing
        testMode: true,
        message: "Modo de prueba - Sesión simulada con URLs de producción"
    });
});

// POST /api/niubiz/confirm - Alias para authorize
router.post('/confirm', (req, res) => {
    console.log('📝 POST /confirm - redirigiendo a authorize');
    if (hasRealCredentials()) {
        return niubizController.authorizeTransaction(req, res);
    }

    // Modo de prueba con autorización simulada
    return res.json({
        dataMap: {
            ACTION_CODE: "000",
            ACTION_DESCRIPTION: "Aprobado",
            AMOUNT: req.body.amount,
            CURRENCY: "PEN",
            TRANSACTION_ID: `TXN_TEST_${Date.now()}`,
            PURCHASE_NUMBER: req.body.purchaseNumber,
            AUTHORIZATION_CODE: "123456",
            TRACE_NUMBER: "000001",
            ORDER_ID: req.body.purchaseNumber
        },
        testMode: true,
        message: "Modo de prueba - Transacción aprobada automáticamente"
    });
});

// POST /api/niubiz/payment-response - Recibe respuesta POST del formulario de Niubiz
router.post('/payment-response', (req, res) => {
    console.log('📝 POST /payment-response - Respuesta de formulario Niubiz');
    return niubizController.receivePaymentResponse(req, res);
});

// POST /api/niubiz/authorize - Autorizar transacción después del checkout
router.post('/authorize', (req, res) => {
    console.log('📝 POST /authorize - Body:', req.body);

    if (hasRealCredentials()) {
        return niubizController.authorizeTransaction(req, res);
    }

    // Modo de prueba con autorización simulada
    return res.json({
        dataMap: {
            ACTION_CODE: "000",
            ACTION_DESCRIPTION: "Aprobado",
            AMOUNT: parseFloat(req.body.amount || '0').toFixed(2),
            CURRENCY: "PEN",
            TRANSACTION_ID: `TXN_TEST_${Date.now()}`,
            PURCHASE_NUMBER: req.body.purchaseNumber,
            AUTHORIZATION_CODE: "123456",
            TRACE_NUMBER: "000001",
            ORDER_ID: req.body.purchaseNumber
        },
        testMode: true,
        message: "Modo de prueba - Transacción aprobada automáticamente"
    });
});

// ---- ENDPOINTS DE COMPATIBILIDAD (LEGACY) ----

// POST /api/niubiz/payment - Endpoint legacy que redirige a session/create
router.post('/payment', (req, res) => {
    console.log('📝 POST /payment (legacy) - redirigiendo a /session/create');
    req.url = '/session/create';
    return router.handle(req, res);
});

// POST /api/niubiz/yape/create - Endpoint legacy que redirige a session/create  
router.post('/yape/create', (req, res) => {
    console.log('📝 POST /yape/create (legacy) - redirigiendo a /session/create');
    req.url = '/session/create';
    return router.handle(req, res);
});

// GET /api/niubiz/yape/status - Ya no necesario con Botón de Pago Web
router.get('/yape/status', (req, res) => {
    console.log('ℹ️ GET /yape/status - No se necesita polling en Botón de Pago Web');
    return res.json({
        status: 'USE_WEB_CHECKOUT',
        message: 'Usar Botón de Pago Web en lugar de polling'
    });
});

module.exports = router;
