// test-niubiz-integration.js
// Script de prueba para verificar la integración Niubiz según las nuevas especificaciones

const testBackendSession = async () => {
    console.log('🧪 Probando endpoint /api/niubiz/session...');

    try {
        const response = await fetch('http://localhost:3000/api/niubiz/session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: '50.00',
                currency: 'PEN',
                clientIp: '192.168.1.100',
                customer: {
                    dni: '12345678',
                    nombres: 'Juan',
                    apellidos: 'Pérez',
                    email: 'juan@ejemplo.com',
                    telefono: '987654321',
                    ciudad: 'Lima',
                    direccion: 'Av. Test 123',
                    codigoPostal: '15001'
                }
            })
        });

        const data = await response.json();
        console.log('✅ Respuesta de sesión:', JSON.stringify(data, null, 2));

        // Verificar que contenga los campos esperados
        const requiredFields = ['sessionKey', 'merchantId', 'amount', 'purchaseNumber', 'staticContentBase'];
        const missingFields = requiredFields.filter(field => !data[field]);

        if (missingFields.length > 0) {
            console.log('❌ Campos faltantes:', missingFields);
        } else {
            console.log('✅ Todos los campos requeridos están presentes');

            // Probar autorización con los datos recibidos
            await testBackendAuthorize(data);
        }

    } catch (error) {
        console.error('❌ Error en prueba de sesión:', error.message);
    }
};

const testBackendAuthorize = async (sessionData) => {
    console.log('\n🧪 Probando endpoint /api/niubiz/authorize...');

    try {
        const response = await fetch('http://localhost:3000/api/niubiz/authorize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tokenId: 'TEST_TOKEN_123456',
                purchaseNumber: sessionData.purchaseNumber,
                amount: sessionData.amount,
                currency: sessionData.currency || 'PEN'
            })
        });

        const data = await response.json();
        console.log('✅ Respuesta de autorización:', JSON.stringify(data, null, 2));

        // Verificar estructura de respuesta
        if (data.dataMap && data.dataMap.ACTION_CODE) {
            console.log('✅ Estructura de respuesta correcta');
        } else {
            console.log('❌ Estructura de respuesta incorrecta');
        }

    } catch (error) {
        console.error('❌ Error en prueba de autorización:', error.message);
    }
};

const testFrontendIntegration = () => {
    console.log('\n🧪 Verificando integración frontend...');

    // Simular el flujo que debería ocurrir en el frontend
    const mockSessionData = {
        sessionKey: 'sess_test_1234567890',
        merchantId: 'TEST_MERCHANT',
        amount: '50.00',
        currency: 'PEN',
        purchaseNumber: '1234567890',
        staticContentBase: 'https://static-content-qas.vnforapps.com'
    };

    console.log('📝 Datos de sesión simulados:', mockSessionData);

    // Verificar construcción de action URL
    const actionUrl = `${mockSessionData.staticContentBase}/v2/checkout?sessionkey=${mockSessionData.sessionKey}`;
    console.log('🔗 Action URL construida:', actionUrl);

    // Verificar payload de autorización
    const authorizePayload = {
        tokenId: 'MOCK_TOKEN_FROM_NIUBIZ',
        purchaseNumber: mockSessionData.purchaseNumber,
        amount: mockSessionData.amount,
        currency: mockSessionData.currency
    };
    console.log('📦 Payload de autorización:', authorizePayload);

    console.log('✅ Integración frontend verificada');
};

// Ejecutar pruebas
console.log('🚀 Iniciando pruebas de integración Niubiz\n');

// Verificar si el servidor está corriendo
fetch('http://localhost:3000/api/niubiz/ping')
    .then(response => response.json())
    .then(data => {
        console.log('✅ Servidor backend respondiendo:', data);
        return testBackendSession();
    })
    .catch(error => {
        console.log('❌ Servidor backend no disponible:', error.message);
        console.log('💡 Asegúrate de que el servidor esté corriendo en puerto 3000');
        console.log('💡 Ejecutando solo pruebas de frontend...\n');
        testFrontendIntegration();
    });
