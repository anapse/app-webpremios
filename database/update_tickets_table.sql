-- Script para agregar las columnas faltantes a la tabla tickets
-- Ejecutar solo si las columnas no existen

-- Agregar columna apellidos si no existe
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tickets' AND COLUMN_NAME = 'apellidos')
BEGIN
    ALTER TABLE dbo.tickets ADD apellidos NVARCHAR(100) NULL;
    PRINT 'Columna apellidos agregada exitosamente';
END
ELSE
BEGIN
    PRINT 'Columna apellidos ya existe';
END

-- Agregar columna comprobante_base64 si no existe
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tickets' AND COLUMN_NAME = 'comprobante_base64')
BEGIN
    ALTER TABLE dbo.tickets ADD comprobante_base64 NVARCHAR(MAX) NULL;
    PRINT 'Columna comprobante_base64 agregada exitosamente';
END
ELSE
BEGIN
    PRINT 'Columna comprobante_base64 ya existe';
END

-- Verificar las columnas
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'tickets' 
ORDER BY ORDINAL_POSITION;
