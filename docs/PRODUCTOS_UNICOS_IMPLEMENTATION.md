# Módulo de Productos Únicos - Documentación

## Descripción General

Se ha implementado un nuevo módulo completo para gestionar "Productos Únicos" en el sistema Science in Motion. Este módulo permite crear, gestionar y asignar productos con cargo único y sin sesiones a clientes y atletas.

## Características Principales

### 1. Gestión de Productos
- **Crear productos**: Nombre, precio, descripción e imagen
- **Editar productos**: Actualizar información de productos existentes
- **Eliminar productos**: Con eliminación en cascada de asignaciones
- **Listado de productos**: Vista en grid o tabla
- **Búsqueda y filtrado**: Buscar productos por nombre o descripción

### 2. Asignación a Clientes/Atletas
- Asignar productos únicos a clientes o atletas
- Ver productos asignados en vista grid o tabla
- Remover productos asignados
- Historial de asignaciones

### 3. Características del Sistema
- **Cargo único**: Los productos no tienen sesiones
- **Sin descuentos**: A diferencia de los paquetes, los productos tienen precio fijo
- **Gestión de imágenes**: Subida y almacenamiento en Firebase Storage
- **Permisos por rol**: Admin y médicos tienen acceso completo

## Estructura de Archivos

### Servicios Firebase
```
lib/firebase/productosService.js
```
Contiene todas las funciones para:
- CRUD de productos
- Gestión de asignaciones
- Subida de imágenes
- Conteo de asignaciones

### Páginas Principales
```
src/pages/productos/
├── index.js                    # Listado de productos
├── nuevo.js                    # Crear nuevo producto
└── editar/[id].js             # Editar producto existente
```

### Páginas de Cliente
```
src/pages/clientes/[id]/productos/
└── index.js                    # Gestión de productos del cliente
```

### API Routes
```
src/pages/api/clientes/[id]/
└── productos.js                # Endpoint para obtener productos del cliente
```

## Modelo de Datos

### Colección: `productos`
```javascript
{
  id: string,
  name: string,
  description: string (opcional),
  price: number,
  imageUrl: string (opcional),
  isActive: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Subcolección: `clientes/{userId}/productosAsignados`
```javascript
{
  id: string,
  idProducto: string,
  nombre: string,
  precio: number,
  descripcion: string,
  imageUrl: string,
  status: string ('activo' | 'inactivo'),
  fechaAsignacion: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Funciones Principales

### Productos
- `createProducto(productoData)`: Crear nuevo producto
- `getProductos()`: Obtener todos los productos
- `getProductoById(productoId)`: Obtener producto por ID
- `updateProducto(productoId, updateData)`: Actualizar producto
- `deleteProducto(productoId)`: Eliminar producto y sus asignaciones
- `uploadProductoImage(file, productoId)`: Subir imagen del producto
- `getProductoAssignmentCounts()`: Obtener conteo de asignaciones

### Asignaciones
- `assignProductoToUser(userId, userType, productoData)`: Asignar producto a usuario
- `getUserProductos(userId, userType)`: Obtener productos del usuario
- `updateAssignedProducto(userId, userType, assignmentId, updateData)`: Actualizar producto asignado
- `deleteAssignedProducto(userId, userType, assignmentId)`: Eliminar producto asignado

## Navegación y Permisos

### Sidebar
Se agregó un nuevo ítem en el menú lateral:
- **Nombre**: "Productos Únicos"
- **Icono**: faShoppingBag
- **Ruta**: `/productos`
- **Permiso**: `productos`

### Permisos por Rol
- **Admin**: Acceso completo (crear, editar, eliminar, asignar)
- **Médico**: Acceso completo (crear, editar, eliminar, asignar)
- **Asistente**: Ver y asignar productos
- **Invitado**: Sin acceso

### Breadcrumbs
Todas las páginas incluyen breadcrumbs para navegación:
- Dashboard > Productos Únicos
- Dashboard > Productos Únicos > Crear Producto
- Dashboard > Productos Únicos > Editar Producto
- Dashboard > Pacientes/Atletas > {Nombre} > Productos

## Integración con Clientes

### Botón de Acceso Rápido
En la página de detalle del cliente (`/clientes/[id]`), se agregó un botón en la sección de "Acciones Rápidas":
- **Título**: "Productos Únicos"
- **Descripción**: "Gestionar productos con cargo único"
- **Color**: Púrpura (bg-purple-100)

### Página de Productos del Cliente
Ruta: `/clientes/[id]/productos`

Características:
- Vista grid y tabla
- Asignar nuevos productos
- Ver productos asignados
- Remover productos
- Información detallada de cada producto

## Diferencias con Paquetes/Planes

| Característica | Paquetes/Planes | Productos Únicos |
|----------------|-----------------|------------------|
| Sesiones | ✅ Sí | ❌ No |
| Descuentos | ✅ Sí | ❌ No |
| Tipo de pago | Múltiples opciones | Cargo único |
| Público objetivo | Clientes/Atletas/Ambos | Todos |
| Tipo de paquete | Grupal/Personalizado/Sesión | N/A |

## Estilos y Diseño

### Colores Distintivos
- **Primary**: Púrpura (#9333EA - purple-600)
- **Gradientes**: from-purple-50 to-purple-100
- **Hover**: purple-700
- **Borders**: purple-200

### Iconos
- **Principal**: faShoppingBag
- **Moneda**: CurrencyDollarIcon (Heroicons)
- **Usuarios**: faUsersIcon

## Endpoints API

### GET `/api/clientes/[id]/productos`
Obtiene todos los productos asignados a un cliente/atleta.

**Response:**
```javascript
{
  success: boolean,
  productos: Array<ProductoAsignado>
}
```

## Notas de Implementación

1. **Eliminación en Cascada**: Al eliminar un producto, se eliminan automáticamente todas sus asignaciones
2. **Serialización de Timestamps**: Los timestamps de Firestore se convierten a ISO strings en las API routes
3. **Validación de Permisos**: Todas las páginas requieren autenticación y roles específicos
4. **Gestión de Imágenes**: Las imágenes se almacenan en Firebase Storage en la carpeta `productos/{productoId}/`

## Próximas Mejoras Sugeridas

1. Agregar campo de categorías para productos
2. Implementar sistema de inventario
3. Agregar historial de compras/pagos
4. Generar reportes de productos más vendidos
5. Integrar con sistema de facturación
6. Agregar productos relacionados o recomendados

## Testing

Para probar el módulo:

1. **Crear Producto**:
   - Ir a `/productos`
   - Click en "Nuevo producto"
   - Llenar formulario y guardar

2. **Asignar a Cliente**:
   - Ir a `/clientes/[id]`
   - Click en "Productos Únicos"
   - Click en "Asignar producto"
   - Seleccionar producto y confirmar

3. **Verificar Eliminación en Cascada**:
   - Asignar producto a varios clientes
   - Eliminar el producto
   - Verificar que se eliminó de todos los clientes

## Soporte

Para cualquier duda o problema con el módulo de Productos Únicos, contactar al equipo de desarrollo.

---

**Fecha de Implementación**: Diciembre 10, 2025
**Versión**: 1.0.0
