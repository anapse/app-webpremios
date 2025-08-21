-- Agregar campo imagen a la tabla premios
USE [sorteo_db]
GO

-- Verificar si la columna ya existe antes de agregarla
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.premios') AND name = 'imagen_url')
BEGIN
    ALTER TABLE [dbo].[premios] 
    ADD [imagen_url] [nvarchar](500) NULL;
    
    PRINT 'Columna imagen_url agregada a la tabla premios';
END
ELSE
BEGIN
    PRINT 'La columna imagen_url ya existe en la tabla premios';
END

-- Verificar si la columna imagen_base64 ya existe
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.premios') AND name = 'imagen_base64')
BEGIN
    ALTER TABLE [dbo].[premios] 
    ADD [imagen_base64] [nvarchar](max) NULL;
    
    PRINT 'Columna imagen_base64 agregada a la tabla premios';
END
ELSE
BEGIN
    PRINT 'La columna imagen_base64 ya existe en la tabla premios';
END
GO

-- Crear tabla para banner principal del home si no existe
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[home_banner]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[home_banner](
        [id] [int] IDENTITY(1,1) NOT NULL,
        [titulo] [nvarchar](200) NOT NULL,
        [descripcion] [nvarchar](max) NULL,
        [imagen_url] [nvarchar](500) NULL,
        [imagen_base64] [nvarchar](max) NULL,
        [activo] [bit] NOT NULL DEFAULT(1),
        [fecha_creacion] [datetime] NOT NULL DEFAULT(GETDATE()),
        [fecha_actualizacion] [datetime] NOT NULL DEFAULT(GETDATE()),
    PRIMARY KEY CLUSTERED 
    (
        [id] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY];
    
    PRINT 'Tabla home_banner creada exitosamente';
    
    -- Insertar registro por defecto
    INSERT INTO [dbo].[home_banner] (titulo, descripcion, activo)
    VALUES ('¡Gana Increíbles Premios!', 'Participa en nuestro sorteo y llévate los mejores premios. ¡No te quedes fuera!', 1);
    
    PRINT 'Registro por defecto insertado en home_banner';
END
ELSE
BEGIN
    PRINT 'La tabla home_banner ya existe';
END
GO
