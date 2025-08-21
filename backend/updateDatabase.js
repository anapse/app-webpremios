const { connectDB } = require('./config/db');
const sql = require('mssql');

async function updateDatabase() {
    try {
        const pool = await connectDB();

        console.log('🔍 Verificando estructura actual de la tabla premios...');

        // Verificar columnas existentes
        const checkColumnsQuery = `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'premios' 
      AND COLUMN_NAME IN ('imagen_url', 'imagen_base64')
    `;

        const existingColumns = await pool.request().query(checkColumnsQuery);
        console.log('Columnas existentes:', existingColumns.recordset);

        // Agregar columnas si no existen
        if (existingColumns.recordset.length === 0) {
            console.log('➕ Agregando columnas de imagen a la tabla premios...');

            const alterTableQuery = `
        ALTER TABLE premios 
        ADD 
          imagen_url NVARCHAR(500) NULL,
          imagen_base64 NTEXT NULL
      `;

            await pool.request().query(alterTableQuery);
            console.log('✅ Columnas agregadas exitosamente');
        } else {
            console.log('✅ Las columnas ya existen');
        }

        // Verificar si existe la tabla home_banner
        const checkBannerTable = `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'home_banner'
    `;

        const bannerTableExists = await pool.request().query(checkBannerTable);

        if (bannerTableExists.recordset.length === 0) {
            console.log('➕ Creando tabla home_banner...');

            const createBannerTable = `
        CREATE TABLE home_banner (
          id INT IDENTITY(1,1) PRIMARY KEY,
          imagen_url NVARCHAR(500) NULL,
          imagen_base64 NTEXT NULL,
          texto_titulo NVARCHAR(200) NULL,
          texto_subtitulo NVARCHAR(300) NULL,
          activo BIT DEFAULT 1,
          fecha_creacion DATETIME DEFAULT GETDATE(),
          fecha_actualizacion DATETIME DEFAULT GETDATE()
        )
      `;

            await pool.request().query(createBannerTable);
            console.log('✅ Tabla home_banner creada exitosamente');

            // Insertar banner por defecto
            const insertDefaultBanner = `
        INSERT INTO home_banner (texto_titulo, texto_subtitulo, activo)
        VALUES ('¡Participa y Gana!', 'Grandes premios te esperan', 1)
      `;

            await pool.request().query(insertDefaultBanner);
            console.log('✅ Banner por defecto insertado');
        } else {
            console.log('✅ La tabla home_banner ya existe');
        }

        console.log('🎉 Base de datos actualizada correctamente');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error actualizando la base de datos:', error);
        process.exit(1);
    }
}

updateDatabase();
