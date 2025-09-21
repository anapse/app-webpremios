// controllers/niubiz.controller.js
require('dotenv').config();
const axios = require('axios');

// Almacén temporal para datos de sesión (en producción usar Redis)
const sessionStore = new Map();

// Función para limpiar comillas de las variables de entorno
function cleanEnvVar(value) {
    if (!value) return value;
    // Remover comillas al inicio y final si existen
    return value.replace(/^["']|["']$/g, '');
}

const {
    NIUBIZ_BASE = 'https://apiprod.vnforapps.com', // producción por defecto para testing
    NIUBIZ_USER: RAW_NIUBIZ_USER,
    NIUBIZ_PASS: RAW_NIUBIZ_PASS,
    NIUBIZ_MERCHANT: RAW_NIUBIZ_MERCHANT,
} = process.env;

// Limpiar las credenciales de posibles comillas
const NIUBIZ_USER = cleanEnvVar(RAW_NIUBIZ_USER);
const NIUBIZ_PASS = cleanEnvVar(RAW_NIUBIZ_PASS);
const NIUBIZ_MERCHANT = cleanEnvVar(RAW_NIUBIZ_MERCHANT);

// ---- helpers ----
function buildPurchaseNumber() {
    // 10 dígitos. Ajusta si tu comercio define otro esquema.
    return Date.now().toString().slice(-10);
}

async function getAccessToken() {
    if (!NIUBIZ_USER || !NIUBIZ_PASS) {
        throw new Error('Credenciales Niubiz no configuradas correctamente');
    }

    const credentials = `${NIUBIZ_USER}:${NIUBIZ_PASS}`;
    const basic = Buffer.from(credentials).toString('base64');
    const url = `${NIUBIZ_BASE}/api.security/v1/security`;

    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Basic ${basic}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000,
        });

        return response.data;
    } catch (error) {
        console.error('❌ Error obteniendo token:', error.response?.status, error.message);
        throw error;
    }
}

// ---- CONTROLADORES CORRECTOS SEGÚN DOCUMENTACIÓN ----

/**
 * POST /api/niubiz/session/create
 * Crear token de sesión según documentación oficial del Botón de Pago Web
 */
