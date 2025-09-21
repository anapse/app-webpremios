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

// Validar códigos de acción según documentación oficial
function validateActionCode(actionCode, status) {
    const successCodes = ['000', '010']; // Códigos de autorización exitosa
    const isAuthorized = status === 'Authorized';
    const isSuccessCode = successCodes.includes(actionCode);

    return {
        isSuccess: isAuthorized && isSuccessCode,
        isAuthorized: isAuthorized,
        isSuccessCode: isSuccessCode,
        message: isAuthorized ? 'Transacción autorizada' : 'Transacción no autorizada'
    };
}

async function getAccessToken() {
    if (!NIUBIZ_USER || !NIUBIZ_PASS) {
        throw new Error('Credenciales Niubiz no configuradas correctamente');
    }

    console.log('🔑 Intentando obtener token con:', {
        user: NIUBIZ_USER,
        passLength: NIUBIZ_PASS ? NIUBIZ_PASS.length : 0,
        base: NIUBIZ_BASE
    });

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

        console.log('✅ Token obtenido exitosamente');
        // ✅ CORRECCIÓN CRÍTICA: Retornar Bearer + token
        return `Bearer ${response.data}`;
    } catch (error) {
        console.error('❌ Error obteniendo token:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
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

        // Obtener IP del cliente correctamente
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0] ||
                        req.connection.remoteAddress ||
                        req.socket.remoteAddress ||
                        req.connection.socket.remoteAddress ||
                        '127.0.0.1';

        console.log('🌐 Cliente IP detectada:', clientIp);

        const payload = {
            channel: "web",
            amount: parseFloat(amount),
            antifraud: {
                clientIp: clientIp,
                merchantDefineData: {
                    MDD4: customer.email || `${customer.dni}@gameztore.com`,
                    MDD32: customer.email || `${customer.dni}@gameztore.com`,
                    MDD75: "invitado",
                    MDD77: 1
                }
            },
            dataMap: {
                cardholderCity: customer.ciudad || "Lima",
                cardholderCountry: "PE",
                cardholderAddress: customer.direccion || "Av los Maestros 206 INT 158",
                cardholderPostalCode: customer.codigoPostal || "15074",
                cardholderState: "LIM", // ISO 3166-2 para Lima
                cardholderPhoneNumber: customer.telefono || "987654321"
            },
            timeoutUrl: `${baseUrl}/pay?status=timeout`
        };

        console.log('📦 Payload para Niubiz:', JSON.stringify(payload, null, 2));

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
        console.error('❌ Error createSession detallado:', {
            message: err.message,
            status: err.response?.status,
            statusText: err.response?.statusText,
            data: err.response?.data,
            url: err.config?.url,
            method: err.config?.method,
            headers: err.config?.headers
        });
        
        return res.status(err.response?.status || 500).json({
            error: 'Error creando sesión de pago',
            details: err.response?.data || err.message,
            niubizStatus: err.response?.status,
            niubizError: err.response?.data
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

        // Payload según documentación oficial - tokenId DENTRO del objeto order
        const payload = {
            channel: "web",
            captureType: "manual",
            countable: true,
            order: {
                tokenId: tokenId,  // Movido DENTRO del objeto order
                purchaseNumber: purchaseNumber,
                amount: parseFloat(amount),
                currency: currency
            },
            dataMap: {
                urlAddress: "https://gameztorepremios.com",
                serviceLocationCityName: "Lima",
                serviceLocationCountrySubdivisionCode: "LIM", // ISO 3166-2
                serviceLocationCountryCode: "PER", // ISO 3166-1 alpha-3
                serviceLocationPostalCode: "15074"
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

        // Validar STATUS según documentación oficial
        const status = data.dataMap?.STATUS;
        const actionCode = data.dataMap?.ACTION_CODE;
        const validation = validateActionCode(actionCode, status);

        console.log(`✅ Respuesta autorización - STATUS: ${status}, ACTION_CODE: ${actionCode}`);

        // Agregar información de validación a la respuesta
        const response = {
            ...data,
            isAuthorized: validation.isAuthorized,
            isSuccess: validation.isSuccess,
            statusValidation: {
                status: status,
                actionCode: actionCode,
                isSuccess: validation.isSuccess,
                isAuthorized: validation.isAuthorized,
                isSuccessCode: validation.isSuccessCode,
                message: validation.message
            }
        };

        return res.json(response);
    } catch (err) {
        console.error('❌ Error autorización:', err.message);

        const errorData = err.response?.data || {};
        const actionCode = errorData.data?.ACTION_CODE || 'unknown';
        const actionDescription = errorData.data?.ACTION_DESCRIPTION || err.message;
        const status = errorData.data?.STATUS || 'Unknown';

        // Determinar si es un error de CVV2 u otro específico
        const isSuccessCode = ['000', '010'].includes(actionCode);
        const isCvvError = actionDescription?.toLowerCase().includes('cvv');

        return res.status(400).json({
            error: 'Error autorizando transacción',
            actionCode: actionCode,
            actionDescription: actionDescription,
            status: status,
            isSuccessCode: isSuccessCode,
            isCvvError: isCvvError,
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
