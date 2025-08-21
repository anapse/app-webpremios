-- ==============================================
-- SCRIPT DE ACTUALIZACIÓN - SOPORTE IMÁGENES
-- ==============================================
-- Ejecutar en SQL Server Management Studio o Azure Data Studio

USE [sorteo_db];
GO

PRINT '🔍 Iniciando actualización de base de datos para soporte de imágenes...';
GO

-- ==============================================
-- 1. ACTUALIZAR TABLA PREMIOS
-- ==============================================

PRINT '📋 Verificando tabla premios...';

-- Agregar columna imagen_url si no existe
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.premios') 
    AND name = 'imagen_url'
)
BEGIN
    ALTER TABLE [dbo].[premios] ADD [imagen_url] NVARCHAR(500) NULL;
    PRINT '✅ Columna imagen_url agregada a tabla premios';
END
ELSE
BEGIN
    PRINT '✅ Columna imagen_url ya existe en tabla premios';
END

-- Agregar columna imagen_base64 si no existe
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.premios') 
    AND name = 'imagen_base64'
)
BEGIN
    ALTER TABLE [dbo].[premios] ADD [imagen_base64] NVARCHAR(MAX) NULL;
    PRINT '✅ Columna imagen_base64 agregada a tabla premios';
END
ELSE
BEGIN
    PRINT '✅ Columna imagen_base64 ya existe en tabla premios';
END

GO

-- ==============================================
-- 2. CREAR TABLA HOME_BANNER
-- ==============================================

PRINT '🏠 Verificando tabla home_banner...';

-- Crear tabla home_banner si no existe
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
    
    PRINT '✅ Tabla home_banner creada exitosamente';
    
    -- Insertar registro por defecto
    INSERT INTO [dbo].[home_banner] (titulo, descripcion, activo)
    VALUES ('¡Gana Increíbles Premios!', 'Participa en nuestro sorteo y llévate los mejores premios. ¡No te quedes fuera!', 1);
    
    PRINT '✅ Registro por defecto insertado en home_banner';
END
ELSE
BEGIN
    PRINT '✅ Tabla home_banner ya existe';
END

GO

-- ==============================================
-- 3. VERIFICACIÓN FINAL
-- ==============================================

PRINT '🔍 Verificación final...';

-- Mostrar estructura de tabla premios
PRINT '📋 Estructura tabla premios:';
SELECT 
    COLUMN_NAME as 'Columna',
    DATA_TYPE as 'Tipo',
    IS_NULLABLE as 'Nullable',
    ISNULL(CAST(CHARACTER_MAXIMUM_LENGTH AS VARCHAR), '') as 'Longitud'
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'premios'
ORDER BY ORDINAL_POSITION;

-- Mostrar estructura de tabla home_banner
PRINT '🏠 Estructura tabla home_banner:';
SELECT 
    COLUMN_NAME as 'Columna',
    DATA_TYPE as 'Tipo',
    IS_NULLABLE as 'Nullable'
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'home_banner'
ORDER BY ORDINAL_POSITION;

-- Contar registros en home_banner
DECLARE @banner_count INT;
SELECT @banner_count = COUNT(*) FROM home_banner;
PRINT '📊 Registros en home_banner: ' + CAST(@banner_count AS VARCHAR);

PRINT '🎉 ¡Actualización completada exitosamente!';
GO
