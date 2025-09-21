// debug-backend.js
const http = require('http');

const testSession = () => {
    const postData = JSON.stringify({
        amount: "50.00",
        currency: "PEN",
        customer: {
            dni: "12345678",
            nombres: "Test",
            apellidos: "User"
        }
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/niubiz/session',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    console.log('🧪 Probando backend con URLs de producción...');

    const req = http.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);

        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                console.log('✅ Respuesta del backend:');
                console.log(JSON.stringify(response, null, 2));

                // Verificar URLs de producción
                if (response.checkoutUrl && response.staticContentBase) {
                    const isProduction = !response.checkoutUrl.includes('-qas') && !response.staticContentBase.includes('-qas');
                    console.log(`✅ URLs de producción: ${isProduction ? 'SÍ' : 'NO'}`);
                    console.log(`   checkoutUrl: ${response.checkoutUrl}`);
                    console.log(`   staticContentBase: ${response.staticContentBase}`);
                } else {
                    console.log('❌ URLs faltantes en respuesta');
                }
            } catch (e) {
                console.log('❌ Error parseando respuesta:', e.message);
                console.log('Raw data:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.error('❌ Error:', e.message);
    });

    req.write(postData);
    req.end();
};

testSession();
