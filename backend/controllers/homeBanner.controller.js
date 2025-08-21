const { getConnection, sql } = require('../config/db');

// Obtener banner activo del home
const getHomeBanner = async (req, res) => {
    try {
        const pool = await getConnection();

        // Verificar si la tabla existe
        const tableExistsResult = await pool.request()
            .query(`
                SELECT COUNT(*) as count 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'home_banner'
            `);

        if (tableExistsResult.recordset[0].count === 0) {
            // La tabla no existe, devolver datos por defecto
            return res.json({
                message: 'Tabla home_banner no existe, usando valores por defecto',
                banner: {
                    titulo: null,
                    descripcion: null,
                    imagen_url: null,
                    imagen_base64: null
                }
            });
        }

        const result = await pool.request()
            .query('SELECT * FROM home_banner WHERE activo = 1 ORDER BY fecha_actualizacion DESC');

        if (result.recordset.length === 0) {
            return res.json({
                message: 'No hay banner configurado',
                banner: {
                    titulo: null,
                    descripcion: null,
                    imagen_url: null,
                    imagen_base64: null
                }
            });
        }

        res.json({
            message: 'Banner encontrado',
            banner: result.recordset[0]
        });
    } catch (err) {
        console.error('❌ Error al obtener banner del home:', err.message);
        // En caso de error, devolver datos por defecto
        res.json({
            message: 'Error al cargar banner, usando valores por defecto',
            banner: {
                titulo: null,
                descripcion: null,
                imagen_url: null,
                imagen_base64: null
            }
        });
    }
};

// Actualizar banner del home
const updateHomeBanner = async (req, res) => {
    const { titulo, descripcion, imagen_url, imagen_base64 } = req.body;

    // Aceptar actualización sin título/descripcion; usar valores por defecto seguros
    const safeTitulo = (typeof titulo === 'string') ? titulo : '';
    const safeDescripcion = (typeof descripcion === 'string' && descripcion.trim() !== '') ? descripcion : null;

    try {
        const pool = await getConnection();

        // Verificar si existe un banner activo
        const existingResult = await pool.request()
            .query('SELECT id FROM home_banner WHERE activo = 1');

        if (existingResult.recordset.length > 0) {
            // Actualizar banner existente
            const result = await pool.request()
                .input('id', sql.Int, existingResult.recordset[0].id)
                .input('titulo', sql.NVarChar(200), safeTitulo)
                .input('descripcion', sql.NVarChar(sql.MAX), safeDescripcion)
                .input('imagen_url', sql.NVarChar(500), imagen_url || null)
                .input('imagen_base64', sql.NVarChar(sql.MAX), imagen_base64 || null)
                .query(`
                    UPDATE home_banner 
                    SET titulo = @titulo,
                        descripcion = @descripcion,
                        imagen_url = @imagen_url,
                        imagen_base64 = @imagen_base64,
                        fecha_actualizacion = GETDATE()
                    OUTPUT INSERTED.*
                    WHERE id = @id
                `);

            res.json({
                message: 'Banner actualizado exitosamente',
                banner: result.recordset[0]
            });
        } else {
            // Crear nuevo banner
            const result = await pool.request()
                .input('titulo', sql.NVarChar(200), safeTitulo)
                .input('descripcion', sql.NVarChar(sql.MAX), safeDescripcion)
                .input('imagen_url', sql.NVarChar(500), imagen_url || null)
                .input('imagen_base64', sql.NVarChar(sql.MAX), imagen_base64 || null)
                .query(`
                    INSERT INTO home_banner (titulo, descripcion, imagen_url, imagen_base64, activo)
                    OUTPUT INSERTED.*
                    VALUES (@titulo, @descripcion, @imagen_url, @imagen_base64, 1)
                `);

            res.status(201).json({
                message: 'Banner creado exitosamente',
                banner: result.recordset[0]
            });
        }
    } catch (err) {
        console.error('❌ Error al actualizar banner del home:', err.message);
        res.status(500).json({ error: 'Error al actualizar banner del home' });
    }
};

module.exports = {
    getHomeBanner,
    updateHomeBanner
};
