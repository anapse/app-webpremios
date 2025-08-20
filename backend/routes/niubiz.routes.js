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

// ---- NUEVAS RUTAS SEGÚN DOCUMENTACIÓN DEL BOTÓN DE PAGO WEB ----

// Crear sesión de pago (nuevo flujo correcto)
router.post('/session/create', (req, res) => {
    if (hasRealCredentials()) {
        return niubizController.createSession(req, res);
    }

    // Modo de prueba con sesión simulada
    const purchaseNumber = Date.now().toString().slice(-10);
    return res.json({
        sessionKey: `sess_test_${purchaseNumber}`,
        expirationTime: 900000, // 15 minutos
        merchantId: 'TEST_MERCHANT',
        amount: req.body.amount,
        currency: 'PEN',
        checkoutUrl: 'https://pocpaymentserve.s3.amazonaws.com/checkout.js',
        testMode: true,
        message: "Modo de prueba - Sesión simulada para Botón de Pago Web"
    });
});

// Autorizar transacción (después del checkout web)
router.post('/authorize', (req, res) => {
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
            PURCHASE_NUMBER: req.body.purchaseNumber
        },
        testMode: true,
        message: "Modo de prueba - Transacción aprobada automáticamente"
    });
});

// ---- RUTAS DE COMPATIBILIDAD (LEGACY) ----

// Endpoint para formulario web de Niubiz (legacy)
router.post('/payment', (req, res) => {
    if (hasRealCredentials()) {
        return niubizController.createSession(req, res);
    }

    // Modo de prueba con formulario simulado
    const purchaseNumber = Date.now().toString().slice(-10);
    return res.json({
        purchaseNumber,
        sessionKey: `mock-session-${purchaseNumber}`,
        expirationTime: 900000, // 15 minutos
        merchantId: 'mock-merchant',
        amount: req.body.amount,
        currency: 'PEN',
        paymentUrl: 'https://example.com/mock-payment',
        testMode: true,
        message: "Modo de prueba - Configurar credenciales reales de Niubiz"
    });
});

// Mock mejorado para pruebas con QR simulado (legacy)
router.post('/yape/create', (req, res) => {
    if (hasRealCredentials()) {
        return niubizController.createYape(req, res);
    }

    // Modo de prueba con QR simulado
    const purchaseNumber = Date.now().toString().slice(-10);

    // QR de prueba (imagen base64 pequeña de ejemplo)
    const qrBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

    return res.json({
        purchaseNumber,
        transactionId: `TX-TEST-${purchaseNumber}`,
        qrBase64,
        deepLink: `yape://pay?amount=${req.body.amount}&merchant=TEST`,
        testMode: true,
        message: "Modo de prueba - Configurar credenciales reales de Niubiz"
    });
});

// Simulador de estados de pago para pruebas
const testTransactions = new Map();

router.get('/yape/status', (req, res) => {
    if (hasRealCredentials()) {
        return niubizController.getYapeStatus(req, res);
    }

    const { purchaseNumber } = req.query;
    if (!purchaseNumber) {
        return res.status(400).json({ error: 'purchaseNumber requerido' });
    }

    // Simular progresión de estados para pruebas
    if (!testTransactions.has(purchaseNumber)) {
        testTransactions.set(purchaseNumber, {
            status: 'PENDING',
            created: Date.now(),
            attempts: 0
        });
    }

    const transaction = testTransactions.get(purchaseNumber);
    transaction.attempts++;

    // Después de 3 consultas (simulando 15 segundos), aprobar la transacción
    if (transaction.attempts >= 3) {
        transaction.status = 'APPROVED';
    }

    return res.json({
        status: transaction.status,
        transactionId: `TX-TEST-${purchaseNumber}`,
        token: transaction.status === 'APPROVED' ? `TOKEN-${purchaseNumber}` : null,
        testMode: true,
        attempt: transaction.attempts
    });
});

module.exports = router;
