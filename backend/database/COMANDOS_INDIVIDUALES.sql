-- ==============================================
-- COMANDOS SQL INDIVIDUALES - COPIA Y PEGA
-- ==============================================

-- 🔧 Si necesitas ejecutar comando por comando, usa estos:

-- ==== 1. AGREGAR COLUMNAS A TABLA PREMIOS ====
USE [sorteo_db];

-- Verificar y agregar columna imagen_url si no existe
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.premios') 
    AND name = 'imagen_url'
)
BEGIN
    ALTER TABLE [dbo].[premios] ADD [imagen_url] NVARCHAR(500) NULL;
    PRINT '✅ Columna imagen_url agregada';
END
ELSE
BEGIN
    PRINT '⚠️ Columna imagen_url ya existe';
END

-- Verificar y agregar columna imagen_base64 si no existe
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.premios') 
    AND name = 'imagen_base64'
)
BEGIN
    ALTER TABLE [dbo].[premios] ADD [imagen_base64] NVARCHAR(MAX) NULL;
    PRINT '✅ Columna imagen_base64 agregada';
END
ELSE
BEGIN
    PRINT '⚠️ Columna imagen_base64 ya existe';
END

-- ==== 2. CREAR TABLA HOME_BANNER ====
IF NOT EXISTS (
    SELECT * FROM sys.objects 
    WHERE object_id = OBJECT_ID(N'[dbo].[home_banner]') 
    AND type in (N'U')
)
BEGIN
    CREATE TABLE [dbo].[home_banner](
        [id] [int] IDENTITY(1,1) NOT NULL,
        [titulo] [nvarchar](200) NOT NULL,
        [descripcion] [nvarchar](max) NULL,
        [imagen_url] [nvarchar](500) NULL,
        [imagen_base64] [nvarchar](max) NULL,
        [activo] [bit] NOT NULL DEFAULT((1)),
        [fecha_creacion] [datetime] NOT NULL DEFAULT(GETDATE()),
        [fecha_actualizacion] [datetime] NOT NULL DEFAULT(GETDATE()),
        CONSTRAINT [PK_home_banner] PRIMARY KEY CLUSTERED ([id] ASC)
    );
    PRINT '✅ Tabla home_banner creada';
END
ELSE
BEGIN
    PRINT '⚠️ Tabla home_banner ya existe';
END

-- ==== 3. INSERTAR BANNER POR DEFECTO ====
IF NOT EXISTS (SELECT * FROM home_banner WHERE id = 1)
BEGIN
    INSERT INTO [dbo].[home_banner] (titulo, descripcion, activo)
    VALUES ('¡Gana Increíbles Premios!', 'Participa en nuestro sorteo y llévate los mejores premios. ¡No te quedes fuera!', 1);
    PRINT '✅ Banner por defecto insertado';
END
ELSE
BEGIN
    PRINT '⚠️ Banner por defecto ya existe';
END

-- ==== 4. VERIFICAR RESULTADOS ====
-- Ver estructura de premios
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'premios'
ORDER BY ORDINAL_POSITION;

-- Ver estructura de home_banner
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'home_banner'
ORDER BY ORDINAL_POSITION;

-- Ver datos en home_banner
SELECT * FROM home_banner;

-- Ver datos en premios (con nuevas columnas)
SELECT 
    id, 
    nombre, 
    descripcion,
    imagen_url,
    CASE 
        WHEN imagen_base64 IS NULL THEN 'Sin imagen'
        ELSE 'Con imagen'
    END as estado_imagen
FROM premios;