exports.createSession = async (req, res) => {
    try {
        console.log('🚀 createSession iniciado');

        const { amount, currency = 'PEN', customer = {}, formData = {} } = req.body || {};
        if (!amount) {
            return res.status(400).json({ error: 'amount requerido' });
        }

        if (!NIUBIZ_USER || !NIUBIZ_PASS || !NIUBIZ_MERCHANT) {
            return res.status(500).json({ error: 'Credenciales Niubiz no configuradas' });
        }

        const accessToken = await getAccessToken();

        const FRONTEND_URL = process.env.FRONTEND_URL || 'https://gameztorepremios.com';
        const actionBaseUrl = 'https://gameztorepremios.com';
        const baseUrl = FRONTEND_URL;

        const payload = {
            channel: "web",
            amount: parseFloat(amount),
            antifraud: {
                clientIp: req.headers['x-forwarded-for'] ||
                    req.connection.remoteAddress ||
                    req.socket.remoteAddress ||
                    req.connection.socket.remoteAddress,
                merchantDefineData: {
                    MDD4: customer.email || `${customer.dni}@gameztore.com`,
                    MDD32: customer.email || `${customer.dni}@gameztore.com`,
                    MDD75: "invitado",
                    MDD77: 1
                }
            },
            dataMap: {
                cardholderCity: customer.ciudad || "ICA",
                cardholderCountry: "PE",
                cardholderAddress: customer.direccion || "Av los Maestros 206 INT 158",
                cardholderPostalCode: customer.codigoPostal || "15074",
                cardholderState: customer.ciudad || "ICA",
                cardholderPhoneNumber: customer.telefono || "987654321"
            },
            timeoutUrl: `${baseUrl}/pay?status=timeout`,
        };

        const url = `${NIUBIZ_BASE}/api.ecommerce/v2/ecommerce/token/session/${NIUBIZ_MERCHANT}`;

        const { data } = await axios.post(url, payload, {
            headers: {
                Authorization: accessToken,
                'Content-Type': 'application/json'
            },
            timeout: 15000,
        });

        console.log('✅ Sesión creada exitosamente');

        const purchaseNumber = buildPurchaseNumber();

        sessionStore.set(purchaseNumber, {
            formData,
            amount: parseFloat(amount),
            currency,
            customer,
            timestamp: new Date().toISOString()
        });

        const currentTime = Date.now();
        const niubizTime = data.expirationTime;
        const isDuration = niubizTime < 86400000;

        let finalExpirationTime;
        if (!isDuration) {
            const maxValidExpiration = currentTime + (10 * 60 * 1000);
            finalExpirationTime = Math.min(niubizTime, maxValidExpiration);
        } else {
            finalExpirationTime = currentTime + niubizTime;
        }

        const resp = {
            sessionKey: data.sessionKey,
            expirationTime: finalExpirationTime,
            merchantId: NIUBIZ_MERCHANT,
            purchaseNumber: purchaseNumber,
            amountStr: parseFloat(amount).toFixed(2),
            currency: currency,
            apiBase: NIUBIZ_BASE,
            staticContentBase: NIUBIZ_BASE.includes('sandbox')
                ? 'https://static-content-qas.vnforapps.com'
                : 'https://static-content.vnforapps.com',
            checkoutUrl: NIUBIZ_BASE.includes('sandbox')
                ? 'https://static-content-qas.vnforapps.com/env/sandbox/js/checkout.js'
                : 'https://static-content.vnforapps.com/v2/js/checkout.js',
            action: `${actionBaseUrl}/api/niubiz/payment-response?purchaseNumber=${purchaseNumber}`,
            timeoutUrl: `${baseUrl}/pay?status=timeout`,
            errorUrl: `${baseUrl}/pay?status=error`,
            formData: formData
        };

        return res.json(resp);
    } catch (err) {
        console.error('❌ Error createSession:', err.message);
        return res.status(400).json({
            error: 'Error creando sesión de pago',
            details: err.response?.data || err.message
        });
    }
};

/**
 * POST /api/niubiz/authorize
 * Autorizar transacción después del checkout web
 */
exports.authorizeTransaction = async (req, res) => {
    try {
        console.log('🚀 authorizeTransaction iniciado');

        const {
            tokenId,
            purchaseNumber,
            amount,
            currency = 'PEN'
        } = req.body || {};

        if (!tokenId || !purchaseNumber || !amount) {
            return res.status(400).json({
                error: 'tokenId, purchaseNumber y amount son requeridos'
            });
        }

        if (!/^\d{1,12}$/.test(purchaseNumber)) {
            return res.status(400).json({
                error: 'purchaseNumber debe ser numérico con máximo 12 dígitos'
            });
        }

        const accessToken = await getAccessToken();

        const payload = {
            channel: "web",
            captureType: "manual",
            countable: true,
            tokenId: tokenId,
            order: {
                purchaseNumber: purchaseNumber,
                amount: parseFloat(amount),
                currency: currency
            }
        };

        const url = `${NIUBIZ_BASE}/api.authorization/v3/authorization/ecommerce/${NIUBIZ_MERCHANT}`;

        const { data } = await axios.post(url, payload, {
            headers: {
                Authorization: accessToken,
                'Content-Type': 'application/json'
            },
            timeout: 15000,
        });

        console.log('✅ Autorización exitosa');
        return res.json(data);
    } catch (err) {
        console.error('❌ Error autorización:', err.message);

        const errorData = err.response?.data || {};
        const actionCode = errorData.data?.ACTION_CODE || 'unknown';
        const actionDescription = errorData.data?.ACTION_DESCRIPTION || err.message;

        return res.status(400).json({
            error: 'Error autorizando transacción',
            actionCode: actionCode,
            actionDescription: actionDescription,
            details: errorData,
            originalError: err.message
        });
    }
};

