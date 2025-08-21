const { connectDB } = require('./config/db');

async function checkTables() {
    try {
        const pool = await connectDB();

        // Verificar columnas de premios
        const premiosColumns = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'premios'
      ORDER BY ORDINAL_POSITION
    `);

        console.log('📋 Columnas en tabla premios:');
        premiosColumns.recordset.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
        });

        // Verificar tabla home_banner
        const bannerCheck = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'home_banner'
    `);

        console.log(`\n🏠 Tabla home_banner: ${bannerCheck.recordset.length > 0 ? 'EXISTE' : 'NO EXISTE'}`);

        if (bannerCheck.recordset.length > 0) {
            const bannerData = await pool.request().query('SELECT * FROM home_banner');
            console.log('   Registros:', bannerData.recordset.length);
        }

        console.log('\n✅ Verificación completada');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkTables();
