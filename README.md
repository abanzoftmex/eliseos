Science in Motion - Centro de Rehabilitación:
A-18
Sistema integral para la gestión de un centro de rehabilitación física, desarrollado con Next.js y Firebase.

## 🚀 Características Principales:aa
s
### 📋 Gestión de Pacientes:aa
- **Registro de Clientes**: Sistema completo de registro con datos personales y contactoasaa
- **Consultas Médicas**: Formularios especializados para consultas nosrmales y des aatletasssaaaa
- **Historial Clínico**: Seguimiento completo del progreso del pacienteaa
- **Wizard de Consultas**: Proceso guiadol paso a paso con validaciaones
 
### 👨‍⚕️ Directorio de Personal
- **Gestión de Profesionales**: Registro y administración del personal médicoa
- **Perfiles Completos**: Información detallada de especialidades y contacto
- **Estado del Personal**: Control de personal activo/inactivo

### 📦 Gestión de Paquetes
- **CRUD Completo**: Crear, editar, listar y eliminar paquetes de servicios
- **Sistema de Descuentos**: Configuración flexible de descuentos por paquete
- **Asignación a Usuarios**: Sistema de subcolecciones para asignar paquetes
- **Público Objetivo**: Segmentación entre clientes normales y atletas
- **Tipos de Pago**: Configuración de modalidades de pago

### 🔐 Autenticación y Seguridad
- **Firebase Auth**: Sistema de autenticación seguro
- **Firestore Database**: Base de datos NoSQL escalable
- **Validación de Formularios**: React Hook Form con validaciones robustas

## 🏗️ Arquitectura del Proyecto

```
src/
├── components/           # Componentes reutilizables
│   ├── Dashboard.jsx    # Panel principal de administración
│   ├── packages/        # Componentes específicos de paquetes
│   └── modals/          # Modales para formularios
├── pages/               # Rutas de la aplicación (Pages Router)
│   ├── index.js        # Página de inicio
│   ├── dashboard.js    # Dashboard principal
│   ├── consulta-normal.js    # Formulario de consulta normal
│   ├── consulta-atleta.js    # Formulario de consulta atleta
│   ├── paquetes/       # Módulo de gestión de paquetes
│   │   ├── index.js    # Lista de paquetes
│   │   ├── nuevo.js    # Crear nuevo paquete
│   │   └── editar/[id].js  # Editar paquete existente
│   └── usuarios/       # Gestión de usuarios
│       └── [id].js     # Perfil de usuario
├── styles/
│   └── globals.css     # Estilos globales con Tailwind CSS
└── lib/
    └── firebase/       # Configuración y servicios de Firebase
        ├── firebase.js # Configuración base
        └── packagesService.js  # Servicios de paquetes
```

## 🛠️ Tecnologías Utilizadas

- **Framework**: Next.js 14 (Pages Router)
- **Base de Datos**: Firebase Firestore
- **Autenticación**: Firebase Auth
- **Almacenamiento**: Firebase Storage
- **Estilos**: Tailwind CSS
- **Formularios**: React Hook Form
- **Iconos**: Lucide React
- **Lenguaje**: JavaScript/JSX

## 📦 Estructura de Datos

### Colecciones Principales

#### `clientes`
```javascript
{
  id: string,
  nombre: string,
  apellidoPaterno: string,
  apellidoMaterno: string,
  email: string,
  ocupacion: string,
  telefono: string,
  // ... otros campos
}
```

#### `atletas`
```javascript
{
  id: string,
  nombre: string,
  apellidoPaterno: string,
  apellidoMaterno: string,
  deporte: string,
  categoria: string,
  // ... otros campos específicos
}
```

#### `paquetes`
```javascript
{
  id: string,
  name: string,
  description: string,
  price: number,
  targetAudience: 'clientes' | 'atletas' | 'ambos',
  paymentType: 'unico' | 'mensual' | 'semanal',
  discounts: [
    {
      name: string,
      percentage: number,
      description: string
    }
  ],
  imageUrl: string,
  status: 'active' | 'inactive',
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Subcolecciones de Asignaciones
```
usuarios/{userId}/paquetesAsignados/{assignmentId}
{
  id: string,
  idPaquete: string,
  nombre: string,
  precioOriginal: number,
  descuento: string | null,
  precioFinal: number,
  fechaAsignacion: timestamp,
  status: 'active' | 'inactive'
}
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18 o superior
- npm o yarn
- Cuenta de Firebase

