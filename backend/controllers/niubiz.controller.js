// controllers/niubiz.controller.js
require('dotenv').config();
const axios = require('axios');

// Función para limpiar comillas de las variables de entorno
function cleanEnvVar(value) {
    if (!value) return value;
    // Remover comillas al inicio y final si existen
    return value.replace(/^["']|["']$/g, '');
}

const {
    NIUBIZ_BASE = 'https://apisandbox.vnforappstest.com', // sandbox por defecto
    NIUBIZ_USER: RAW_NIUBIZ_USER,
    NIUBIZ_PASS: RAW_NIUBIZ_PASS,
    NIUBIZ_MERCHANT: RAW_NIUBIZ_MERCHANT,
} = process.env;

// Limpiar las credenciales de posibles comillas
const NIUBIZ_USER = cleanEnvVar(RAW_NIUBIZ_USER);
const NIUBIZ_PASS = cleanEnvVar(RAW_NIUBIZ_PASS);
const NIUBIZ_MERCHANT = cleanEnvVar(RAW_NIUBIZ_MERCHANT);

// Debug: verificar que las credenciales se carguen correctamente
console.log('🔧 Niubiz Config:', {
    base: NIUBIZ_BASE,
    user: NIUBIZ_USER ? `${NIUBIZ_USER.substring(0, 5)}...` : 'MISSING',
    pass: NIUBIZ_PASS ? `${NIUBIZ_PASS.substring(0, 3)}...` : 'MISSING',
    merchant: NIUBIZ_MERCHANT ? `${NIUBIZ_MERCHANT.substring(0, 3)}...` : 'MISSING'
});

// Debug adicional: verificar caracteres especiales en la contraseña
console.log('🔍 Password length:', NIUBIZ_PASS ? NIUBIZ_PASS.length : 0);
console.log('🔍 Password contains #:', NIUBIZ_PASS ? NIUBIZ_PASS.includes('#') : false);
console.log('🔍 Raw credentials string length:', NIUBIZ_USER && NIUBIZ_PASS ? `${NIUBIZ_USER}:${NIUBIZ_PASS}`.length : 0);

// ---- helpers ----
function buildPurchaseNumber() {
    // 10 dígitos. Ajusta si tu comercio define otro esquema.
    return Date.now().toString().slice(-10);
}

async function getAccessToken() {
    console.log('🔑 Obteniendo token de acceso...');
    console.log('🔍 Environment mode:', NIUBIZ_BASE.includes('sandbox') ? 'SANDBOX' : 'PRODUCTION');

    // Verificar que las credenciales existan
    if (!NIUBIZ_USER || !NIUBIZ_PASS) {
        throw new Error('Credenciales Niubiz no configuradas correctamente');
    }

    const credentials = `${NIUBIZ_USER}:${NIUBIZ_PASS}`;
    const basic = Buffer.from(credentials).toString('base64');

    console.log('🔍 Credentials verificadas:', {
        userLength: NIUBIZ_USER.length,
        passLength: NIUBIZ_PASS.length,
        credentialsLength: credentials.length,
        base64Length: basic.length
    });

    const url = `${NIUBIZ_BASE}/api.security/v1/security`;
    console.log('🌐 URL:', url);

    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Basic ${basic}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000,
        });

        console.log('✅ Token obtenido exitosamente');
        return response.data;
    } catch (error) {
        console.error('❌ Error obteniendo token:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message,
            url: url
        });

        // Si es error 401, verificar si las credenciales están configuradas correctamente
        if (error.response?.status === 401) {
            console.error('🚨 Error 401: Credenciales inválidas o no autorizadas');
            console.error('💡 Verificar:');
            console.error('   - Usuario y contraseña correctos');
            console.error('   - Comercio habilitado en Niubiz');
            console.error('   - URL correcta (sandbox vs producción)');
        }

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
        console.log('🚀 Iniciando createSession...');
        console.log('📝 Body recibido:', req.body);

        const { amount, currency = 'PEN', customer = {} } = req.body || {};
        if (!amount) {
            console.log('❌ Amount faltante');
            return res.status(400).json({ error: 'amount requerido' });
        }

        if (!NIUBIZ_USER || !NIUBIZ_PASS || !NIUBIZ_MERCHANT) {
            console.log('❌ Credenciales faltantes');
            return res.status(500).json({ error: 'Credenciales Niubiz no configuradas' });
        }

        console.log('🔑 Obteniendo token de acceso...');
        const accessToken = await getAccessToken();

        // Payload según documentación oficial del Botón de Pago Web
        const payload = {
            channel: "web",
            amount: parseFloat(amount),
            antifraud: {
                clientIp: req.ip,
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
                cardholderAddress: customer.direccion || "Av Jose Pardo 831",
                cardholderPostalCode: customer.codigoPostal || "15074",
                cardholderState: "LIM",
                cardholderPhoneNumber: customer.telefono || "987654321"
            }
        };

        console.log('📦 Payload:', JSON.stringify(payload, null, 2));

        const url = `${NIUBIZ_BASE}/api.ecommerce/v2/ecommerce/token/session/${NIUBIZ_MERCHANT}`;
        console.log('🌐 URL de sesión:', url);

        const { data } = await axios.post(url, payload, {
            headers: {
                Authorization: accessToken,
                'Content-Type': 'application/json'
            },
            timeout: 15000,
        });

        console.log('✅ Respuesta de Niubiz:', JSON.stringify(data, null, 2));

        const resp = {
            sessionKey: data.sessionKey,
            expirationTime: data.expirationTime,
            merchantId: NIUBIZ_MERCHANT,
            amount: amount,
            currency: currency,
            // URL del script de checkout según documentación oficial
            checkoutUrl: NIUBIZ_BASE.includes('sandbox')
                ? 'https://static-content-qas.vnforapps.com/v2/js/checkout.js?qa=true'
                : 'https://static-content.vnforapps.com/v2/js/checkout.js'
        };

        console.log('📤 Respuesta final:', resp);
        return res.json(resp);
    } catch (err) {
        console.error('❌ Niubiz createSession error completo:', {
            message: err.message,
            status: err.response?.status,
            statusText: err.response?.statusText,
            data: err.response?.data,
            stack: err.stack
        });
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
        console.log('🚀 Iniciando authorizeTransaction...');
        console.log('📝 Body recibido:', req.body);

        const {
            transactionToken,
            purchaseNumber,
            amount,
            currency = 'PEN'
        } = req.body || {};

        if (!transactionToken || !purchaseNumber || !amount) {
            return res.status(400).json({
                error: 'transactionToken, purchaseNumber y amount son requeridos'
            });
        }

        // Validar que purchaseNumber sea numérico y máximo 12 dígitos
        if (!/^\d{1,12}$/.test(purchaseNumber)) {
            return res.status(400).json({
                error: 'purchaseNumber debe ser numérico con máximo 12 dígitos'
            });
        }

        const accessToken = await getAccessToken();

        // Formato v3 compatible: tokenId fuera de order
        const payload = {
            channel: "web",
            captureType: "manual",
            countable: true,
            tokenId: transactionToken,
            order: {
                purchaseNumber: purchaseNumber,
                amount: parseFloat(amount),
                currency: currency
            }
        };

        console.log('📦 Authorization Payload:', JSON.stringify(payload, null, 2));

        const url = `${NIUBIZ_BASE}/api.authorization/v3/authorization/ecommerce/${NIUBIZ_MERCHANT}`;
        console.log('🌐 URL de autorización:', url);

        const { data } = await axios.post(url, payload, {
            headers: {
                Authorization: accessToken,
                'Content-Type': 'application/json'
            },
            timeout: 15000,
        });

        console.log('✅ Respuesta de autorización:', JSON.stringify(data, null, 2));
        return res.json(data);
    } catch (err) {
        console.error('❌ Niubiz authorize error completo:', {
            message: err.message,
            status: err.response?.status,
            statusText: err.response?.statusText,
            data: err.response?.data
        });
        return res.status(400).json({
            error: 'Error autorizando transacción',
            details: err.response?.data || err.message
        });
    }
};

// ---- MANTENER COMPATIBILIDAD ----

/**
 * POST /api/niubiz/yape/create (redirige a createSession para compatibilidad)
 */
exports.createYape = exports.createSession;

/**
 * GET /api/niubiz/yape/status (no se necesita polling en Botón de Pago Web)
 */
exports.getYapeStatus = async (req, res) => {
    console.log('ℹ️ getYapeStatus: No se necesita polling en Botón de Pago Web');
    return res.json({ status: 'USE_WEB_CHECKOUT' });
};
