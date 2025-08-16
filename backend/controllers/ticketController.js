const { getConnection, sql } = require('../config/db');

exports.createTicket = async (req, res) => {
    try {
        const { dni, nombres, telefono, departamento, token_yape, id_transaccion, estado_pago } = req.body;

        const pool = getConnection();

        // Insertar el ticket
        const insertResult = await pool.request()
            .input('dni', sql.VarChar, dni)
            .input('nombres', sql.VarChar, nombres)
            .input('telefono', sql.VarChar, telefono)
            .input('departamento', sql.VarChar, departamento)
            .input('token_yape', sql.VarChar, token_yape)
            .input('id_transaccion', sql.VarChar, id_transaccion)
            .input('estado_pago', sql.VarChar, estado_pago)
            .input('sorteo_id', sql.Int, sorteo_id)
            .query(`
        INSERT INTO tickets (dni, nombres, telefono, departamento, token_yape, id_transaccion, estado_pago, sorteo_id, fecha)
        OUTPUT INSERTED.id AS ticketId
        VALUES (@dni, @nombres, @telefono, @departamento, @token_yape, @id_transaccion, @estado_pago, @sorteo_id, GETDATE())
      `);

        const ticketId = insertResult.recordset[0].ticketId;

        // Generar código de ticket con el ID del sorteo
        const codigo_ticket = `GZP${sorteo_id.toString().padStart(3, '0')}TK${ticketId.toString().padStart(4, '0')}`;

        await pool.request()
            .input('codigo_ticket', sql.VarChar, codigo_ticket)
            .input('id', sql.Int, ticketId)
            .query('UPDATE tickets SET codigo_ticket = @codigo_ticket WHERE id = @id');

        res.status(201).json({
            message: '🎫 Ticket registrado exitosamente',
            codigo_ticket
        });

    } catch (err) {
        console.error('❌ Error al registrar ticket:', err.message);
        res.status(500).json({ error: 'Error al registrar ticket' });
    }
};
exports.getTickets = async (req, res) => {
    try {
        const pool = getConnection();

        const result = await pool.request().query(`
      SELECT 
        t.id,
        t.codigo_ticket,
        t.dni,
        t.nombres,
        t.telefono,
        t.departamento,
        t.comprobante_url,
        t.estado_pago,
        t.fecha,
        t.sorteo_id,
        s.nombre_sorteo,
        s.fecha_sorteo,
        s.estado_sorteo
      FROM tickets t
      LEFT JOIN sorteo_config s ON t.sorteo_id = s.id
      ORDER BY t.id DESC
    `);

        res.json(result.recordset);
    } catch (err) {
        console.error('❌ Error al obtener tickets:', err.message);
        res.status(500).json({ error: 'Error al listar tickets' });
    }
};

// Obtener tickets por DNI
exports.getTicketsByDni = async (req, res) => {
    try {
        const { dni } = req.params;
        const pool = getConnection();

        const result = await pool.request()
            .input('dni', sql.VarChar, dni)
            .query(`
                SELECT 
                    t.id,
                    t.codigo_ticket,
                    t.dni,
                    t.nombres,
                    t.telefono,
                    t.departamento,
                    t.comprobante_url,
                    t.estado_pago,
                    t.fecha,
                    t.sorteo_id,
                    s.nombre_sorteo,
                    s.fecha_sorteo,
                    s.estado_sorteo
                FROM tickets t
                LEFT JOIN sorteo_config s ON t.sorteo_id = s.id
                WHERE t.dni = @dni
                ORDER BY t.fecha DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('❌ Error al obtener tickets por DNI:', err.message);
        res.status(500).json({ error: 'Error al buscar tickets' });
    }
};

// Obtener ticket por código
exports.getTicketByCode = async (req, res) => {
    try {
        const { codigo } = req.params;
        const pool = getConnection();

        const result = await pool.request()
            .input('codigo_ticket', sql.VarChar, codigo)
            .query(`
                SELECT 
                    t.id,
                    t.codigo_ticket,
                    t.dni,
                    t.nombres,
                    t.telefono,
                    t.departamento,
                    t.comprobante_url,
                    t.estado_pago,
                    t.fecha,
                    t.sorteo_id,
                    s.nombre_sorteo,
                    s.fecha_sorteo,
                    s.estado_sorteo
                FROM tickets t
                LEFT JOIN sorteo_config s ON t.sorteo_id = s.id
                WHERE t.codigo_ticket = @codigo_ticket
            `);

        if (!result.recordset.length) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error('❌ Error al obtener ticket por código:', err.message);
        res.status(500).json({ error: 'Error al buscar ticket' });
    }
};