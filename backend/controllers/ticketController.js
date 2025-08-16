const { getConnection, sql } = require('../config/db');

exports.createTicket = async (req, res) => {
    try {
        const { dni, nombres, telefono, departamento, token_yape, id_transaccion, estado_pago } = req.body;

        const pool = getConnection();

        // Insertar el ticket (sin sorteo_id por ahora)
        const insertResult = await pool.request()
            .input('dni', sql.VarChar, dni)
            .input('nombres', sql.VarChar, nombres)
            .input('telefono', sql.VarChar, telefono)
            .input('departamento', sql.VarChar, departamento)
            .input('token_yape', sql.VarChar, token_yape)
            .input('id_transaccion', sql.VarChar, id_transaccion)
            .input('estado_pago', sql.VarChar, estado_pago)
            .query(`
        INSERT INTO tickets (dni, nombres, telefono, departamento, token_yape, id_transaccion, estado_pago, fecha)
        OUTPUT INSERTED.id AS ticketId
        VALUES (@dni, @nombres, @telefono, @departamento, @token_yape, @id_transaccion, @estado_pago, GETDATE())
      `);

        const ticketId = insertResult.recordset[0].ticketId;

        // Generar código de ticket con sorteo_id fijo hasta agregar la columna
        const sorteo_id = 1; // Temporal - será reemplazado cuando agregues la columna sorteo_id
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
        id,
        codigo_ticket,
        dni,
        nombres,
        telefono,
        departamento,
        comprobante_url,
        estado_pago,
        fecha,
        token_yape,
        id_transaccion
      FROM tickets
      ORDER BY id DESC
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
                    id,
                    codigo_ticket,
                    dni,
                    nombres,
                    telefono,
                    departamento,
                    comprobante_url,
                    estado_pago,
                    fecha,
                    token_yape,
                    id_transaccion
                FROM tickets
                WHERE dni = @dni
                ORDER BY fecha DESC
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
                    id,
                    codigo_ticket,
                    dni,
                    nombres,
                    telefono,
                    departamento,
                    comprobante_url,
                    estado_pago,
                    fecha,
                    token_yape,
                    id_transaccion
                FROM tickets
                WHERE codigo_ticket = @codigo_ticket
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