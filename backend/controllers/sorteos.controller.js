const { getConnection, sql } = require('../config/db');

// Obtener todos los sorteos
const getSorteos = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT * FROM sorteo_config ORDER BY sorteo_date DESC');
        res.json(result.recordset);
    } catch (err) {
        console.error('❌ Error al obtener sorteos:', err.message);
        res.status(500).json({ error: 'Error al obtener sorteos' });
    }
};

const getSorteoAnterior = async (req, res) => {
    try {
        const pool = await getConnection();

        // Obtener último sorteo
        const ultimoResult = await pool.request().query(`
      SELECT TOP 1 * FROM sorteo_config
      ORDER BY sorteo_date DESC
    `);

        if (ultimoResult.recordset.length === 0) {
            return res.status(404).json({ error: 'No hay sorteos disponibles' });
        }

        const fechaUltimo = ultimoResult.recordset[0].sorteo_date;
        console.log('Fecha último sorteo:', fechaUltimo);

        const fechaUltimoDate = fechaUltimo instanceof Date ? fechaUltimo : new Date(fechaUltimo);

        const anteriorResult = await pool.request()
            .input('fechaUltimo', sql.DateTime, fechaUltimoDate)
            .query(`
        SELECT TOP 1 * FROM sorteo_config
        WHERE sorteo_date < @fechaUltimo
        ORDER BY sorteo_date DESC
      `);

        if (anteriorResult.recordset.length === 0) {
            return res.status(404).json({ error: 'No hay sorteo anterior' });
        }

        console.log('Sorteo anterior encontrado:', anteriorResult.recordset[0]);
        res.json(anteriorResult.recordset[0]);

    } catch (err) {
        console.error('❌ Error al obtener sorteo anterior:', err.message);
        res.status(500).json({ error: 'Error al obtener sorteo anterior' });
    }
};

const getSorteoSiguiente = async (req, res) => {
    try {
        const pool = await getConnection();
        const ahora = new Date();

        const result = await pool.request()
            .input('ahora', sql.DateTime, ahora)
            .query(`
        SELECT TOP 1 * FROM sorteo_config
        WHERE sorteo_date > @ahora
        ORDER BY sorteo_date ASC
      `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'No hay sorteo próximo' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error('❌ Error al obtener sorteo próximo:', err.message);
        res.status(500).json({ error: 'Error al obtener sorteo próximo' });
    }
};
// Obtener sorteo por ID
const getSorteoById = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM sorteo_config WHERE id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Sorteo no encontrado' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('❌ Error al obtener sorteo:', err.message);
        res.status(500).json({ error: 'Error al obtener sorteo' });
    }
};

// Crear nuevo sorteo
const createSorteo = async (req, res) => {
    const { nombre_sorteo, ticket_price, sorteo_date, estado_sorteo = 1 } = req.body;

    if (!nombre_sorteo || ticket_price == null || !sorteo_date) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // normalizar tipos
    const ticketPriceInt = parseInt(ticket_price, 10);
    if (isNaN(ticketPriceInt)) return res.status(400).json({ error: 'ticket_price debe ser un número' });

    const sorteoDate = (sorteo_date instanceof Date) ? sorteo_date : new Date(sorteo_date);
    if (isNaN(sorteoDate.getTime())) return res.status(400).json({ error: 'sorteo_date inválida' });

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('nombre_sorteo', sql.NVarChar(100), nombre_sorteo)
            .input('ticket_price', sql.Int, ticketPriceInt)
            .input('sorteo_date', sql.DateTime, sorteoDate)
            .input('ganadores_total', sql.Int, 0)
            .input('estado_sorteo', sql.Bit, estado_sorteo ? 1 : 0)
            .query(`
        INSERT INTO sorteo_config (nombre_sorteo, ticket_price, sorteo_date, ganadores_total, estado_sorteo)
        OUTPUT INSERTED.*
        VALUES (@nombre_sorteo, @ticket_price, @sorteo_date, @ganadores_total, @estado_sorteo)
      `);

        res.status(201).json(result.recordset[0]);
    } catch (err) {
        console.error('❌ Error al crear sorteo:', err.message);
        res.status(500).json({ error: 'Error al crear sorteo' });
    }
};

// Actualizar sorteo (solo campos permitidos)
const updateSorteoById = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    const updates = req.body || {};

    // Lista blanca de campos que se permiten actualizar
    const allowed = {
        nombre_sorteo: { type: sql.NVarChar(100) },
        ticket_price: { type: sql.Int },
        sorteo_date: { type: sql.DateTime },
        ganadores_total: { type: sql.Int },
        estado_sorteo: { type: sql.Bit }
    };

    const keys = Object.keys(updates).filter(k => Object.prototype.hasOwnProperty.call(allowed, k));
    if (keys.length === 0) {
        return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
    }

    const setClause = keys.map(k => `${k} = @${k}`).join(', ');

    try {
        const pool = await getConnection();
        const request = pool.request().input('id', sql.Int, id);

        // Asignar inputs con el tipo correcto
        keys.forEach(key => {
            let val = updates[key];
            const colType = allowed[key].type;

            if (colType === sql.Int) {
                const v = parseInt(val, 10);
                if (isNaN(v)) throw new Error(`${key} debe ser un número entero`);
                request.input(key, sql.Int, v);
            } else if (colType === sql.Bit) {
                request.input(key, sql.Bit, val ? 1 : 0);
            } else if (colType === sql.DateTime) {
                const d = (val instanceof Date) ? val : new Date(val);
                if (isNaN(d.getTime())) throw new Error(`${key} fecha inválida`);
                request.input(key, sql.DateTime, d);
            } else {
                // NVarChar(100)
                request.input(key, sql.NVarChar(100), String(val));
            }
        });

        const result = await request.query(`
      UPDATE sorteo_config
      SET ${setClause}
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Sorteo no encontrado' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error('❌ Error al actualizar sorteo:', err.message);
        res.status(500).json({ error: 'Error al actualizar sorteo', detail: err.message });
    }
};

module.exports = {
    getSorteos,
    getSorteoAnterior,
    getSorteoSiguiente,
    getSorteoById,
    createSorteo,
    updateSorteoById
};
