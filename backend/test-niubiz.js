// test-niubiz.js
const axios = require('axios');

async function testNiubizSession() {
    try {
        console.log('🧪 Probando endpoint de sesión de Niubiz...');

        const response = await axios.post('http://localhost:3000/api/niubiz/session/create', {
            amount: 15,
            customer: {
                dni: '12345678',
                email: 'test@gameztore.com'
            }
        });

        console.log('✅ Respuesta:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('❌ Error:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        });
    }
}

testNiubizSession();
