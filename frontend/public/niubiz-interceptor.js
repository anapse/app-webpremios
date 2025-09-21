// Script de interceptación de URLs de Niubiz
// Este script se ejecuta en todas las páginas para detectar redirecciones de Niubiz

(function () {
    'use strict';

    // Detectar si estamos en una URL de Niubiz
    const currentUrl = window.location.href;
    const isNiubizUrl = currentUrl.includes('static-content-qas.vnforapps.com') ||
        currentUrl.includes('vnforapps.com') ||
        currentUrl.includes('ecommerce/token/session');

    if (isNiubizUrl) {
        console.log('🔄 Interceptor: Detectada URL de Niubiz:', currentUrl);

        // Extraer sessionKey/token de la URL
        const sessionKeyMatch = currentUrl.match(/\/session\/\d+\/([a-f0-9]+)/i);
        const sessionKey = sessionKeyMatch ? sessionKeyMatch[1] : null;

        if (sessionKey) {
            console.log('🔑 Interceptor: Token extraído:', sessionKey.substring(0, 10) + '...');

            // Construir URL de retorno con el token
            const returnUrl = `https://gameztorepremios.com/#/pay?transactionToken=${sessionKey}&purchaseNumber=${Date.now().toString().slice(-10)}&amount=15.00&source=interceptor`;

            console.log('↩️ Interceptor: Redirigiendo a:', returnUrl);

            // Redirección inmediata
            window.location.replace(returnUrl);
        } else {
            console.warn('⚠️ Interceptor: No se pudo extraer token de URL Niubiz');
            // Redirección sin token
            window.location.replace('https://gameztorepremios.com/#/pay?error=true&message=Token%20not%20found');
        }
    }
})();
