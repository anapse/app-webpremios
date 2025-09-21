// test-simple.js
const http = require('http');

const testData = JSON.stringify({
    amount: "50.00",
    currency: "PEN",
    clientIp: "192.168.1.100",
    customer: {
        dni: "12345678",
        nombres: "Juan",
        apellidos: "Pérez",
        email: "juan@ejemplo.com",
        telefono: "987654321",
        ciudad: "Lima",
        direccion: "Av. Test 123",
        codigoPostal: "15001"
    }
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/niubiz/session',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testData)
    }
};

console.log('🧪 Probando endpoint /api/niubiz/session...');

const req = http.request(options, (res) => {
    console.log(`✅ Status: ${res.statusCode}`);
    console.log(`✅ Headers:`, res.headers);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('✅ Respuesta:');
        try {
            const response = JSON.parse(data);
            console.log(JSON.stringify(response, null, 2));

            // Verificar campos requeridos
            const required = ['sessionKey', 'merchantId', 'amount', 'purchaseNumber', 'staticContentBase'];
            const missing = required.filter(field => !response[field]);

            if (missing.length === 0) {
                console.log('✅ Todos los campos requeridos están presentes');
            } else {
                console.log('❌ Campos faltantes:', missing);
            }
        } catch (e) {
            console.log('❌ Error parseando JSON:', e.message);
            console.log('Raw response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error('❌ Error de conexión:', e.message);
});

req.write(testData);
req.end();
