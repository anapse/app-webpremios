-- Tabla de usuarios para login del dashboard
CREATE TABLE dbo.usuarios (
    id INT IDENTITY(1,1) PRIMARY KEY,
    usuario NVARCHAR(50) NOT NULL UNIQUE,
    password_md5 VARCHAR(32) NOT NULL,
    ultima_sesion DATETIME NULL
);

-- Insertar usuario de prueba (usuario: admin, password: admin123)
INSERT INTO dbo.usuarios (usuario, password_md5) 
VALUES ('admin', '0192023a7bbd73250516f069df18b500');
