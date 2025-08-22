-- Script para agregar la columna nombre_beneficiario_yape a la tabla sistema_config
-- Fecha: 2025-08-21
-- Descripción: Permite configurar el nombre del beneficiario que aparece junto al QR de Yape

-- Verificar si la columna ya existe
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'sistema_config' 
    AND COLUMN_NAME = 'nombre_beneficiario_yape'
)
BEGIN
    -- Agregar la columna
    ALTER TABLE dbo.sistema_config
    ADD nombre_beneficiario_yape VARCHAR(100) NULL;
    
    PRINT '✅ Columna nombre_beneficiario_yape agregada exitosamente';
    
    -- Actualizar registros existentes con valor por defecto
    UPDATE dbo.sistema_config 
    SET nombre_beneficiario_yape = 'Nombre del Beneficiario'
    WHERE nombre_beneficiario_yape IS NULL;
    
    PRINT '✅ Registros existentes actualizados con valor por defecto';
END
ELSE
BEGIN
    PRINT '⚠️ La columna nombre_beneficiario_yape ya existe';
END

-- Verificar el resultado
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'sistema_config' 
AND COLUMN_NAME = 'nombre_beneficiario_yape';

PRINT '📋 Estructura de la tabla actualizada';
