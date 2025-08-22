// Script para ejecutar la actualización de la base de datos
// Agregar columna nombre_beneficiario_yape a la tabla sistema_config

const { getConnection, sql } = require('./config/db');
const fs = require('fs');
const path = require('path');

async function updateDatabase() {
    console.log('🔄 Iniciando actualización de base de datos...');

    try {
        const pool = getConnection();

        // Leer el script SQL
        const scriptPath = path.join(__dirname, 'scripts', 'add_nombre_beneficiario_column.sql');
        const sqlScript = fs.readFileSync(scriptPath, 'utf8');

        // Ejecutar el script
        console.log('📝 Ejecutando script SQL...');
        const result = await pool.request().query(sqlScript);

        console.log('✅ Script ejecutado exitosamente');
        console.log('📊 Resultado:', result);

        // Verificar que la columna se agregó correctamente
        const verifyResult = await pool.request().query(`
            SELECT COUNT(*) as column_exists
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'sistema_config' 
            AND COLUMN_NAME = 'nombre_beneficiario_yape'
        `);

        if (verifyResult.recordset[0].column_exists > 0) {
            console.log('✅ Columna nombre_beneficiario_yape verificada exitosamente');
        } else {
            console.log('❌ Error: La columna no se creó correctamente');
        }

        // Mostrar estructura actual de la tabla
        const structureResult = await pool.request().query(`
            SELECT 
                COLUMN_NAME,
                DATA_TYPE,
                CHARACTER_MAXIMUM_LENGTH,
                IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'sistema_config'
            ORDER BY ORDINAL_POSITION
        `);

        console.log('📋 Estructura actual de la tabla sistema_config:');
        console.table(structureResult.recordset);

    } catch (error) {
        console.error('❌ Error al actualizar la base de datos:', error.message);
        console.error('📋 Stack trace:', error.stack);
    }
}

// Ejecutar la actualización
updateDatabase();
