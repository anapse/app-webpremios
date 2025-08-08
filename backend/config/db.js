const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT, 10),
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

let pool;

const connectToDB = async () => {
    try {
        pool = await sql.connect(config);
        console.log('✅ Conectado a SQL Server');
    } catch (err) {
        console.error('❌ Error de conexión a SQL Server:');
        console.error(err.message);
    }
};

connectToDB();

const getConnection = () => {
    if (!pool) {
        throw new Error('⛔ Base de datos no conectada');
    }
    return pool;
};

module.exports = {
    sql,
    getConnection
};
