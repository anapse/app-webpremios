-- Script para agregar la columna sorteo_id a la tabla tickets
-- Ejecuta este script en tu base de datos SQL Server

USE [sorteo_db]
GO

-- Agregar la columna sorteo_id a la tabla tickets
ALTER TABLE [dbo].[tickets] 
ADD [sorteo_id] [int] NULL
GO

-- Agregar una relación de clave foránea con sorteo_config (opcional)
-- ALTER TABLE [dbo].[tickets]
-- ADD CONSTRAINT FK_tickets_sorteo_config 
-- FOREIGN KEY (sorteo_id) REFERENCES sorteo_config(id)
-- GO

-- Actualizar tickets existentes para que tengan sorteo_id = 1 (o el ID del sorteo actual)
-- UPDATE [dbo].[tickets] 
-- SET sorteo_id = 1 
-- WHERE sorteo_id IS NULL
-- GO

PRINT 'Columna sorteo_id agregada exitosamente a la tabla tickets'
