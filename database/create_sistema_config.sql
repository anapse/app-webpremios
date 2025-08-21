-- Tabla de configuración del sistema
USE [sorteo_db]
GO

CREATE TABLE [dbo].[sistema_config](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[telefono_notificaciones] [varchar](20) NULL, -- WhatsApp para enviar notificaciones de tickets
	[telefono_pagos] [varchar](20) NULL, -- Número para recibir pagos (mostrar en formulario)
	[qr_pago_base64] [nvarchar](max) NULL, -- Imagen QR en base64
	[qr_pago_url] [varchar](255) NULL, -- URL de la imagen QR (opcional)
	[mensaje_whatsapp_template] [nvarchar](1000) NULL, -- Template del mensaje
	[created_at] [datetime] NULL,
	[updated_at] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[sistema_config] ADD DEFAULT (getdate()) FOR [created_at]
GO

ALTER TABLE [dbo].[sistema_config] ADD DEFAULT (getdate()) FOR [updated_at]
GO

-- Insertar configuración inicial
INSERT INTO [dbo].[sistema_config] 
(telefono_notificaciones, telefono_pagos, mensaje_whatsapp_template) 
VALUES 
('51912391502', '51987654321', 
'🎫 *NUEVO TICKET REGISTRADO*

*Datos del participante:*
👤 Nombre: {nombres} {apellidos}
🆔 DNI: {dni}
📱 WhatsApp: {telefono}
📍 Departamento: {departamento}
🎟️ Código de ticket: {codigo_ticket}
💰 Monto: S/ {precio}

⚠️ *TICKET PENDIENTE DE ACTIVACIÓN*
El ticket está desactivado hasta verificar el comprobante.

#GameZtore #Ticket #{codigo_ticket}');

GO
