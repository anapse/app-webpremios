// test-simple-niubiz.js
require('dotenv').config();
const axios = require('axios');

async function testSimple() {
    console.log('🔍 Probando conexión simple...');

    const credentials = 'integraciones@niubiz.com.pe:_7z3@8fF';
    const basic = Buffer.from(credentials).toString('base64');
    const url = 'https://apisandbox.vnforappstest.com/api.security/v1/security';

    console.log('📡 URL:', url);
    console.log('🔑 Auth:', basic);

    try {
        console.log('⏳ Haciendo petición...');

        const response = await axios({
            method: 'GET',
            url: url,
            headers: {
                'Authorization': `Basic ${basic}`,
                'Content-Type': 'application/json'
            },
            timeout: 5000, // 5 segundos
            validateStatus: function (status) {
                return status >= 200 && status < 500; // No lanzar error en 4xx
            }
        });

        console.log('📊 Status:', response.status);
        console.log('📋 Data:', response.data);

        if (response.status === 200) {
            console.log('✅ ¡AUTENTICACIÓN EXITOSA!');
        } else {
            console.log('❌ Autenticación falló:', response.status);
        }

    } catch (error) {
        console.error('💥 Error de conexión:', error.message);
        if (error.code) {
            console.error('🔍 Error code:', error.code);
        }
    }
}

testSimple();
