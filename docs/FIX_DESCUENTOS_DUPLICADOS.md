# Fix: Descuentos Duplicados - Selección de Descuentos con el Mismo Nombre

## Problema
Cuando se creaban múltiples descuentos con el mismo nombre pero diferentes porcentajes (ej: "Promoción - 10%" y "Promoción - 5%"), el usuario no podía seleccionar correctamente el descuento deseado al asignar un paquete a un cliente. Esto se debía a que:

1. El `key` del elemento `<option>` usaba solo el `name` del descuento
2. El `value` del `<option>` también usaba solo el `name` del descuento
3. React no podía distinguir entre elementos con el mismo `key`
4. El sistema no podía identificar cuál descuento específico se seleccionó

## Solución Implementada

Se modificó la estructura de los selects de descuentos para usar un objeto JSON completo que incluye tanto el nombre como el porcentaje del descuento:

```jsx
// Antes (problemático)
{selectedPackageData?.discounts?.map((discount) => (
  <option key={discount.name} value={discount.name}>
    {discount.name} - {discount.percentage}% de descuento
  </option>
))}

// Después (corregido)
{selectedPackageData?.discounts?.map((discount, index) => (
  <option key={index} value={JSON.stringify({ name: discount.name, percentage: discount.percentage })}>
    {discount.name} - {discount.percentage}% de descuento
  </option>
))}
```

### Cambios por Archivo

#### 1. `/src/pages/clientes/[id]/paquetes/index.js`
- ✅ Agregado helper `getSelectedDiscountData()` para parsear el JSON del descuento seleccionado
- ✅ Actualizado el select de descuentos para usar índice como `key` y JSON como `value`
- ✅ Modificado `handleAssignPackage` para parsear el descuento y enviar solo el `name`
- ✅ Actualizado el cálculo del precio preview para usar el descuento parseado

#### 2. `/src/components/EditarPaqueteAsignadoModal.jsx`
- ✅ Actualizado el select de descuentos para usar índice como `key` y JSON como `value`
- ✅ Modificado `calculatePreviewPrice()` para parsear el JSON del descuento
- ✅ Agregada lógica de retrocompatibilidad para descuentos antiguos guardados solo con el nombre
- ✅ Actualizada la inicialización del formulario para convertir descuentos antiguos a formato JSON

#### 3. `/src/components/PaquetesDashboard.jsx`
- ✅ Actualizado el select de descuentos para usar índice como `key` y JSON como `value`
- ✅ Modificado `handleAssignPackage` para parsear el JSON del descuento antes de enviarlo
- ✅ Actualizado `handleUpdateAssignment` para parsear el descuento correctamente
- ✅ Mantenida retrocompatibilidad con descuentos antiguos

## Retrocompatibilidad

La solución implementada es **retrocompatible** con descuentos existentes:

- Si un descuento guardado en la base de datos está en formato antiguo (solo el nombre), se manejará correctamente
- Los nuevos descuentos se guardan en el mismo formato en la base de datos (solo el nombre)
- El cambio solo afecta la interfaz de usuario y el manejo temporal del estado

## Casos de Prueba

Para verificar que el fix funciona correctamente, prueba los siguientes escenarios:

1. ✅ Crear un paquete con 2+ descuentos que tengan el mismo nombre pero diferentes porcentajes
2. ✅ Asignar el paquete a un cliente y seleccionar el descuento de 5%
3. ✅ Verificar que el precio final se calcule correctamente con el 5% de descuento
4. ✅ Asignar el mismo paquete a otro cliente seleccionando el descuento de 10%
5. ✅ Verificar que el precio final se calcule correctamente con el 10% de descuento
6. ✅ Editar un paquete ya asignado y cambiar el descuento
7. ✅ Verificar que los paquetes asignados anteriormente sigan funcionando correctamente

## Notas Técnicas

- **Por qué JSON**: Se usa JSON.stringify/parse para mantener la información completa del descuento (nombre y porcentaje) en el estado temporal del componente
- **Por qué índice como key**: Al usar el índice como `key`, React puede distinguir correctamente entre elementos incluso si tienen el mismo nombre
- **Formato en BD**: En la base de datos se sigue guardando solo el nombre del descuento para mantener la estructura existente
- **Performance**: El uso de JSON.stringify/parse es mínimo y solo ocurre durante la selección del usuario, no afecta el rendimiento

## Fecha de Implementación
4 de febrero de 2026
