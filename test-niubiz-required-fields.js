// test-niubiz-required-fields.js
const http = require('http');

const testRequiredFields = () => {
    const postData = JSON.stringify({
        amount: "15.00",
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

    console.log('🧪 Verificando campos requeridos por Niubiz...');
    console.log('📋 Campos mínimos requeridos: action, merchantid, sessiontoken, amount, purchasenumber');

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

                // Verificar campos requeridos para Niubiz
                const requiredForNiubiz = {
                    'sessionKey (para sessiontoken)': response.sessionKey,
                    'merchantId (para merchantid)': response.merchantId,
                    'purchaseNumber (para purchasenumber)': response.purchaseNumber,
                    'amountStr o amount (para amount)': response.amountStr || response.amount,
                    'staticContentBase (para construir action)': response.staticContentBase
                };

                console.log('\n🔍 VERIFICACIÓN DE CAMPOS REQUERIDOS:');
                let allFieldsPresent = true;

                Object.entries(requiredForNiubiz).forEach(([field, value]) => {
                    const isPresent = value !== undefined && value !== null && value !== '';
                    console.log(`   ${isPresent ? '✅' : '❌'} ${field}: ${value || 'FALTANTE'}`);
                    if (!isPresent) allFieldsPresent = false;
                });

                // Verificar formato de amount
                const amountValue = response.amountStr || response.amount;
                if (amountValue) {
                    const isValidAmount = /^\d+\.\d{2}$/.test(amountValue.toString());
                    console.log(`   ${isValidAmount ? '✅' : '❌'} amount formato (XX.XX): ${amountValue}`);
                    if (!isValidAmount) allFieldsPresent = false;
                }

                // Verificar formato de purchaseNumber
                if (response.purchaseNumber) {
                    const isValidPurchaseNumber = /^\d{1,12}$/.test(response.purchaseNumber.toString());
                    console.log(`   ${isValidPurchaseNumber ? '✅' : '❌'} purchaseNumber formato (numérico ≤12): ${response.purchaseNumber}`);
                    if (!isValidPurchaseNumber) allFieldsPresent = false;
                }

                // Construir action para verificar
                if (response.staticContentBase && response.merchantId && response.sessionKey) {
                    const action = `${response.staticContentBase}/api.ecommerce/v2/ecommerce/token/session/${response.merchantId}/${response.sessionKey}`;
                    console.log(`   ✅ action construido: ${action}`);
                } else {
                    console.log(`   ❌ No se puede construir action - faltan datos`);
                    allFieldsPresent = false;
                }

                console.log(`\n${allFieldsPresent ? '🎉' : '❌'} RESULTADO: ${allFieldsPresent ? 'TODOS los campos requeridos están presentes' : 'FALTAN campos requeridos'}`);

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

testRequiredFields();
