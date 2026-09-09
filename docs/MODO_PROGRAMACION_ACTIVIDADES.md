# Sistema de Programación de Actividades

## 📋 Resumen de Cambios

### ✨ Nuevo Sistema Flexible
Ahora **todas las actividades** (Grupal, Personalizada, Sesión) pueden elegir entre:

| Modo | Descripción | Uso |
|------|-------------|-----|
| 🔁 **Recurrente** | Se repite cada semana en días fijos | Clases regulares, terapias continuas |
| 📅 **Específico** | Fechas y horas concretas (una o múltiples) | Sesiones puntuales, eventos especiales |

### 🎯 Beneficio Principal
**Ya no depende del tipo de actividad** si quieres repetir en días fijos o establecer fechas específicas.

---

## Descripción General

Se ha implementado un sistema flexible de programación de actividades que permite definir horarios tanto **recurrentes** como **específicos**, independientemente del tipo de actividad (Grupal, Personalizada o Sesión de Rehabilitación/Masaje).

## Cambios Implementados

### 1. Nuevo Campo: `modoProgramacion`

Cada actividad ahora tiene un campo `modoProgramacion` que puede ser:
- **`recurrente`**: La actividad se repite semanalmente en días fijos con hora fija
- **`especifica`**: La actividad tiene fechas y horas concretas (una o múltiples)

### 2. Estructura de Datos Actualizada

#### Para Actividades Recurrentes (`modoProgramacion: 'recurrente'`)
```javascript
{
  modoProgramacion: 'recurrente',
  diasSemana: ['lunes', 'miercoles', 'viernes'],  // Array de días
  horaInicio: '09:00'                             // Hora fija
}
```

#### Para Actividades Específicas (`modoProgramacion: 'especifica'`)
```javascript
{
  modoProgramacion: 'especifica',
  fechasEspecificas: [                            // Array de objetos
    { fecha: '2025-12-15', hora: '10:00' },
    { fecha: '2025-12-18', hora: '14:30' },
    { fecha: '2025-12-22', hora: '09:00' }
  ]
}
```

## Interfaz de Usuario

### Formulario de Nueva Actividad

1. **Selector de Modo de Programación**
   - Se muestra después de seleccionar el responsable
   - Permite elegir entre "Días recurrentes" o "Fechas y horas específicas"

2. **Modo Recurrente**
   - Muestra un campo para hora de inicio
   - Muestra botones para seleccionar días de la semana
   - Los días seleccionados se resaltan en verde

3. **Modo Específico**
   - Muestra campos para agregar fecha y hora
   - Permite agregar múltiples fechas/horas
   - Lista las fechas programadas con opción de eliminar
   - Valida que haya al menos una fecha/hora antes de guardar

## Validaciones

### Modo Recurrente
- ✅ Se requiere hora de inicio
- ✅ Se requiere al menos un día de la semana seleccionado

### Modo Específico
- ✅ Se requiere al menos una fecha y hora agregada
- ✅ No se puede enviar el formulario si no hay fechas programadas

### Validaciones por Tipo de Actividad
- **Personalizada** y **Sesión**: Requieren un cliente asignado
- **Sesión**: Requiere tipo de sesión seleccionado

## Servicios de Firebase Actualizados

### `createClass` en `classesService.js`

La función ahora:
1. Guarda el campo `modoProgramacion`
2. Solo guarda los campos de horario relevantes según el modo:
   - **Recurrente**: `diasSemana` y `horaInicio`
   - **Específico**: `fechasEspecificas` (array)
3. Mantiene compatibilidad con asignación automática de clientes

### `normalizeClassData` - Función de Migración

Esta función convierte automáticamente actividades del formato antiguo al nuevo:
- Si una actividad tiene `diasSemana`, se marca como `recurrente`
- Si tiene `fechaEspecifica` (singular), se convierte a `fechasEspecificas` array con un elemento
- Se aplica automáticamente en `getClassById` y `getClasses`

