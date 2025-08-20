// test-niubiz-auth.js
require('dotenv').config();
const axios = require('axios');

const {
    NIUBIZ_BASE,
    NIUBIZ_USER,
    NIUBIZ_PASS,
    NIUBIZ_MERCHANT
} = process.env;

async function testAuth() {
    console.log('🧪 Probando autenticación Niubiz...');
    console.log('🔧 Config:', {
        base: NIUBIZ_BASE,
        user: NIUBIZ_USER,
        merchant: NIUBIZ_MERCHANT,
        passLength: NIUBIZ_PASS ? NIUBIZ_PASS.length : 0
    });

    const credentials = `${NIUBIZ_USER}:${NIUBIZ_PASS}`;
    const basic = Buffer.from(credentials).toString('base64');

    console.log('🔐 Credentials:', credentials);
    console.log('🔑 Basic Auth:', basic);

    const url = `${NIUBIZ_BASE}/api.security/v1/security`;

    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Basic ${basic}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000,
        });

        console.log('✅ ¡ÉXITO! Token obtenido:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        return false;
    }
}

testAuth();
