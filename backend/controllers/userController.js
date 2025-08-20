const { getConnection, sql } = require('../config/db');
const crypto = require('crypto');

exports.getUsers = (req, res) => {
    res.json([{ id: 1, name: 'Jesus' }])
}

exports.createUser = (req, res) => {
    const { name } = req.body
    res.status(201).json({ id: 2, name })
}

// Login de usuario
exports.loginUser = async (req, res) => {
    try {
        const { usuario, password } = req.body;
        
        if (!usuario || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
        }

        // Generar MD5 de la contraseña
        const passwordMD5 = crypto.createHash('md5').update(password).digest('hex');
        
        const pool = getConnection();
        
        // Verificar credenciales
        const result = await pool.request()
            .input('usuario', sql.NVarChar(50), usuario)
            .input('password_md5', sql.VarChar(32), passwordMD5)
            .query(`
                SELECT id, usuario, ultima_sesion 
                FROM dbo.usuarios 
                WHERE usuario = @usuario AND password_md5 = @password_md5
            `);
        
        if (result.recordset.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        
        const user = result.recordset[0];
        
        // Actualizar última sesión
        await pool.request()
            .input('id', sql.Int, user.id)
            .input('ultima_sesion', sql.DateTime, new Date())
            .query(`
                UPDATE dbo.usuarios 
                SET ultima_sesion = @ultima_sesion 
                WHERE id = @id
            `);
        
        console.log(`✅ Login exitoso para usuario: ${usuario}`);
        
        res.json({
            success: true,
            user: {
                id: user.id,
                usuario: user.usuario,
                ultima_sesion: new Date()
            }
        });
        
    } catch (error) {
        console.error('❌ Error en login:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}
