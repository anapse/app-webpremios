const { getConnection, sql } = require('./config/db');

async function fixSorteoId() {
    try {
        console.log('🔍 Verificando y corrigiendo columna sorteo_id...');

        const pool = getConnection();

        // Verificar si la columna sorteo_id existe
        const checkColumn = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'tickets' AND COLUMN_NAME = 'sorteo_id'
        `);

        if (checkColumn.recordset.length === 0) {
            console.log('➕ Agregando columna sorteo_id a la tabla tickets...');

            await pool.request().query(`
                ALTER TABLE [dbo].[tickets] 
                ADD [sorteo_id] [int] NULL
            `);

            console.log('✅ Columna sorteo_id agregada exitosamente');

            // Actualizar tickets existentes con el sorteo activo
            const updateTickets = await pool.request().query(`
                UPDATE [dbo].[tickets] 
                SET sorteo_id = (
                    SELECT TOP 1 id 
                    FROM [dbo].[sorteo_config] 
                    WHERE estado_sorteo = 1 
                    ORDER BY id DESC
                )
                WHERE sorteo_id IS NULL
            `);

            console.log('✅ Tickets existentes actualizados con sorteo_id');
        } else {
            console.log('✅ La columna sorteo_id ya existe');
        }

        // Verificar estructura final
        const finalCheck = await pool.request().query(`
            SELECT 
                COLUMN_NAME, 
                DATA_TYPE, 
                IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'tickets' AND COLUMN_NAME = 'sorteo_id'
        `);

        console.log('📋 Estado de la columna sorteo_id:', finalCheck.recordset);

        // Verificar sorteos disponibles
        const sorteos = await pool.request().query(`
            SELECT id, nombre_sorteo, estado_sorteo 
            FROM sorteo_config 
            ORDER BY id DESC
        `);

        console.log('📊 Sorteos disponibles:', sorteos.recordset);

        console.log('🎉 Reparación completada');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixSorteoId();
