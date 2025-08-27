// controllers/configController.js
const { getConnection, sql } = require('../config/db');

// Obtener configuración del sistema
exports.getConfig = async (req, res) => {
    try {
        const pool = getConnection();
        const result = await pool.request().query(`
            SELECT TOP 1 * FROM dbo.sistema_config 
            ORDER BY id DESC
        `);

        if (result.recordset.length === 0) {
            // Si no existe configuración, crear una por defecto
            const defaultConfig = await pool.request().query(`
                INSERT INTO dbo.sistema_config 
                (telefono_notificaciones, telefono_pagos, nombre_beneficiario_yape, mensaje_whatsapp_template)
                OUTPUT INSERTED.*
                VALUES 
                ('51000000000', '000 000 000', 'Nombre del Beneficiario',
                '🎫 *NUEVO TICKET REGISTRADO*

*Datos del participante:*
👤 Nombre: {nombres} {apellidos}
🆔 DNI: {dni}
📱 WhatsApp: {telefono}
📍 Departamento: {departamento}
🎟️ Código de ticket: {codigo_ticket}
💰 Monto: S/ {precio}

⚠️ *TICKET PENDIENTE DE ACTIVACIÓN*
El ticket está desactivado hasta verificar el comprobante.

#GameZtore #Ticket #{codigo_ticket}')
            `);
            return res.json(defaultConfig.recordset[0]);
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('❌ Error al obtener configuración:', error.message);
        res.status(500).json({ error: 'Error al obtener configuración' });
    }
};

// Actualizar configuración del sistema
exports.updateConfig = async (req, res) => {
    try {
        const {
            telefono_notificaciones,
            telefono_pagos,
            nombre_beneficiario_yape,
            qr_pago_base64,
            qr_pago_url,
            mensaje_whatsapp_template
        } = req.body;

        const pool = getConnection();

        // Verificar si existe configuración
        const existingConfig = await pool.request().query(`
            SELECT TOP 1 id FROM dbo.sistema_config ORDER BY id DESC
        `);

        let result;

        if (existingConfig.recordset.length === 0) {
            // Crear nueva configuración
            result = await pool.request()
                .input('telefono_notificaciones', sql.VarChar(20), telefono_notificaciones)
                .input('telefono_pagos', sql.VarChar(20), telefono_pagos)
                .input('nombre_beneficiario_yape', sql.VarChar(100), nombre_beneficiario_yape)
                .input('qr_pago_base64', sql.NVarChar(sql.MAX), qr_pago_base64)
                .input('qr_pago_url', sql.VarChar(255), qr_pago_url)
                .input('mensaje_whatsapp_template', sql.NVarChar(1000), mensaje_whatsapp_template)
                .query(`
                    INSERT INTO dbo.sistema_config 
                    (telefono_notificaciones, telefono_pagos, nombre_beneficiario_yape, qr_pago_base64, qr_pago_url, mensaje_whatsapp_template)
                    OUTPUT INSERTED.*
                    VALUES 
                    (@telefono_notificaciones, @telefono_pagos, @nombre_beneficiario_yape, @qr_pago_base64, @qr_pago_url, @mensaje_whatsapp_template)
                `);
        } else {
            // Actualizar configuración existente
            const configId = existingConfig.recordset[0].id;
            result = await pool.request()
                .input('id', sql.Int, configId)
                .input('telefono_notificaciones', sql.VarChar(20), telefono_notificaciones)
                .input('telefono_pagos', sql.VarChar(20), telefono_pagos)
                .input('nombre_beneficiario_yape', sql.VarChar(100), nombre_beneficiario_yape)
                .input('qr_pago_base64', sql.NVarChar(sql.MAX), qr_pago_base64)
                .input('qr_pago_url', sql.VarChar(255), qr_pago_url)
                .input('mensaje_whatsapp_template', sql.NVarChar(1000), mensaje_whatsapp_template)
                .input('updated_at', sql.DateTime, new Date())
                .query(`
                    UPDATE dbo.sistema_config 
                    SET 
                        telefono_notificaciones = @telefono_notificaciones,
                        telefono_pagos = @telefono_pagos,
                        nombre_beneficiario_yape = @nombre_beneficiario_yape,
                        qr_pago_base64 = @qr_pago_base64,
                        qr_pago_url = @qr_pago_url,
                        mensaje_whatsapp_template = @mensaje_whatsapp_template,
                        updated_at = @updated_at
                    OUTPUT INSERTED.*
                    WHERE id = @id
                `);
        }

        console.log('✅ Configuración del sistema actualizada');
        res.json({
            success: true,
            message: 'Configuración actualizada exitosamente',
            config: result.recordset[0]
        });

    } catch (error) {
        console.error('❌ Error al actualizar configuración:', error.message);
        res.status(500).json({ error: 'Error al actualizar configuración' });
    }
};

// Obtener tickets por estado (pendientes, pagado, rechazado, todos)
exports.getTicketsByStatus = async (req, res) => {
    try {
        const { status } = req.query; // Obtener el estado desde query params
        const pool = getConnection();

        // Validar estados permitidos
        const validStatuses = ['pendiente', 'pagado', 'rechazado', 'todos'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ 
                error: 'Estado inválido. Estados permitidos: pendiente, pagado, rechazado, todos' 
            });
        }

        // Primero verificar qué columnas existen en la tabla tickets
        const columnsCheck = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'tickets' 
            AND COLUMN_NAME IN ('apellidos', 'comprobante_base64', 'sorteo_id')
        `);

        const existingColumns = columnsCheck.recordset.map(row => row.COLUMN_NAME);
        const hasApellidos = existingColumns.includes('apellidos');
        const hasComprobante = existingColumns.includes('comprobante_base64');
        const hasSorteoId = existingColumns.includes('sorteo_id');

        // Construir WHERE clause según el estado
        let whereClause = '';
        if (status && status !== 'todos') {
            whereClause = `WHERE t.estado_pago = '${status}'`;
        }

        // Construir query dinámicamente según las columnas disponibles
        let query = `
            SELECT 
                t.id,
                t.codigo_ticket,
                t.dni,
                t.nombres,
                ${hasApellidos ? 't.apellidos,' : "'' as apellidos,"}
                t.telefono,
                t.departamento,
                t.estado_pago,
                t.fecha,
                ${hasComprobante ? 't.comprobante_base64,' : "'' as comprobante_base64,"}
                ${hasSorteoId ? 's.nombre_sorteo, s.ticket_price' : "'Sorteo General' as nombre_sorteo, 10 as ticket_price"}
            FROM dbo.tickets t
            ${hasSorteoId ? 'LEFT JOIN dbo.sorteo_config s ON t.sorteo_id = s.id' : ''}
            ${whereClause}
            ORDER BY t.fecha DESC
        `;

    

        const result = await pool.request().query(query);

       
        res.json(result.recordset);

    } catch (error) {
        console.error('❌ Error al obtener tickets por estado:', error.message);
        console.error('📋 Stack trace:', error.stack);

        // Enviar respuesta de error con array vacío para evitar problemas en frontend
        res.status(500).json({
            error: 'Error al obtener tickets',
            message: error.message,
            tickets: [] // Array vacío para que el frontend no falle
        });
    }
};

// Obtener tickets pendientes para el dashboard (mantener compatibilidad)
exports.getPendingTickets = async (req, res) => {
    try {
        const pool = getConnection();

        // Primero verificar qué columnas existen en la tabla tickets
        const columnsCheck = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'tickets' 
            AND COLUMN_NAME IN ('apellidos', 'comprobante_base64', 'sorteo_id')
        `);

        const existingColumns = columnsCheck.recordset.map(row => row.COLUMN_NAME);
        const hasApellidos = existingColumns.includes('apellidos');
        const hasComprobante = existingColumns.includes('comprobante_base64');
        const hasSorteoId = existingColumns.includes('sorteo_id');

        // Construir query dinámicamente según las columnas disponibles
        let query = `
            SELECT 
                t.id,
                t.codigo_ticket,
                t.dni,
                t.nombres,
                ${hasApellidos ? 't.apellidos,' : "'' as apellidos,"}
                t.telefono,
                t.departamento,
                t.estado_pago,
                t.fecha,
                ${hasComprobante ? 't.comprobante_base64,' : "'' as comprobante_base64,"}
                ${hasSorteoId ? 's.nombre_sorteo, s.ticket_price' : "'Sorteo General' as nombre_sorteo, 10 as ticket_price"}
            FROM dbo.tickets t
            ${hasSorteoId ? 'LEFT JOIN dbo.sorteo_config s ON t.sorteo_id = s.id' : ''}
            WHERE t.estado_pago = 'pendiente'
            ORDER BY t.fecha DESC
        `;

     

        const result = await pool.request().query(query);

      
        res.json(result.recordset);

    } catch (error) {
        console.error('❌ Error al obtener tickets pendientes:', error.message);
        console.error('📋 Stack trace:', error.stack);

        // Enviar respuesta de error con array vacío para evitar problemas en frontend
        res.status(500).json({
            error: 'Error al obtener tickets pendientes',
            message: error.message,
            tickets: [] // Array vacío para que el frontend no falle
        });
    }
};
