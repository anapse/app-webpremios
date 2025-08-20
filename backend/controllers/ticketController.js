// controllers/ticketController.js
const { getConnection, sql } = require('../config/db');

function generarCodigoTicket(sorteo_id, ticketId) {
    const p1 = String(sorteo_id ?? 0).padStart(3, '0');
    const p2 = String(ticketId).padStart(4, '0');
    return `GZP${p1}TK${p2}`;
}

exports.createTicket = async (req, res) => {
    const {
        dni,
        nombres,
        telefono,
        departamento,
        token_yape = null,
        id_transaccion = null,
        estado_pago = 'pendiente',
        sorteo_id: sorteoIdFromBody
    } = req.body;

    if (!dni || !nombres || !telefono || !departamento) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    if (!id_transaccion) {
        return res.status(400).json({ error: 'id_transaccion requerido' });
    }

    const pool = getConnection();
    const tx = new sql.Transaction(pool);

    try {
        await tx.begin();

        // Idempotencia: ¿ya existe esta transacción?
        const exists = await new sql.Request(tx)
            .input('id_transaccion', sql.VarChar(100), id_transaccion)
            .query(`
        SELECT id, codigo_ticket, estado_pago
        FROM dbo.tickets
        WHERE id_transaccion = @id_transaccion
      `);

        if (exists.recordset.length) {
            const row = exists.recordset[0];
            await tx.commit();
            return res.status(200).json({
                message: 'Transacción ya registrada',
                codigo_ticket: row.codigo_ticket || null
            });
        }

        // Obtener sorteo_id: body o sorteo activo
        let sorteo_id = sorteoIdFromBody;
        if (!sorteo_id) {
            const rs = await new sql.Request(tx).query(`
        SELECT TOP 1 id
        FROM dbo.sorteo_config
        WHERE estado_sorteo = 1
        ORDER BY id DESC
      `);
            sorteo_id = rs.recordset[0]?.id || null;
        }

        // Insert base (sin codigo_ticket aún)
        const insert = await new sql.Request(tx)
            .input('dni', sql.VarChar(20), dni)
            .input('nombres', sql.VarChar(100), nombres)
            .input('telefono', sql.VarChar(20), telefono)
            .input('departamento', sql.VarChar(50), departamento)
            .input('token_yape', sql.VarChar(100), token_yape)
            .input('id_transaccion', sql.VarChar(100), id_transaccion)
            .input('estado_pago', sql.VarChar(20), estado_pago)
            .input('sorteo_id', sql.Int, sorteo_id)
            .query(`
        INSERT INTO dbo.tickets
          (dni, nombres, telefono, departamento, token_yape, id_transaccion, estado_pago, sorteo_id, fecha)
        OUTPUT INSERTED.id AS ticketId
        VALUES
          (@dni, @nombres, @telefono, @departamento, @token_yape, @id_transaccion, @estado_pago, @sorteo_id, GETDATE())
      `);

        const ticketId = insert.recordset[0].ticketId;

        // Generar código SOLO si está pagado
        let codigo_ticket = null;
        if (String(estado_pago).toLowerCase() === 'pagado') {
            codigo_ticket = generarCodigoTicket(sorteo_id ?? 0, ticketId);
            await new sql.Request(tx)
                .input('codigo_ticket', sql.VarChar(50), codigo_ticket)
                .input('id', sql.Int, ticketId)
                .query(`
          UPDATE dbo.tickets
          SET codigo_ticket = @codigo_ticket
          WHERE id = @id
        `);
        }

        await tx.commit();
        return res.status(201).json({
            message: '🎫 Ticket registrado exitosamente',
            codigo_ticket
        });
    } catch (err) {
        try { await tx.rollback(); } catch (_) { }
        console.error('❌ Error al registrar ticket:', err.message);
        return res.status(500).json({ error: 'Error al registrar ticket' });
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
      FROM dbo.tickets t
      LEFT JOIN dbo.sorteo_config s ON t.sorteo_id = s.id
      ORDER BY t.id DESC
    `);
        res.json(result.recordset);
    } catch (err) {
        console.error('❌ Error al obtener tickets:', err.message);
        res.status(500).json({ error: 'Error al listar tickets' });
    }
};

exports.getTicketsByDni = async (req, res) => {
    try {
        const { dni } = req.params;
        const pool = getConnection();
        const result = await pool.request()
            .input('dni', sql.VarChar(20), dni)
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
        FROM dbo.tickets t
        LEFT JOIN dbo.sorteo_config s ON t.sorteo_id = s.id
        WHERE t.dni = @dni
        ORDER BY t.fecha DESC
      `);
        res.json(result.recordset);
    } catch (err) {
        console.error('❌ Error al obtener tickets por DNI:', err.message);
        res.status(500).json({ error: 'Error al buscar tickets' });
    }
};

exports.getTicketByCode = async (req, res) => {
    try {
        const { codigo } = req.params;
        const pool = getConnection();
        const result = await pool.request()
            .input('codigo_ticket', sql.VarChar(50), codigo)
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
        FROM dbo.tickets t
        LEFT JOIN dbo.sorteo_config s ON t.sorteo_id = s.id
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
