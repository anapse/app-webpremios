-- Actualizar tabla tickets con nuevas columnas necesarias
USE [sorteo_db]
GO

-- Agregar columna apellidos si no existe
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'tickets' AND COLUMN_NAME = 'apellidos'
)
BEGIN
    ALTER TABLE [dbo].[tickets]
    ADD [apellidos] [varchar](100) NULL;
    PRINT '✅ Columna apellidos agregada a la tabla tickets';
END
ELSE
BEGIN
    PRINT '⚠️ La columna apellidos ya existe en la tabla tickets';
END

-- Agregar columna comprobante_base64 si no existe
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'tickets' AND COLUMN_NAME = 'comprobante_base64'
)
BEGIN
    ALTER TABLE [dbo].[tickets]
    ADD [comprobante_base64] [nvarchar](MAX) NULL;
    PRINT '✅ Columna comprobante_base64 agregada a la tabla tickets';
END
ELSE
BEGIN
    PRINT '⚠️ La columna comprobante_base64 ya existe en la tabla tickets';
END

-- Agregar columna sorteo_id si no existe (necesaria para relacionar con sorteos)
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'tickets' AND COLUMN_NAME = 'sorteo_id'
)
BEGIN
    ALTER TABLE [dbo].[tickets]
    ADD [sorteo_id] [int] NULL;
    PRINT '✅ Columna sorteo_id agregada a la tabla tickets';
    
    -- Solo actualizar si existe la tabla sorteo_config
    IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'sorteo_config')
    BEGIN
        -- Actualizar tickets existentes con el sorteo activo (si existe)
        UPDATE [dbo].[tickets] 
        SET sorteo_id = (
            SELECT TOP 1 id 
            FROM [dbo].[sorteo_config] 
            WHERE estado = 1 
            ORDER BY id DESC
        )
        WHERE sorteo_id IS NULL;
        
        PRINT '✅ Tickets existentes actualizados con sorteo_id';
    END
    ELSE
    BEGIN
        PRINT '⚠️ Tabla sorteo_config no existe, sorteo_id queda en NULL';
    END
END
ELSE
BEGIN
    PRINT '⚠️ La columna sorteo_id ya existe en la tabla tickets';
END

-- Verificar estructura actualizada de la tabla
PRINT '📋 Estructura actual de la tabla tickets:';
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'tickets'
ORDER BY ORDINAL_POSITION;

-- Mostrar total de tickets por estado (sin incluir sorteo_id aún)
PRINT '📊 Estado actual de tickets:';
SELECT 
    estado_pago,
    COUNT(*) as total
FROM [dbo].[tickets]
GROUP BY estado_pago;
