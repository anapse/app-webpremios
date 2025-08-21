-- ==============================================
-- VERIFICAR ESTADO ACTUAL - EJECUTAR PRIMERO
-- ==============================================

USE [sorteo_db];

PRINT '🔍 VERIFICANDO ESTADO ACTUAL DE LA BASE DE DATOS';
PRINT '===============================================';

-- 1. Verificar columnas en tabla premios
PRINT '';
PRINT '📋 COLUMNAS EN TABLA PREMIOS:';
SELECT 
    COLUMN_NAME as 'Columna',
    DATA_TYPE as 'Tipo',
    IS_NULLABLE as 'Permite NULL',
    ISNULL(CAST(CHARACTER_MAXIMUM_LENGTH AS VARCHAR), 'N/A') as 'Longitud Máxima'
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'premios'
ORDER BY ORDINAL_POSITION;

-- 2. Verificar específicamente las columnas de imagen
PRINT '';
PRINT '🖼️ COLUMNAS DE IMAGEN EN PREMIOS:';
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.premios') AND name = 'imagen_url')
    PRINT '✅ imagen_url: EXISTE'
ELSE
    PRINT '❌ imagen_url: NO EXISTE';

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.premios') AND name = 'imagen_base64')
    PRINT '✅ imagen_base64: EXISTE'
ELSE
    PRINT '❌ imagen_base64: NO EXISTE';

-- 3. Verificar tabla home_banner
PRINT '';
PRINT '🏠 TABLA HOME_BANNER:';
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[home_banner]') AND type in (N'U'))
BEGIN
    PRINT '✅ Tabla home_banner: EXISTE';
    
    -- Mostrar estructura
    PRINT '';
    PRINT '📋 ESTRUCTURA DE HOME_BANNER:';
    SELECT 
        COLUMN_NAME as 'Columna',
        DATA_TYPE as 'Tipo',
        IS_NULLABLE as 'Permite NULL'
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'home_banner'
    ORDER BY ORDINAL_POSITION;
    
    -- Mostrar datos
    DECLARE @count INT;
    SELECT @count = COUNT(*) FROM home_banner;
    PRINT '';
    PRINT '📊 REGISTROS EN HOME_BANNER: ' + CAST(@count AS VARCHAR);
    
    IF @count > 0
    BEGIN
        PRINT '';
        PRINT '📄 DATOS ACTUALES:';
        SELECT id, titulo, descripcion, activo, fecha_creacion FROM home_banner;
    END
END
ELSE
BEGIN
    PRINT '❌ Tabla home_banner: NO EXISTE';
END

PRINT '';
PRINT '🎯 RESUMEN:';
PRINT '==========';

-- Resumen de lo que falta
DECLARE @necesita_imagen_url BIT = 0;
DECLARE @necesita_imagen_base64 BIT = 0;
DECLARE @necesita_tabla_banner BIT = 0;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.premios') AND name = 'imagen_url')
    SET @necesita_imagen_url = 1;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.premios') AND name = 'imagen_base64')
    SET @necesita_imagen_base64 = 1;

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[home_banner]') AND type in (N'U'))
    SET @necesita_tabla_banner = 1;

IF @necesita_imagen_url = 1 OR @necesita_imagen_base64 = 1 OR @necesita_tabla_banner = 1
BEGIN
    PRINT '❌ FALTAN ELEMENTOS:';
    IF @necesita_imagen_url = 1
        PRINT '   - Columna imagen_url en tabla premios';
    IF @necesita_imagen_base64 = 1
        PRINT '   - Columna imagen_base64 en tabla premios';
    IF @necesita_tabla_banner = 1
        PRINT '   - Tabla home_banner completa';
END
ELSE
BEGIN
    PRINT '✅ TODO ESTÁ CONFIGURADO CORRECTAMENTE';
END
