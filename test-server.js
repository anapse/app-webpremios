// test-server.js
const axios = require('axios');

async function testServer() {
    try {
        console.log('🔍 Probando servidor local...');

        // Probar ping
        const ping = await axios.get('http://localhost:3000/api/niubiz/ping');
        console.log('✅ Ping exitoso:', ping.data);

        // Probar endpoint de sesión
        const session = await axios.post('http://localhost:3000/api/niubiz/session/create', {
            amount: 15,
            customer: {
                dni: '12345678',
                email: 'test@gameztore.com'
            }
        });
        console.log('✅ Sesión creada:', session.data);

    } catch (error) {
        console.error('❌ Error:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        });
    }
}

testServer();
