// controllers/libroReclamacionesController.js
const { getConnection, sql } = require('../config/db');

// POST /api/libro-reclamaciones
const crearReclamo = async (req, res) => {
    const {
        tipo_documento,
        numero_documento,
        tipo_comprobante,
        numero_comprobante,
        email,
        celular,
        operador,
        producto_servicio,
        motivo_reclamo,
        ignorado_solicitud,
        ofrecio_fecha_hora
    } = req.body;

    if (!tipo_documento || !numero_documento || !email || !celular || !producto_servicio || !motivo_reclamo) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('tipo_documento', sql.VarChar(20), tipo_documento)
            .input('numero_documento', sql.VarChar(15), numero_documento)
            .input('tipo_comprobante', sql.VarChar(20), tipo_comprobante || null)
            .input('numero_comprobante', sql.VarChar(20), numero_comprobante || null)
            .input('email', sql.VarChar(100), email)
            .input('celular', sql.VarChar(20), celular)
            .input('operador', sql.VarChar(50), operador || null)
            .input('producto_servicio', sql.VarChar(255), producto_servicio)
            // Tu columna es TEXT → usa sql.Text
            .input('motivo_reclamo', sql.Text, motivo_reclamo)
            .input('ignorado_solicitud', sql.Bit, typeof ignorado_solicitud === 'boolean' ? (ignorado_solicitud ? 1 : 0) : null)
            .input('ofrecio_fecha_hora', sql.Bit, typeof ofrecio_fecha_hora === 'boolean' ? (ofrecio_fecha_hora ? 1 : 0) : null)
            .query(`
        DECLARE @year INT = YEAR(GETDATE());
        DECLARE @n INT = (SELECT COUNT(*) FROM libro_reclamaciones WHERE YEAR(fecha_creacion) = @year) + 1;
        DECLARE @codigo VARCHAR(20) = CONCAT('LRV-', @year, '-', RIGHT('0000' + CAST(@n AS VARCHAR(4)), 4));

        INSERT INTO libro_reclamaciones (
          codigo_reclamo, tipo_documento, numero_documento, tipo_comprobante,
          numero_comprobante, email, celular, operador, producto_servicio,
          motivo_reclamo, ignorado_solicitud, ofrecio_fecha_hora
        )
        VALUES (
          @codigo, @tipo_documento, @numero_documento, @tipo_comprobante,
          @numero_comprobante, @email, @celular, @operador, @producto_servicio,
          @motivo_reclamo, @ignorado_solicitud, @ofrecio_fecha_hora
        );

        SELECT @codigo AS codigo_reclamo;
      `);

        return res.status(201).json({
            message: 'Reclamo registrado con éxito',
            codigo_reclamo: result.recordset[0]?.codigo_reclamo
        });
    } catch (err) {
        console.error('❌ Error al registrar reclamo:', err.message);
        return res.status(500).json({ error: 'Error al registrar el reclamo' });
    }
};

// GET /api/libro-reclamaciones?estado=&codigo=
const getReclamos = async (req, res) => {
    const { estado, codigo } = req.query;

    try {
        const pool = await getConnection();
        const request = pool.request();

        let where = '1=1';
        if (estado) { request.input('estado', sql.VarChar(20), estado); where += ' AND estado = @estado'; }
        if (codigo) { request.input('codigo', sql.VarChar(20), codigo); where += ' AND codigo_reclamo = @codigo'; }

        const result = await request.query(`
      SELECT id_reclamo, codigo_reclamo, tipo_documento, numero_documento,
             tipo_comprobante, numero_comprobante, email, celular, operador,
             producto_servicio, motivo_reclamo, ignorado_solicitud, ofrecio_fecha_hora,
             fecha_creacion, estado
      FROM libro_reclamaciones
      WHERE ${where}
      ORDER BY fecha_creacion DESC
    `);

        return res.json(result.recordset);
    } catch (err) {
        console.error('❌ Error al obtener reclamos:', err.message);
        return res.status(500).json({ error: 'Error al obtener reclamos' });
    }
};

// PATCH /api/libro-reclamaciones/estado
const updateEstado = async (req, res) => {
    const { codigo_reclamo, estado } = req.body;
    if (!codigo_reclamo || !estado) {
        return res.status(400).json({ error: 'Debe enviar codigo_reclamo y estado' });
    }

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('codigo_reclamo', sql.VarChar(20), codigo_reclamo)
            .input('estado', sql.VarChar(20), estado)
            .query(`
        UPDATE libro_reclamaciones
        SET estado = @estado
        WHERE codigo_reclamo = @codigo_reclamo;

        SELECT @@ROWCOUNT AS rows;
      `);

        if (result.recordset[0].rows === 0) {
            return res.status(404).json({ error: 'Reclamo no encontrado' });
        }
        return res.json({ message: 'Estado actualizado' });
    } catch (err) {
        console.error('❌ Error al actualizar estado:', err.message);
        return res.status(500).json({ error: 'Error al actualizar estado' });
    }
};

module.exports = { crearReclamo, getReclamos, updateEstado };
