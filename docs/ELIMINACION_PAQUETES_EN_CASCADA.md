# Eliminación de Paquetes en Cascada

## Resumen
Se ha implementado la funcionalidad de eliminación en cascada para paquetes. Ahora, al eliminar un paquete, automáticamente se elimina de todos los usuarios (clientes y atletas) que lo tengan asignado, y se muestra un listado detallado de los usuarios afectados.

## Cambios Implementados

### 1. `lib/firebase/packagesService.js`

#### Función `deletePackage` actualizada
La función ahora realiza las siguientes operaciones:

1. **Buscar asignaciones**: Utiliza `collectionGroup` para buscar todas las asignaciones del paquete en las subcolecciones `paquetesAsignados` de todos los usuarios.

2. **Recopilar información**: Por cada asignación encontrada, guarda:
   - ID del usuario
   - Colección del usuario (clientes o atletas)
   - ID de la asignación
   - Nombre del paquete
   - Sesiones restantes
   - Estado de la asignación

3. **Eliminar asignaciones**: Elimina todas las asignaciones encontradas en paralelo usando `Promise.all()`.

4. **Soft delete del paquete**: Marca el paquete como inactivo (no lo elimina físicamente).

5. **Retornar información**: Devuelve la lista de usuarios afectados y un mensaje descriptivo.

```javascript
return { 
  success: true, 
  affectedUsers,
  message: affectedUsers.length > 0 
    ? `Paquete eliminado. ${affectedUsers.length} usuario(s) afectado(s)`
    : 'Paquete eliminado sin asignaciones activas'
};
```

### 2. `src/pages/paquetes/index.js`

#### Nuevo estado para el modal
```javascript
const [affectedUsersModal, setAffectedUsersModal] = useState({ open: false, users: [] });
```

#### Función `handleDeletePackage` mejorada
- Ahora procesa la respuesta con `affectedUsers`
- Abre el modal si hay usuarios afectados
- Recarga los conteos de asignaciones después de eliminar

#### Modal de Usuarios Afectados
Se agregó un modal completo que muestra:
- **Header**: Título y descripción del proceso
- **Lista de usuarios**: Cada usuario con:
  - ID del usuario
  - Badge de tipo (Cliente/Atleta)
  - Badge de estado (activo/inactivo)
  - Nombre del paquete
  - Sesiones restantes
- **Resumen**: Total de usuarios afectados
- **Botón de confirmación**: Para cerrar el modal

#### Mensajes de confirmación mejorados
Los diálogos de confirmación ahora muestran:
- Si hay usuarios asignados, cuántos son
- Advertencia sobre la eliminación en cascada
- Nota de que la acción no se puede deshacer

```javascript
const confirmMessage = usersCount > 0
  ? `¿Estás seguro de eliminar el paquete "${pkg.name}"?\n\nEste paquete está asignado a ${usersCount} usuario(s) y será removido de todos ellos.\n\nEsta acción no se puede deshacer.`
  : `¿Estás seguro de eliminar el paquete "${pkg.name}"?\n\nEsta acción no se puede deshacer.`;
```

### 3. `src/components/packages/PackageCard.jsx`

#### Función `handleDelete` mejorada
Similar a los cambios en la página principal, ahora muestra información sobre usuarios asignados en el mensaje de confirmación.

## Flujo de Usuario

1. **Usuario hace clic en eliminar**: Se muestra un diálogo de confirmación con:
   - Nombre del paquete
   - Cantidad de usuarios asignados (si aplica)
   - Advertencia sobre eliminación en cascada
   
2. **Usuario confirma**: 
   - Se inicia la eliminación (spinner en el botón)
   - Se buscan todas las asignaciones del paquete
   - Se eliminan todas las asignaciones encontradas
   - Se marca el paquete como inactivo
   
3. **Proceso completado**:
   - Si había usuarios asignados: Se abre el modal con la lista detallada
   - Si no había usuarios: Mensaje simple de éxito
   - Se actualiza la lista de paquetes
   - Se recalculan los conteos de asignaciones

## Estructura de Datos

### Usuario Afectado
```javascript
{
  userId: string,           // ID del usuario
  userCollection: string,   // 'clientes' o 'atletas'
  assignmentId: string,     // ID de la asignación eliminada
  packageName: string,      // Nombre del paquete
  sesionesRestantes: number, // Sesiones que quedaban
  status: string           // Estado de la asignación
}
```

## Consideraciones Técnicas

### Performance
- Las eliminaciones se realizan en paralelo usando `Promise.all()` para mejor rendimiento
- Se utiliza `collectionGroup` para buscar en todas las subcolecciones eficientemente

### Seguridad
- Soft delete: El paquete no se elimina físicamente, solo se marca como inactivo
- Todas las asignaciones se eliminan físicamente para mantener la integridad

### UX
- Confirmaciones claras y descriptivas
- Feedback visual con spinners
- Modal informativo con detalles completos
- Mensajes de éxito/error apropiados

## Ejemplo de Uso

```javascript
// Al llamar a deletePackage
const result = await deletePackage('paquete-123');

if (result.success) {
  console.log(result.message); // "Paquete eliminado. 5 usuario(s) afectado(s)"
  console.log(result.affectedUsers); 
  /* [
    {
      userId: "user-1",
      userCollection: "clientes",
      packageName: "Paquete Premium",
      sesionesRestantes: 8,
      status: "active"
    },
    ...
  ] */
}
```

## Próximas Mejoras Potenciales

1. **Notificaciones por email**: Enviar correo a usuarios afectados
2. **Log de auditoría**: Registrar las eliminaciones para auditoría
3. **Restauración**: Opción de deshacer la eliminación (restore)
4. **Exportar lista**: Permitir exportar la lista de usuarios afectados a CSV/Excel
5. **Confirmación de segundo nivel**: Para paquetes con muchos usuarios asignados

## Testing

### Casos de prueba
1. ✅ Eliminar paquete sin asignaciones
2. ✅ Eliminar paquete con 1 usuario asignado
3. ✅ Eliminar paquete con múltiples usuarios asignados
4. ✅ Verificar que las asignaciones se eliminan correctamente
5. ✅ Verificar que el modal muestra la información correcta
6. ✅ Verificar que los conteos se actualizan después de eliminar

## Fecha de Implementación
27 de octubre de 2025
