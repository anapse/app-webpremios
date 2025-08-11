const { getConnection, sql } = require('../config/db');

// Obtener premios (opcional sorteo_id)
async function getPremios(req, res) {
    try {
        const { sorteo_id } = req.query;
        let pool = await getConnection();

        let query = 'SELECT * FROM premios';
        if (sorteo_id) {
            query += ' WHERE sorteo_id = @sorteo_id';
        }

        let result = await pool.request()
            .input('sorteo_id', sql.Int, sorteo_id || null)
            .query(query);

        if (result.recordset.length === 0) {
            return res.json({
                message: 'No hay premios agregados',
                premios: []
            });
        }

        res.json({
            message: 'Premios encontrados',
            premios: result.recordset
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener premios' });
    }
}

// Crear premio
const createPremio = async (req, res) => {
    const { nombre, tipo_premio, cantidad, sorteo_id, descripcion } = req.body;
    if (!nombre || tipo_premio === undefined || cantidad === undefined) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('nombre', sql.NVarChar(100), nombre)
            .input('tipo_premio', sql.Int, tipo_premio)
            .input('cantidad', sql.Int, cantidad)
            .input('sorteo_id', sql.Int, sorteo_id)
            .input('descripcion', sql.NVarChar(sql.MAX), descripcion || null)  // Añadido
            .query(`
        INSERT INTO premios (nombre, tipo_premio, cantidad, sorteo_id, descripcion)
        OUTPUT INSERTED.*
        VALUES (@nombre, @tipo_premio, @cantidad, @sorteo_id, @descripcion)
      `);

        res.status(201).json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear premio' });
    }
};


// Actualizar un premio por ID

const updatePremioById = async (req, res) => {
    const { id } = req.params;
    const { nombre, tipo_premio, cantidad, sorteo_id, descripcion } = req.body;

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('nombre', sql.NVarChar(100), nombre)
            .input('tipo_premio', sql.Int, tipo_premio)
            .input('cantidad', sql.Int, cantidad)
            .input('sorteo_id', sql.Int, sorteo_id)
            .input('descripcion', sql.NVarChar(sql.MAX), descripcion || null)  // Añadido
            .query(`
        UPDATE premios
        SET nombre = @nombre,
            tipo_premio = @tipo_premio,
            cantidad = @cantidad,
            sorteo_id = @sorteo_id,
            descripcion = @descripcion
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Premio no encontrado' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar premio' });
    }
};

// Eliminar premio por ID
const deletePremioById = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM premios OUTPUT DELETED.* WHERE id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Premio no encontrado' });
        }

        res.json({ mensaje: 'Premio eliminado', eliminado: result.recordset[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al eliminar premio' });
    }
};

module.exports = {
    getPremios,
    createPremio,
    updatePremioById,
    deletePremioById,
};
