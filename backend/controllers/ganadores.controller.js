const { getConnection, sql } = require('../config/db');

// Obtener ganadores de un sorteo específico (por query param o body)
const getGanadores = async (req, res) => {
    const { id } = req.query; // se puede enviar como query param

    if (!id) {
        return res.status(400).json({ error: 'Debe enviar el id para filtrar ganadores' });
    }

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT g.nombre, g.modelo, g.ticket, g.departamento, p.nombre AS premio
                FROM ganadores g
                LEFT JOIN premios p ON g.premio_id = p.id
                WHERE g.sorteo_id = @id
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error('❌ Error al obtener ganadores:', err.message);
        res.status(500).json({ error: 'Error al obtener ganadores' });
    }
};

// Agregar ganador vinculándolo a un sorteo
const addGanador = async (req, res) => {
    const { premio_id, nombre, modelo, ticket, departamento, id } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'Debe enviar el id' });
    }

    try {
        const pool = await getConnection();
        await pool.request()
            .input('premio_id', sql.Int, premio_id)
            .input('nombre', sql.NVarChar(100), nombre)
            .input('modelo', sql.NVarChar(100), modelo)
            .input('ticket', sql.NVarChar(20), ticket)
            .input('departamento', sql.NVarChar(50), departamento)
            .input('sorteo_id', sql.Int, sorteo_id)
            .query(`
                INSERT INTO ganadores (premio_id, nombre, modelo, ticket, departamento, sorteo_id) 
                VALUES (@premio_id, @nombre, @modelo, @ticket, @departamento, @sorteo_id)
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
