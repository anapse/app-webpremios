// index.js
require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())



// Rutas
app.use('/api/users', require('./routes/userRoutes'))
app.use('/api/tickets', require('./routes/ticketRoutes'))
const ganadoresRoutes = require('./routes/ganadores.routes');
app.use('/api/ganadores', ganadoresRoutes);

app.listen(PORT, () => {
    console.log(`API corriendo en http://localhost:${PORT}`)
})
