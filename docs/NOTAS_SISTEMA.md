# Sistema de Notas para Clientes

## 📋 Descripción
Sistema de notas (mensajes) integrado en las tarjetas de clientes que permite agregar, editar, eliminar y visualizar notas históricas de cada cliente mediante un sidepanel deslizante.

## 🎯 Características Implementadas

### 1. **Botón de Notas en Cards**
- ✅ Botón nuevo con icono de mensaje (MessageSquare)
- ✅ Color ámbar/naranja para distinguirse de otros botones
- ✅ Tooltip informativo "Notas del Cliente"
- ✅ Disponible en vista Grid y Tabla

### 2. **Sidepanel Deslizante**
- ✅ Se abre desde el lado derecho de la pantalla
- ✅ Animación suave de deslizamiento
- ✅ Overlay con blur en el fondo
- ✅ Responsive: ancho completo en móvil, 500px en desktop
- ✅ Header con información del cliente

### 3. **Gestión de Notas**
- ✅ **Crear**: Formulario en la parte inferior del panel
- ✅ **Listar**: Historial ordenado por fecha (más reciente primero)
- ✅ **Editar**: Botón de edición inline con textarea
- ✅ **Eliminar**: Confirmación antes de eliminar
- ✅ **Timestamps**: Formato relativo ("Hace 5 min", "Hace 2h", etc.)

### 4. **Integración con Firebase**
- ✅ Colección: `notas`
- ✅ Campos almacenados:
  - `clienteId`: ID del cliente
  - `clienteNombre`: Nombre completo del cliente
  - `contenido`: Texto de la nota
  - `autor`: Usuario que creó la nota (TODO: integrar con auth)
  - `createdAt`: Timestamp de creación
  - `updatedAt`: Timestamp de última actualización

## 🗄️ Estructura de Datos

```javascript
// Colección: notas
{
  id: "auto-generated",
  clienteId: "cliente_123",
  clienteNombre: "Juan Pérez",
  contenido: "Texto de la nota...",
  autor: "Sistema", // TODO: Reemplazar con usuario actual
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 📊 Índices Requeridos en Firestore

Para que las consultas funcionen correctamente, necesitas crear el siguiente índice compuesto en Firebase Console:

1. Ve a: **Firebase Console → Firestore Database → Indexes**
2. Crea un índice con:
   - **Colección**: `notas`
   - **Campos a indexar**:
     - `clienteId` (Ascending)
     - `createdAt` (Descending)
   - **Estado de consulta**: Collection

O usa este enlace directo cuando aparezca el error en la consola del navegador.

## 🎨 Diseño y UX

### Colores
- **Botón**: Gradiente ámbar (from-amber-400 to-amber-500)
- **Header del panel**: Gradiente cyan (consistente con el diseño)
- **Notas**: Fondo gris claro con borde

### Iconos
- **MessageSquare**: Botón principal y header
- **Send**: Enviar nueva nota
- **Edit2**: Editar nota existente
- **Trash2**: Eliminar nota
- **Check**: Guardar edición
- **X**: Cancelar/Cerrar
- **Clock**: Timestamp en cada nota

### Estados de Carga
- ✅ Skeleton mientras carga las notas
- ✅ Estado vacío con mensaje amigable
- ✅ Loading spinner al enviar
- ✅ Deshabilitar botón mientras se procesa

## 🚀 Uso

```jsx
// En ClientesContent.jsx
const [isNotasPanelOpen, setIsNotasPanelOpen] = useState(false);
const [clienteForNotas, setClienteForNotas] = useState(null);

const handleOpenNotas = (cliente) => {
  setClienteForNotas(cliente);
  setIsNotasPanelOpen(true);
};

// En el JSX
<NotasSidePanel
  isOpen={isNotasPanelOpen}
  onClose={handleCloseNotas}
  cliente={clienteForNotas}
/>
```

## 📝 TODOs Futuros

- [ ] Integrar con sistema de autenticación para capturar el autor real
- [ ] Agregar filtros por fecha o búsqueda de texto
- [ ] Permitir adjuntar archivos a las notas
- [ ] Agregar notificaciones cuando se crean notas importantes
- [ ] Implementar etiquetas o categorías para las notas
- [ ] Agregar paginación si hay muchas notas
- [ ] Permitir marcar notas como importantes/urgentes
- [ ] Historial de cambios en notas editadas

## 🔧 Archivos Modificados

1. **Nuevo**: `/src/components/NotasSidePanel.jsx`
   - Componente principal del sidepanel
   - Gestión completa de CRUD de notas

2. **Modificado**: `/src/components/dashboard/ClientesContent.jsx`
   - Agregado botón de notas en grid de cards
   - Agregado botón de notas en tabla
   - Importado y renderizado NotasSidePanel
   - Funciones handleOpenNotas y handleCloseNotas

## ⚠️ Consideraciones

1. **Permisos de Firestore**: Asegúrate de que las reglas de seguridad permitan:
   - Leer notas donde `clienteId == userId` (o según tu lógica de permisos)
   - Crear/Actualizar/Eliminar notas con validación de usuario autenticado

2. **Performance**: 
   - Las notas se cargan solo cuando se abre el panel
   - Usar limit() si hay muchas notas por cliente

3. **Seguridad**:
   - Validar que solo usuarios autorizados puedan ver/editar notas
   - Implementar auditoría de quién modifica qué

## 🎉 Resultado Final

El sistema de notas está completamente funcional y listo para usar. Los usuarios pueden:
- Ver todas las notas históricas de un cliente
- Agregar nuevas notas rápidamente
- Editar notas existentes
- Eliminar notas con confirmación
- Ver timestamps relativos para mejor contexto
