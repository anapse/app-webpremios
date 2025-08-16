// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS para VPS
const corsOptions = {
    origin: [
        'http://77.237.239.180',
        'http://77.237.239.180:80',
        'http://77.237.239.180:3000',
        'http://localhost:5173',
        'http://localhost:3000',
        'http://gameztorepremios.com',   // <-- agrega aquí
        'https://gameztorepremios.com'   // <-- y HTTPS si usas
    ],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.get('/favicon.ico', (req, res) => res.status(204).end());
// Middleware para logs



// Rutas API
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/ganadores', require('./routes/ganadores.routes'));
app.use('/api/sorteos', require('./routes/sorteos.routes'));
app.use('/api/premios', require('./routes/premios.routes'));
app.use('/api/libro-reclamaciones', require('./routes/libroReclamaciones.routes'));

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

// Escuchar
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor corriendo en VPS:`);
    console.log(`   IP: http://77.237.239.180:${PORT}`);
    console.log(`   Local: http://localhost:${PORT}`);
    console.log(`   Todas las interfaces: 0.0.0.0:${PORT}`);
});
