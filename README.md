# 🎟️ App Web Premios - Sistema de Sorteos GameZtore

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📋 Descripción

**App Web Premios** es una plataforma completa para la gestión de sorteos y premios desarrollada para GameZtore. El sistema permite a los usuarios registrarse en sorteos mediante pagos por Yape, consultar sus tickets y participar en sorteos de manera segura y transparente.

### ✨ Características Principales

- 🎯 **Sistema de Sorteos**: Gestión completa de sorteos con fechas, premios y configuraciones
- 🎟️ **Gestión de Tickets**: Registro, búsqueda y visualización de tickets de participación
- 💳 **Integración con Yape**: Procesamiento de pagos mediante códigos QR de Yape
- 🔍 **Búsqueda Avanzada**: Consulta de tickets por DNI/CE o código de ticket
- 📱 **Diseño Responsive**: Interfaz optimizada para desktop y móviles
- 🏆 **Panel de Ganadores**: Visualización de resultados y ganadores
- 📊 **Dashboard Administrativo**: Panel de control para gestión de sorteos
- 🔐 **Validación Robusta**: Soporte para DNI peruano y carnet de extranjería

## 🏗️ Arquitectura del Proyecto

```
app-webpremios/
├── 📁 frontend/          # Aplicación React con Vite
│   ├── 📁 src/
│   │   ├── 📁 components/    # Componentes reutilizables
│   │   ├── 📁 pages/         # Páginas principales
│   │   ├── 📁 hooks/         # Custom hooks (useFetch, etc.)
│   │   ├── 📁 context/       # Context providers (Loading, etc.)
│   │   ├── 📁 styles/        # Archivos CSS
│   │   ├── 📁 data/          # Datos estáticos (departamentos)
│   │   └── 📁 assets/        # Imágenes e iconos
│   └── 📁 public/        # Archivos públicos
│
├── 📁 backend/           # API REST con Node.js
│   ├── 📁 config/        # Configuración de base de datos
│   ├── 📁 controllers/   # Lógica de negocio
│   ├── 📁 routes/        # Definición de rutas API
│   ├── 📁 models/        # Modelos de datos
│   └── 📁 scripts/       # Scripts de base de datos
│
└── 📄 README.md         # Este archivo
```

## 🚀 Tecnologías Utilizadas

### Frontend
- **React 18**: Biblioteca de JavaScript para interfaces de usuario
- **Vite**: Herramienta de build ultrarrápida
- **CSS3**: Estilos custom con diseño responsive
- **Fetch API**: Comunicación con el backend

### Backend
- **Node.js**: Entorno de ejecución de JavaScript
- **Express.js**: Framework web para Node.js
- **SQL Server**: Base de datos relacional
- **mssql**: Driver para SQL Server

### Herramientas de Desarrollo
- **ESLint**: Linter para JavaScript
- **Git**: Control de versiones
- **npm**: Gestor de paquetes

## 📦 Instalación y Configuración

### Prerrequisitos

Asegúrate de tener instalado:
- **Node.js** (versión 16 o superior)
- **npm** (incluido con Node.js)
- **SQL Server** (local o remoto)
- **Git** para clonar el repositorio

### 1. Clonar el Repositorio

```bash
git clone https://github.com/anapse/app-webpremios.git
cd app-webpremios
```

### 2. Configuración del Backend

```bash
# Navegar al directorio del backend
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones de base de datos
```

#### Variables de Entorno (.env)
```env
# Base de datos SQL Server
DB_SERVER=localhost
DB_DATABASE=webpremios
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_PORT=1433

# Puerto del servidor
PORT=5000

# Configuración de CORS
CORS_ORIGIN=http://localhost:5173
```

### 3. Configuración de la Base de Datos

```bash
# Ejecutar scripts de creación de tablas
# Los scripts están en backend/scripts/
```

### 4. Configuración del Frontend

```bash
# Navegar al directorio del frontend
cd ../frontend

# Instalar dependencias
npm install

# Configurar la URL del API
# Editar src/apiRoutes.js si es necesario
```

## 🎮 Uso del Sistema

### Iniciar el Desarrollo

#### Backend (Puerto 5000)
```bash
cd backend
npm start
# o para desarrollo con nodemon:
npm run dev
```

#### Frontend (Puerto 5173)
```bash
cd frontend
npm run dev
```

### Acceder a la Aplicación

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Documentación API**: http://localhost:5000/api-docs (si está configurada)

## 🎯 Funcionalidades del Sistema

### Para Usuarios

1. **Registro en Sorteos**
   - Formulario con validación de datos
   - Soporte para DNI peruano y carnet de extranjería
   - Selección de departamento
   - Carga de comprobante de pago Yape

2. **Consulta de Tickets**
   - Búsqueda por DNI/CE
   - Búsqueda por código de ticket
   - Visualización en formato: Código | Nombre | Fecha

3. **Información del Sorteo**
   - Detalles del sorteo actual
   - Premios disponibles
   - Fecha y hora del sorteo

### Para Administradores

1. **Dashboard de Control**
   - Gestión de sorteos
   - Configuración de premios
   - Estadísticas de participación

2. **Gestión de Tickets**
   - Listado completo de tickets
   - Validación de pagos
   - Generación de códigos únicos

## 🔧 Scripts Disponibles

### Frontend
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Compilar para producción
npm run preview      # Vista previa de la compilación
npm run lint         # Ejecutar ESLint
```

### Backend
```bash
npm start            # Iniciar servidor de producción
npm run dev          # Iniciar con nodemon (desarrollo)
npm test             # Ejecutar pruebas (si están configuradas)
```

## 📚 API Endpoints

### Tickets
- `GET /api/tickets` - Obtener todos los tickets
- `POST /api/tickets` - Crear nuevo ticket
- `GET /api/tickets/dni/:dni` - Buscar tickets por DNI/CE
- `GET /api/tickets/codigo/:codigo` - Buscar ticket por código

### Ganadores
- `GET /api/ganadores` - Obtener ganadores
- `POST /api/ganadores` - Registrar ganador

### Usuarios
- `POST /api/users/register` - Registrar usuario en sorteo

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

### Convenciones de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva funcionalidad
- `fix:` Corrección de errores
- `docs:` Cambios en documentación
- `style:` Cambios de formato (sin afectar funcionalidad)
- `refactor:` Refactorización de código
- `test:` Agregar o modificar pruebas
- `chore:` Tareas de mantenimiento

## 🐛 Solución de Problemas

### Problemas Comunes

1. **Error de conexión a base de datos**
   - Verificar configuración en `.env`
   - Comprobar que SQL Server esté ejecutándose

2. **Puerto en uso**
   - Cambiar el puerto en las variables de entorno
   - Verificar que no haya otras aplicaciones usando los puertos

3. **Errores de CORS**
   - Verificar la configuración de `CORS_ORIGIN` en el backend

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Equipo de Desarrollo

- **Desarrollador Principal**: [Tu Nombre]
- **Empresa**: GameZtore
- **Contacto**: [tu-email@ejemplo.com]

## 🔮 Roadmap

### Próximas Funcionalidades

- [ ] Notificaciones en tiempo real
- [ ] Integración con más métodos de pago
- [ ] Sistema de referidos
- [ ] App móvil nativa
- [ ] Analytics avanzados
- [ ] Sistema de cupones y descuentos

---

⭐ Si este proyecto te resulta útil, ¡no olvides darle una estrella en GitHub!

**Desarrollado con ❤️ para GameZtore**
