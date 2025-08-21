-- ==============================================
-- SCRIPT DE ROLLBACK - DESHACER CAMBIOS
-- ==============================================
-- ⚠️ USAR SOLO EN CASO DE EMERGENCIA

USE [sorteo_db];
GO

PRINT '⚠️ INICIANDO ROLLBACK DE CAMBIOS DE IMÁGENES...';

-- ==============================================
-- 1. ELIMINAR TABLA HOME_BANNER
-- ==============================================

IF EXISTS (
    SELECT * FROM sys.objects 
    WHERE object_id = OBJECT_ID(N'[dbo].[home_banner]') 
    AND type in (N'U')
)
BEGIN
    DROP TABLE [dbo].[home_banner];
    PRINT '🗑️ Tabla home_banner eliminada';
END
ELSE
BEGIN
    PRINT '❌ Tabla home_banner no existe';
END

-- ==============================================
-- 2. ELIMINAR COLUMNAS DE TABLA PREMIOS
-- ==============================================

-- Eliminar columna imagen_base64
IF EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.premios') 
    AND name = 'imagen_base64'
)
BEGIN
    ALTER TABLE [dbo].[premios] DROP COLUMN [imagen_base64];
    PRINT '🗑️ Columna imagen_base64 eliminada de premios';
END
ELSE
BEGIN
    PRINT '❌ Columna imagen_base64 no existe en premios';
END

-- Eliminar columna imagen_url
IF EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.premios') 
    AND name = 'imagen_url'
)
BEGIN
    ALTER TABLE [dbo].[premios] DROP COLUMN [imagen_url];
    PRINT '🗑️ Columna imagen_url eliminada de premios';
END
ELSE
BEGIN
    PRINT '❌ Columna imagen_url no existe en premios';
END

PRINT '✅ ROLLBACK COMPLETADO';
GO