// ---- MANTENER COMPATIBILIDAD ----

/**
 * POST /api/niubiz/yape/create (redirige a createSession para compatibilidad)
 */
exports.createYape = exports.createSession;

/**
 * POST /api/niubiz/payment-response
 * Recibe la respuesta POST del formulario de pago de Niubiz
 * según documentación oficial del Botón de Pago App
 */
exports.receivePaymentResponse = async (req, res) => {
    try {
        console.log('📝 Respuesta recibida de Niubiz');

        const { transactionToken, customerEmail, channel, url } = req.body || {};
        const purchaseNumber = req.query.purchaseNumber;

        if (!transactionToken) {
            return res.status(400).json({ error: 'transactionToken requerido' });
        }

        const sessionData = purchaseNumber ? sessionStore.get(purchaseNumber) : null;

        // PagoEfectivo
        if (channel === 'pagoefectivo') {
            const params = new URLSearchParams({
                status: 'pagoefectivo',
                cipCode: transactionToken,
                url: url || '',
                purchaseNumber: purchaseNumber || ''
            });

            if (sessionData) {
                params.append('amount', sessionData.amount.toString());
                params.append('currency', sessionData.currency);
                if (sessionData.formData) {
                    params.append('formData', JSON.stringify(sessionData.formData));
                }
            }

            const redirectUrl = `${process.env.FRONTEND_URL || 'https://gameztorepremios.com'}/pay?${params.toString()}`;
            return res.redirect(redirectUrl);
        }

        // Yape
        if (channel === 'yape' || channel === 'wallet') {
            console.log('📱 Pago Yape detectado');

            const params = new URLSearchParams({
                status: 'yape_success',
                transactionToken: transactionToken,
                customerEmail: customerEmail || '',
                channel: 'yape',
                purchaseNumber: purchaseNumber || ''
            });

            if (sessionData) {
                params.append('amount', sessionData.amount.toString());
                params.append('currency', sessionData.currency);
                if (sessionData.formData) {
                    params.append('formData', JSON.stringify(sessionData.formData));
                }
                sessionStore.delete(purchaseNumber);
            }

            const redirectUrl = `${process.env.FRONTEND_URL || 'https://gameztorepremios.com'}/pay?${params.toString()}`;
            return res.redirect(redirectUrl);
        }

        // Tarjetas - Sin autorización automática
        console.log('💳 Pago con tarjeta detectado');

        const params = new URLSearchParams({
            status: 'success',
            transactionToken: transactionToken,
            customerEmail: customerEmail || '',
            channel: channel || 'web',
            purchaseNumber: purchaseNumber || ''
        });

        if (sessionData) {
            params.append('amount', sessionData.amount.toString());
            params.append('currency', sessionData.currency);
            if (sessionData.formData) {
                params.append('formData', JSON.stringify(sessionData.formData));
            }
            sessionStore.delete(purchaseNumber);
        }

        const redirectUrl = `${process.env.FRONTEND_URL || 'https://gameztorepremios.com'}/pay?${params.toString()}`;

        console.log('🔄 Redirigiendo al frontend');
        return res.redirect(redirectUrl);

    } catch (error) {
        console.error('❌ Error procesando respuesta:', error.message);
        return res.status(500).json({
            error: 'Error procesando respuesta de pago',
            details: error.message
        });
    }
};

/**
 * GET /api/niubiz/yape/status (no se necesita polling en Botón de Pago Web)
 */
exports.getYapeStatus = async (req, res) => {
    console.log('ℹ️ getYapeStatus: No se necesita polling en Botón de Pago Web');
    return res.json({ status: 'USE_WEB_CHECKOUT' });
};
