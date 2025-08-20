// quick-test.js
const axios = require('axios');

async function quickTest() {
    try {
        console.log('🧪 Probando servidor...');

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

quickTest();
