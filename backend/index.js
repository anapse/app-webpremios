// index.js
require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Sin CORS en desarrollo

/*
// CORS permisivo para desarrollo
const corsOptions = {
    origin: true, // Permite todos los orígenes
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
};

app.use(cors(corsOptions));

// Middleware adicional para CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    // Responder a preflight requests
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});
*/
// Aumentar límites para archivos grandes (imágenes)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/favicon.ico', (req, res) => res.status(204).end());
// Middleware para logs



// Rutas API
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/ganadores', require('./routes/ganadores.routes'));
app.use('/api/sorteos', require('./routes/sorteos.routes'));
app.use('/api/premios', require('./routes/premios.routes'));
app.use('/api/home-banner', require('./routes/homeBanner.routes'));
app.use('/api/libro-reclamaciones', require('./routes/libroReclamaciones.routes'));
app.use('/api/niubiz', require('./routes/niubiz.routes'));  // <-- monta Niubiz aquí
app.use('/api/config', require('./routes/config.routes'));  // <-- configuración del sistema

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'Backend funcionando correctamente'
    });
});

// 404 para rutas API no encontradas
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Ruta de API no encontrada' });
});

// Middleware para manejar errores
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Escuchar en todas las interfaces para desarrollo
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor corriendo en VPS:`);
    console.log(`   IP Externa: http://77.237.239.180:${PORT}`);
    console.log(`   Localhost: http://127.0.0.1:${PORT}`);
    console.log(`   Todas las interfaces: 0.0.0.0:${PORT}`);
});