### Configuración

1. **Clonar el repositorio**
```bash
git clone [repository-url]
cd science-in-motion
```

2. **Instalar dependencias**
```bash
npm install
# o
yarn install
```

3. **Configurar Firebase**
- Crear un proyecto en [Firebase Console](https://console.firebase.google.com/)
- Habilitar Firestore Database
- Habilitar Authentication
- Habilitar Storage
- Copiar la configuración del proyecto

4. **Variables de entorno**
Crear archivo `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

5. **Ejecutar en desarrollo**
```bash
npm run dev
# o
yarn dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## 📱 Páginas y Funcionalidades

### Dashboard (`/dashboard`)
- Panel principal con estadísticas
- Navegación entre secciones
- Gestión de directorio de personal
- Lista de clientes registrados

### Gestión de Paquetes (`/paquetes`)
- **Lista de paquetes** (`/paquetes`): Vista general con búsqueda y filtros
- **Crear paquete** (`/paquetes/nuevo`): Formulario de creación con validaciones
- **Editar paquete** (`/paquetes/editar/[id]`): Edición de paquetes existentes

### Consultas Médicas
- **Consulta Normal** (`/consulta-normal`): Formulario de 8 pasos para consultas generales
- **Consulta Atleta** (`/consulta-atleta`): Formulario de 15 pasos especializado para atletas

### Perfiles de Usuario (`/usuarios/[id]`)
- Vista detallada del usuario
- Lista de paquetes asignados
- Asignación y remoción de paquetes
- Estadísticas de usuario

## 🔧 Servicios y Funciones

### `packagesService.js`
- `getAllPackages()`: Obtener todos los paquetes
- `getPackageById(id)`: Obtener paquete específico
- `createPackage(data)`: Crear nuevo paquete
- `updatePackage(id, data)`: Actualizar paquete
- `deletePackage(id)`: Eliminar paquete
- `assignPackageToUser(userId, packageId, discount, fechaAsignacion, sucursalId)`: Asignar paquete a usuario
- `getUserPackages(userId)`: Obtener paquetes de un usuario
- `removePackageFromUser(userId, assignmentId)`: Remover asignación

## 🎨 Diseño y UX

- **Diseño Responsivo**: Optimizado para desktop, tablet y móvil
- **Tema de Colores**: Paleta principal en tonos teal/esmeralda
- **Componentes Reutilizables**: Tarjetas, modales, formularios consistentes
- **Navegación Intuitiva**: Sidebar colapsible con navegación clara
- **Validaciones en Tiempo Real**: Feedback inmediato en formularios

## 📊 Estadísticas y Métricas

- Conteo de pacientes totales
- Pacientes atletas registrados
- Paquetes asignados por usuario
- Valor total de asignaciones
- Estados de actividad

## 🔄 Estados y Validaciones

### Estados de Paquetes
- `active`: Paquete disponible para asignación
- `inactive`: Paquete desactivado

### Estados de Asignaciones
- `active`: Asignación vigente
- `inactive`: Asignación cancelada/expirada

### Validaciones de Formularios
- Campos requeridos marcados con asterisco rojo
- Validación en tiempo real con React Hook Form
- Mensajes de error específicos por campo
- Prevención de envío con datos incompletos

## 🚀 Próximas Mejoras

- [ ] Sistema de notificaciones
- [ ] Reportes y analytics avanzados
- [ ] Integración con calendario
- [ ] Sistema de pagos
- [ ] App móvil con React Native
- [ ] API REST para integraciones externas

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Contacto

Science in Motion - Centro de Rehabilitación
- Email: info@scienceinmotion.com
- Website: [scienceinmotion.com](https://scienceinmotion.com)
