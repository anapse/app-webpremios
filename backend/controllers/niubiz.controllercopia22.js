// controllers/niubiz.controller.js
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Función para escribir logs detallados
function writeDetailedLog(operation, data) {
    const timestamp = new Date().toISOString();
    const logDir = path.join(__dirname, '../logs');

    // Crear directorio de logs si no existe
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    const logFile = path.join(logDir, `niubiz-${new Date().toISOString().split('T')[0]}.log`);
    const logEntry = `
=====================================
${timestamp} - ${operation}
=====================================
${JSON.stringify(data, null, 2)}
=====================================

`;

    fs.appendFileSync(logFile, logEntry);
    console.log(`📝 Log detallado guardado en: ${logFile}`);
}

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
    console.log('🔑 Obteniendo token de acceso...');
    console.log('🔍 Environment mode:', NIUBIZ_BASE.includes('sandbox') ? 'SANDBOX' : 'PRODUCTION');

    // Verificar que las credenciales existan
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

        const { amount, currency = 'PEN', customer = {}, formData = {} } = req.body || {};
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
        console.log('🔑 Token recibido:', accessToken ? accessToken.substring(0, 20) + '...' : 'null');

        // Log para verificar IP recibida
        console.log('🌐 IP recibida del frontend:', req.body.clientIp);


        // Configurar URLs de retorno según el ambiente
        const FRONTEND_URL = process.env.FRONTEND_URL || 'https://gameztorepremios.com';
        // Para el action URL, SIEMPRE usar producción porque Niubiz necesita hacer POST ahí
        const actionBaseUrl = 'https://gameztorepremios.com';
        // Para timeout, usar la URL configurada normalmente
        const baseUrl = FRONTEND_URL;

        console.log('🌐 URLs de retorno configuradas:', {
            frontendUrl: FRONTEND_URL,
            actionBaseUrl: actionBaseUrl,
            baseUrl: baseUrl
        });

        // Payload según documentación oficial del Botón de Pago Web
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
            // CONFIGURAR URLs de retorno para Niubiz (redirigir a /pay)

            timeoutUrl: `${baseUrl}/pay?status=timeout`,
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

        console.log('✅ Respuesta de Niubiz (createSession):');
        console.log('=====================================');
        console.log(JSON.stringify(data, null, 2));
        console.log('=====================================');

        // Guardar respuesta detallada en archivo de log
        writeDetailedLog('CREATE_SESSION_RESPONSE', {
            timestamp: new Date().toISOString(),
            requestPayload: payload,
            niubizResponse: data,
            operation: 'createSession'
        });

        // Generar purchaseNumber único de 10 dígitos
        const purchaseNumber = buildPurchaseNumber();

        // Guardar datos de la sesión para uso posterior
        sessionStore.set(purchaseNumber, {
            formData,
            amount: parseFloat(amount),
            currency,
            customer,
            timestamp: new Date().toISOString()
        });

        console.log(`💾 Datos de sesión guardados para purchaseNumber: ${purchaseNumber}`);

        // MANEJAR EXPIRACIÓN CORRECTAMENTE
        // Verificar si Niubiz devuelve timestamp absoluto o duración
        const currentTime = Date.now();
        const niubizTime = data.expirationTime;

        // Lógica mejorada: Si el valor es un timestamp cercano al tiempo actual, es absoluto
        // Si el valor es menor a 24 horas en ms (86400000), probablemente es duración
        const isDuration = niubizTime < 86400000; // menos de 24 horas = duración
        const isAbsoluteTimestamp = !isDuration;

        let finalExpirationTime;
        if (isAbsoluteTimestamp) {
            console.log('🐛 DETECTADO: Niubiz devolvió timestamp absoluto en lugar de duración');
            // Usar directamente el timestamp de Niubiz pero limitarlo a 10 minutos máximo (más conservador)
            const maxValidExpiration = currentTime + (10 * 60 * 1000); // máximo 10 minutos
            finalExpirationTime = Math.min(niubizTime, maxValidExpiration);
        } else {
            console.log('✅ DETECTADO: Niubiz devolvió duración en milisegundos');
            // Es una duración, sumar al tiempo actual
            finalExpirationTime = currentTime + niubizTime;
        }


        const resp = {
            sessionKey: data.sessionKey,
            expirationTime: finalExpirationTime, // TIMESTAMP CORREGIDO
            merchantId: NIUBIZ_MERCHANT,
            purchaseNumber: purchaseNumber,
            amountStr: parseFloat(amount).toFixed(2), // String con 2 decimales exactos
            currency: currency,
            // URLs corregidas para el widget de Niubiz
            apiBase: NIUBIZ_BASE, // Para action del checkout
            staticContentBase: NIUBIZ_BASE.includes('sandbox')
                ? 'https://static-content-qas.vnforapps.com'
                : 'https://static-content.vnforapps.com',
            // CORREGIR staticContentBase según el ambiente actual
            checkoutUrl: NIUBIZ_BASE.includes('sandbox')
                ? 'https://static-content-qas.vnforapps.com/env/sandbox/js/checkout.js'
                : 'https://static-content.vnforapps.com/v2/js/checkout.js',
            // ACTION URL que el widget usará para hacer POST cuando el usuario complete el pago
            action: `${actionBaseUrl}/api/niubiz/payment-response?purchaseNumber=${purchaseNumber}`,
            // URLs de retorno configuradas (para manejo de errores/timeout)
            timeoutUrl: `${baseUrl}/pay?status=timeout`,
            errorUrl: `${baseUrl}/pay?status=error`,
            // Preservar datos del formulario para el procesamiento posterior
            formData: formData
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

        // Validar que purchaseNumber sea numérico y máximo 12 dígitos
        if (!/^\d{1,12}$/.test(purchaseNumber)) {
            return res.status(400).json({
                error: 'purchaseNumber debe ser numérico con máximo 12 dígitos'
            });
        }

        const accessToken = await getAccessToken();
        console.log('🔑 Token para autorización:', accessToken ? accessToken.substring(0, 20) + '...' : 'null');

        // Verificar si es sandbox y agregar configuraciones específicas
        const isSandbox = NIUBIZ_BASE.includes('sandbox');
        console.log('🧪 Modo sandbox detectado:', isSandbox);

        // Formato v3 compatible: tokenId fuera de order
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

        console.log('✅ Respuesta de autorización (authorize):');
        console.log('==========================================');
        console.log(JSON.stringify(data, null, 2));
        console.log('==========================================');

        // Guardar respuesta detallada en archivo de log
        writeDetailedLog('AUTHORIZE_TRANSACTION_RESPONSE', {
            timestamp: new Date().toISOString(),
            requestPayload: payload,
            niubizResponse: data,
            operation: 'authorizeTransaction'
        });

        return res.json(data);
    } catch (err) {
        console.error('❌ Niubiz authorize error completo:', {
            message: err.message,
            status: err.response?.status,
            statusText: err.response?.statusText,
            data: err.response?.data
        });

        // Enviar información específica del error para mejor debugging
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
        console.log('🚀 Respuesta POST recibida de Niubiz...');
        console.log('=====================================');
        console.log('📝 BODY COMPLETO DE NIUBIZ:');
        console.log(JSON.stringify(req.body, null, 2));
        console.log('=====================================');
        console.log('📝 HEADERS COMPLETOS:');
        console.log(JSON.stringify(req.headers, null, 2));
        console.log('=====================================');
        console.log('📝 QUERY PARAMS:');
        console.log(JSON.stringify(req.query, null, 2));
        console.log('=====================================');

        // GUARDAR RESPUESTA FINAL DE PAGO EN LOG DETALLADO PARA NIUBIZ
        writeDetailedLog('PAYMENT_RESPONSE_FINAL', {
            timestamp: new Date().toISOString(),
            description: 'Respuesta final recibida del widget de Niubiz después del pago',
            headers: req.headers,
            body: req.body,
            query: req.query,
            ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            operation: 'receivePaymentResponse'
        });

        const { transactionToken, customerEmail, channel, url } = req.body || {};

        console.log('🔍 DATOS EXTRAÍDOS DE LA RESPUESTA:');
        console.log('transactionToken:', transactionToken);
        console.log('customerEmail:', customerEmail);
        console.log('channel:', channel);
        console.log('url:', url);
        console.log('=====================================');

        // Log de todos los campos que puedan venir en req.body
        console.log('🔍 TODOS LOS CAMPOS EN REQ.BODY:');
        Object.keys(req.body || {}).forEach(key => {
            console.log(`${key}: ${req.body[key]}`);
        });
        console.log('=====================================');

        if (!transactionToken) {
            console.error('❌ transactionToken faltante en respuesta de Niubiz');
            return res.status(400).json({ error: 'transactionToken requerido' });
        }

        // Extraer purchaseNumber de la URL actual
        const purchaseNumber = req.query.purchaseNumber;
        console.log('🔍 PurchaseNumber extraído:', purchaseNumber);

        // Recuperar datos de la sesión
        let sessionData = null;
        if (purchaseNumber) {
            sessionData = sessionStore.get(purchaseNumber);
            console.log('📋 Datos de sesión recuperados:', sessionData ? 'Encontrados' : 'No encontrados');
        }

        console.log('✅ Respuesta válida recibida:', {
            transactionToken,
            customerEmail,
            channel,
            url
        });

        // Logging de diagnóstico para determinar qué ruta tomar
        console.log('🔍 Diagnóstico de tipo de pago:', {
            channel: channel,
            transactionTokenLength: transactionToken ? transactionToken.length : 0,
            sessionDataExists: !!sessionData,
            purchaseNumber: purchaseNumber
        });

        // Verificar si es PagoEfectivo (canal diferente)
        if (channel === 'pagoefectivo') {
            console.log('💰 Pago efectivo detectado - redirigiendo con código CIP');
            const frontendUrl = process.env.FRONTEND_URL || 'https://gameztorepremios.com';

            // Construir parámetros con datos de sesión
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

            const redirectUrl = `${frontendUrl}/pay?${params.toString()}`;
            console.log('🔄 Redirigiendo a:', redirectUrl);
            return res.redirect(redirectUrl);
        }

        // Verificar si es Yape (no requiere autorización CVV)
        // SOLO si viene explícitamente marcado como yape en el channel
        const isLikelyYape = (
            channel === 'yape' ||
            channel === 'wallet'
            // Eliminar detección por patrón de token porque todos los tokens tienen formato similar
        );

        if (isLikelyYape) {
            console.log('📱 Pago con Yape detectado (channel específico) - transacción completada sin autorización CVV');
            const frontendUrl = process.env.FRONTEND_URL || 'https://gameztorepremios.com';

            // Construir parámetros con datos de sesión - marcar como Yape
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
                // Limpiar datos de sesión después de usar
                sessionStore.delete(purchaseNumber);
                console.log(`🗑️ Datos de sesión limpiados para purchaseNumber: ${purchaseNumber}`);
            }

            const redirectUrl = `${frontendUrl}/pay?${params.toString()}`;
            console.log('🔄 Redirigiendo a:', redirectUrl);
            return res.redirect(redirectUrl);
        }

        // Para pagos con tarjeta, billeteras, etc. - LLAMAR API DE AUTORIZACIÓN
        console.log('💳 Pago con tarjeta/billetera detectado - iniciando proceso de autorización');

        // PASO 4: LLAMAR AL API DE AUTORIZACIÓN AUTOMÁTICAMENTE
        let authorizationResult = null;
        if (sessionData && transactionToken) {
            try {
                // ============================================
                // INICIANDO AUTORIZACIÓN - PASO 4 NIUBIZ
                // ============================================
                console.log('\n');
                console.log('🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡�');
                console.log('🔐 INICIANDO API DE AUTORIZACIÓN (PASO 4) - NIUBIZ');
                console.log('🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡');
                console.log('TRANSACTION TOKEN RECIBIDO:', transactionToken);
                console.log('PURCHASE NUMBER:', purchaseNumber);
                console.log('AMOUNT:', sessionData.amount);
                console.log('🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡');
                console.log('\n');

                const accessToken = await getAccessToken();

                const authPayload = {
                    channel: "web",
                    captureType: "manual",
                    countable: true,
                    tokenId: transactionToken,
                    order: {
                        purchaseNumber: purchaseNumber,
                        amount: parseFloat(sessionData.amount),
                        currency: sessionData.currency || 'PEN'
                    }
                };

                console.log('\n=== PAYLOAD A ENVIAR ===');
                console.log(JSON.stringify(authPayload, null, 2));
                console.log('=== FIN PAYLOAD ===\n');

                const authUrl = `${NIUBIZ_BASE}/api.authorization/v3/authorization/ecommerce/${NIUBIZ_MERCHANT}`;
                console.log('🌐 LLAMANDO A URL:', authUrl);

                const authResponse = await axios.post(authUrl, authPayload, {
                    headers: {
                        Authorization: accessToken,
                        'Content-Type': 'application/json'
                    },
                    timeout: 15000,
                });

                authorizationResult = authResponse.data;

                // ============================================
                // RESPUESTA DEL API DE AUTORIZACIÓN - NIUBIZ
                // ============================================
                console.log('\n');
                console.log('🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢');
                console.log('✅ RESPUESTA EXITOSA DEL API DE AUTORIZACIÓN NIUBIZ');
                console.log('🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢');
                console.log('URL LLAMADA:', authUrl);
                console.log('TRANSACTION TOKEN:', transactionToken);
                console.log('PURCHASE NUMBER:', purchaseNumber);
                console.log('\n=== JSON RESPONSE COMPLETO ===');
                console.log(JSON.stringify(authorizationResult, null, 2));
                console.log('=== FIN JSON RESPONSE ===\n');
                console.log('🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢');
                console.log('\n');

                // Guardar respuesta de autorización en log
                writeDetailedLog('AUTO_AUTHORIZATION_SUCCESS', {
                    timestamp: new Date().toISOString(),
                    transactionToken: transactionToken,
                    authorizationRequest: authPayload,
                    authorizationResponse: authorizationResult,
                    operation: 'autoAuthorization'
                });

            } catch (authError) {
                // ============================================
                // ERROR EN API DE AUTORIZACIÓN - NIUBIZ
                // ============================================
                console.log('\n');
                console.log('🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴');
                console.log('❌ ERROR EN API DE AUTORIZACIÓN NIUBIZ');
                console.log('🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴');
                console.log('URL LLAMADA:', authUrl);
                console.log('TRANSACTION TOKEN:', transactionToken);
                console.log('PURCHASE NUMBER:', purchaseNumber);
                console.log('\n=== ERROR RESPONSE ===');
                console.log('STATUS:', authError.response?.status);
                console.log('STATUS TEXT:', authError.response?.statusText);
                console.log('ERROR DATA:', JSON.stringify(authError.response?.data || authError.message, null, 2));
                console.log('=== FIN ERROR RESPONSE ===\n');
                console.log('🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴');
                console.log('\n');

                // Guardar error de autorización en log
                writeDetailedLog('AUTO_AUTHORIZATION_ERROR', {
                    timestamp: new Date().toISOString(),
                    transactionToken: transactionToken,
                    error: authError.response?.data || authError.message,
                    operation: 'autoAuthorizationError'
                });

                // Continuar con el flujo normal aunque falle la autorización
                authorizationResult = {
                    error: true,
                    message: authError.response?.data || authError.message
                };
            }
        }

        // En lugar de devolver JSON, redirigir al frontend con los datos
        const frontendUrl = process.env.FRONTEND_URL || 'https://gameztorepremios.com';

        // Construir parámetros con datos de sesión
        const params = new URLSearchParams({
            status: 'success',
            transactionToken: transactionToken,
            customerEmail: customerEmail || '',
            channel: channel || 'web',
            purchaseNumber: purchaseNumber || ''
        });

        // Agregar resultado de autorización si existe
        if (authorizationResult) {
            params.append('authorizationResult', JSON.stringify(authorizationResult));
            if (authorizationResult.dataMap && authorizationResult.dataMap.TRANSACTION_DATE) {
                params.append('transactionDate', authorizationResult.dataMap.TRANSACTION_DATE);
            }
            if (authorizationResult.dataMap && authorizationResult.dataMap.CARD) {
                params.append('cardInfo', authorizationResult.dataMap.CARD);
            }
        }

        if (sessionData) {
            params.append('amount', sessionData.amount.toString());
            params.append('currency', sessionData.currency);
            if (sessionData.formData) {
                params.append('formData', JSON.stringify(sessionData.formData));
            }
            // Limpiar datos de sesión después de usar
            sessionStore.delete(purchaseNumber);
            console.log(`🗑️ Datos de sesión limpiados para purchaseNumber: ${purchaseNumber}`);
        }

        const redirectUrl = `${frontendUrl}/pay?${params.toString()}`;

        // LOGGING ESPECIAL PARA DEBUGGING
        console.log('\n');
        console.log('�🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵');
        console.log('�🔄 REDIRIGIENDO AL FRONTEND');
        console.log('🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵');
        console.log('URL DE REDIRECCIÓN:', redirectUrl);
        console.log('PARÁMETROS:', params.toString());
        console.log('🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵');
        console.log('\n');

        return res.redirect(redirectUrl);
    } catch (error) {
        console.error('❌ Error procesando respuesta de Niubiz:', error);
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
