const { getConnection, sql } = require('../config/db');

const getGanadores = async (req, res) => {
    try {
        const pool = await getConnection(); // ✅ Aquí sí debe ir await
        const result = await pool.request().query('SELECT * FROM Ganadores');
        res.json(result.recordset);
    } catch (err) {
        console.error('❌ Error al obtener ganadores:', err.message);
        res.status(500).json({ error: 'Error al obtener ganadores' });
    }
};

const addGanador = async (req, res) => {
    const { premio_id, nombre, modelo, ticket, departamento } = req.body;

    try {
        const pool = await getConnection(); // ✅ necesitas conectar aquí también
        await pool.request()
            .input('premio_id', sql.Int, premio_id)
            .input('nombre', sql.NVarChar(100), nombre)
            .input('modelo', sql.NVarChar(100), modelo)
            .input('ticket', sql.NVarChar(20), ticket)
            .input('departamento', sql.NVarChar(50), departamento)
            .query(`
                INSERT INTO ganadores (premio_id, nombre, modelo, ticket, departamento) 
                VALUES (@premio_id, @nombre, @modelo, @ticket, @departamento)
            `);

        res.status(201).json({ message: 'Ganador registrado' });
    } catch (err) {
        console.error('❌ Error al registrar ganador:', err.message);
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getGanadores,
    addGanador,
};
