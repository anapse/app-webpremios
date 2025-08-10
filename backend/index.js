// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS para VPS - permitir conexiones desde cualquier origen
const corsOptions = {
    origin: [
        'http://77.237.239.180',      // Frontend en el VPS
        'http://77.237.239.180:80',   // Puerto 80
        'http://77.237.239.180:3000', // Puerto 3000
        'http://localhost:5173',      // Desarrollo local
        'http://localhost:3000',      // Desarrollo local
    ],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());

// Middleware para logs de requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Rutas API
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/ganadores', require('./routes/ganadores.routes'));
app.use('/api/sorteos', require('./routes/sorteos.routes'));

// Ruta de health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'Backend funcionando correctamente'
    });
});

// Servir archivos estáticos del frontend (si están en la misma carpeta)
app.use(express.static('../frontend/dist'));

// Catch-all para SPA - devolver index.html para rutas no API
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
    }
});

// Middleware 404 para rutas API no encontradas
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Ruta de API no encontrada' });
});

// Middleware para manejar errores
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Escuchar en todas las interfaces (importante para VPS)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor corriendo en VPS:`);
    console.log(`   IP: http://77.237.239.180:${PORT}`);
    console.log(`   Local: http://localhost:${PORT}`);
    console.log(`   Todas las interfaces: 0.0.0.0:${PORT}`);
});