```javascript
// Ejemplo de migración automática
// Formato antiguo:
{
  fechaEspecifica: '2025-12-15',
  horaEspecifica: '10:00'
}

// Se convierte automáticamente a:
{
  modoProgramacion: 'especifica',
  fechasEspecificas: [
    { fecha: '2025-12-15', hora: '10:00' }
  ],
  // Mantiene campos antiguos por compatibilidad
  fechaEspecifica: '2025-12-15',
  horaEspecifica: '10:00'
}
```

### `formatSpecificDates` - Helper para UI

Nueva función para formatear fechas específicas:
```javascript
formatSpecificDates(fechasEspecificas)
// Retorna: "15 dic 2025 a las 10:00" (si es una)
// Retorna: "3 fechas programadas" (si son múltiples)
```

## Compatibilidad Hacia Atrás

✅ **Las actividades existentes siguen funcionando**
- Las actividades creadas antes de esta actualización se normalizan automáticamente
- Los campos antiguos (`fechaEspecifica`, `horaEspecifica`) se mantienen
- La conversión es transparente para el usuario

## Casos de Uso

### Ejemplo 1: Clase Grupal Recurrente
```
Tipo: Grupal
Modo: Recurrente
Días: Lunes, Miércoles, Viernes
Hora: 07:00 AM
→ La clase se repite cada semana en esos días a esa hora
```

### Ejemplo 2: Entrenamiento Personalizado con Fechas Específicas
```
Tipo: Personalizado
Modo: Específico
Fechas: 
  - 15/12/2025 a las 10:00
  - 18/12/2025 a las 10:00
  - 22/12/2025 a las 10:00
Cliente: Juan Pérez
→ Son sesiones individuales en fechas concretas
```

### Ejemplo 3: Sesión de Rehabilitación Recurrente
```
Tipo: Sesión de Rehabilitación/Masaje
Modo: Recurrente
Días: Martes, Jueves
Hora: 16:00
Cliente: María González
→ Sesiones de terapia que se repiten semanalmente
```

### Ejemplo 4: Clase Grupal en Fechas Específicas
```
Tipo: Grupal
Modo: Específico
Fechas:
  - 20/12/2025 a las 18:00
  - 27/12/2025 a las 18:00
→ Clases especiales en fechas puntuales (ej: festivos)
```

## Visualización en UI

### Tarjetas de Actividades (ClassCard)

Las tarjetas ahora muestran información diferente según el modo:

**Modo Recurrente:**
```
📅 Lun, Mié, Vie
🕐 09:00 (60 min)
```

**Modo Específico (una fecha):**
```
📅 15 dic a las 10:00
```

**Modo Específico (múltiples fechas):**
```
📅 3 fechas programadas
```

### Página de Detalle de Actividad

**Modo Recurrente:**
- Muestra una tarjeta verde con el título "Horario Recurrente"
- Lista los días de la semana completos (ej: Lunes, Miércoles, Viernes)
- Muestra la hora en grande

**Modo Específico:**
- Muestra una tarjeta azul con el título "Fechas Específicas (N)"
- Lista todas las fechas con su día de la semana, fecha completa y hora
- Scroll si hay muchas fechas
- Formato: "lun, 15 dic 2025 - 10:00 hrs"

## Beneficios

1. **Flexibilidad Total**: Cualquier tipo de actividad puede ser recurrente o específica
2. **Múltiples Fechas**: Se pueden programar varias sesiones específicas a la vez
3. **Mejor UX**: Interfaz clara con feedback visual inmediato
4. **Validación Robusta**: Previene errores de programación

## Archivos Modificados

- `/src/pages/clases/nueva.js` - Formulario de creación de actividades
- `/lib/firebase/classesService.js` - Servicio de Firebase para clases

## Notas Técnicas

- El campo `modoProgramacion` por defecto es `'recurrente'` para mantener compatibilidad
- Las fechas específicas se almacenan en formato ISO (YYYY-MM-DD)
- Las horas se almacenan en formato 24h (HH:MM)
- Se eliminaron los campos obsoletos `fechaEspecifica` y `horaEspecifica` (singular)
