const { connectDB } = require('./config/db');

async function diagnosticarBaseDatos() {
    try {
        console.log('🔍 DIAGNÓSTICO DE BASE DE DATOS - IMÁGENES');
        console.log('===========================================\n');

        const pool = await connectDB();

        // 1. Verificar estructura de tabla premios
        console.log('📋 1. ESTRUCTURA TABLA PREMIOS:');
        const premiosColumns = await pool.request().query(`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        IS_NULLABLE,
        CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'premios'
      ORDER BY ORDINAL_POSITION
    `);

        premiosColumns.recordset.forEach(col => {
            const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
            const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
            console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE}${length} ${nullable}`);
        });

        // 2. Verificar si existen las columnas de imagen
        const imageColumns = premiosColumns.recordset.filter(col =>
            col.COLUMN_NAME === 'imagen_url' || col.COLUMN_NAME === 'imagen_base64'
        );

        console.log(`\n🖼️ 2. COLUMNAS DE IMAGEN EN PREMIOS:`);
        if (imageColumns.length === 0) {
            console.log('   ❌ NO EXISTEN - Necesita agregar columnas');
        } else {
            imageColumns.forEach(col => {
                console.log(`   ✅ ${col.COLUMN_NAME} existe`);
            });
        }

        // 3. Verificar tabla home_banner
        console.log(`\n🏠 3. TABLA HOME_BANNER:`);
        const bannerTable = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'home_banner'
    `);

        if (bannerTable.recordset.length === 0) {
            console.log('   ❌ NO EXISTE - Necesita crear tabla');
        } else {
            console.log('   ✅ EXISTE');

            // Mostrar estructura
            const bannerColumns = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'home_banner'
        ORDER BY ORDINAL_POSITION
      `);

            console.log('   📋 Estructura:');
            bannerColumns.recordset.forEach(col => {
                const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
                console.log(`      ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${nullable}`);
            });

            // Mostrar datos
            const bannerData = await pool.request().query('SELECT * FROM home_banner');
            console.log(`   📊 Registros: ${bannerData.recordset.length}`);
            if (bannerData.recordset.length > 0) {
                bannerData.recordset.forEach((row, index) => {
                    console.log(`      [${index + 1}] ID: ${row.id}, Título: "${row.titulo}"`);
                });
            }
        }

        // 4. Generar comandos SQL necesarios
        console.log(`\n🔧 4. COMANDOS SQL NECESARIOS:`);

        if (imageColumns.length < 2) {
            console.log('\n-- AGREGAR COLUMNAS A TABLA PREMIOS:');
            if (!imageColumns.find(col => col.COLUMN_NAME === 'imagen_url')) {
                console.log('ALTER TABLE premios ADD imagen_url NVARCHAR(500) NULL;');
            }
            if (!imageColumns.find(col => col.COLUMN_NAME === 'imagen_base64')) {
                console.log('ALTER TABLE premios ADD imagen_base64 NVARCHAR(MAX) NULL;');
            }
        }

        if (bannerTable.recordset.length === 0) {
            console.log('\n-- CREAR TABLA HOME_BANNER:');
            console.log(`CREATE TABLE home_banner (
    id INT IDENTITY(1,1) PRIMARY KEY,
    titulo NVARCHAR(200) NOT NULL,
    descripcion NVARCHAR(MAX) NULL,
    imagen_url NVARCHAR(500) NULL,
    imagen_base64 NVARCHAR(MAX) NULL,
    activo BIT NOT NULL DEFAULT(1),
    fecha_creacion DATETIME NOT NULL DEFAULT(GETDATE()),
    fecha_actualizacion DATETIME NOT NULL DEFAULT(GETDATE())
);`);
            console.log(`\nINSERT INTO home_banner (titulo, descripcion, activo) 
VALUES ('¡Gana Increíbles Premios!', 'Participa en nuestro sorteo y llévate los mejores premios', 1);`);
        }

        console.log('\n✅ DIAGNÓSTICO COMPLETADO');

    } catch (error) {
        console.error('❌ Error en diagnóstico:', error.message);
        console.log('\n🔧 POSIBLES SOLUCIONES:');
        console.log('1. Verificar que el servidor SQL esté ejecutándose');
        console.log('2. Verificar credenciales en .env');
        console.log('3. Ejecutar consultas SQL manualmente en SSMS');
    }

    process.exit(0);
}

diagnosticarBaseDatos();
