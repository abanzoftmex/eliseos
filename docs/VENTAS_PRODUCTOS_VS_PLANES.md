# 🔍 Diferencia entre Ventas de Productos y Ventas de Planes

## Problema Identificado

El filtro "Venta por Planes y Paquetes" estaba mostrando productos de cafetería (Matcha, Agua, etc.) en lugar de solo planes/paquetes.

## Causa Raíz

En Science in Motion, **las ventas de productos y las asignaciones de planes se guardan en lugares diferentes**:

### 1. Ventas de Productos (POS)
- **Ubicación:** Colección raíz `ventas`
- **Contenido:** Productos vendidos en el Punto de Venta (Cafetería, Merch, Suplementos)
- **Endpoint:** `/api/ventas`

### 2. Asignaciones de Planes/Paquetes
- **Ubicación:** Subcolecciones `clientes/{userId}/paquetesAsignados` o `atletas/{userId}/paquetesAsignados`
- **Contenido:** Planes y paquetes asignados a usuarios (Clases Grupales, Entrenamientos, Sesiones)
- **Endpoint:** `/api/ventas/planes` ✨ **NUEVO**

---

## Solución Implementada

### Nuevo Endpoint: GET /api/ventas/planes

Este endpoint consulta **ÚNICAMENTE** los paquetes asignados, no las ventas de productos.

#### Ejemplo de uso:

```bash
# Todas las ventas de planes
curl -H "x-api-key: science-chago-api-integration-key-2026" \
  "http://localhost:3000/api/ventas/planes"

# Filtrar por tipo de plan
curl -H "x-api-key: science-chago-api-integration-key-2026" \
  "http://localhost:3000/api/ventas/planes?tipoPlan=grupal"

# Filtrar por rango de fechas
curl -H "x-api-key: science-chago-api-integration-key-2026" \
  "http://localhost:3000/api/ventas/planes?startDate=2026-01-01&endDate=2026-01-31"
```

#### Respuesta:

```json
{
  "success": true,
  "ventas": [
    {
      "id": "paquete_abc123",
      "fecha": "2026-01-15",
      "clienteNombre": "Juan Pérez García",
      "clienteId": "cliente_xyz",
      "productoNombre": "Plan Mensual Premium",
      "productoId": "plan_001",
      "tipoProducto": "grupal",
      "cantidad": 1,
      "precioUnitario": 1200.00,
      "total": 1200.00,
      "montoPagado": 1200.00,
      "saldo": 0.00,
      "estado": "pagado",
      "pagado": true,
      "sucursalId": "suc_001",
      "status": "active"
    },
    {
      "id": "paquete_def456",
      "fecha": "2026-01-20",
      "clienteNombre": "María López Sánchez",
      "clienteId": "atleta_abc",
      "productoNombre": "Entrenamiento Personalizado",
      "productoId": "plan_002",
      "tipoProducto": "personalizado",
      "cantidad": 1,
      "precioUnitario": 2500.00,
      "total": 2500.00,
      "montoPagado": 1000.00,
      "saldo": 1500.00,
      "estado": "parcial",
      "pagado": false,
      "sucursalId": "suc_002",
      "status": "active"
    }
  ],
  "totales": {
    "totalVentas": 3700.00,
    "cantidadVentas": 2,
    "promedioVenta": 1850.00
  },
  "filtros": {
    "startDate": null,
    "endDate": null,
    "clienteId": null,
    "planId": null,
    "tipoPlan": null,
    "sucursalId": null,
    "limit": 1000
  }
}
```

---

## Comparación de Endpoints

| Aspecto | `/api/ventas` | `/api/ventas/planes` |
|---------|---------------|---------------------|
| **Fuente de datos** | Colección `ventas` | Subcolecciones `paquetesAsignados` |
| **Contenido** | Productos del POS (Cafetería, Merch, Suplementos) | Planes y paquetes (Clases, Entrenamientos, Sesiones) |
| **Ejemplo de items** | Matcha, Agua, Proteína, Café | Plan Mensual, Clase Grupal, Sesión de Masaje |
| **Estado de pago** | Siempre "pagado" | Puede ser "pagado", "parcial", o "pendiente" |
| **Campos especiales** | `transactionExternalId` | `montoPagado`, `saldo`, `status` |

---

## Parámetros de Consulta

### Comunes (ambos endpoints)
- `startDate` (YYYY-MM-DD): Fecha inicio
- `endDate` (YYYY-MM-DD): Fecha fin
- `clienteId`: ID del cliente
- `sucursalId`: ID de la sucursal
- `limit`: Límite de resultados (default: 1000)
{
  "clienteNombre": "Juan Pérez",
  "clientePlataforma": "Fitpass",
  "productoNombre": "Paquete básico",
  "total": 2900
}
### Específicos de `/api/ventas` (productos)
- `productoId`: ID del producto específico
- `tipoProducto`: Tipo de producto ("Cafeteria", "Suplementos", "Merch")

### Específicos de `/api/ventas/planes`
- `planId`: ID del plan/paquete específico
- `tipoPlan`: Tipo de plan (**usar valores:** `grupal`, `personalizado`, `sesion`)

**Nota importante sobre `tipoPlan`:**
Los valores válidos son:
- `grupal` = Clase Grupal
- `personalizado` = Entrenamiento Personalizado
- `sesion` = Sesión de Rehabilitación/Masaje

El endpoint acepta tanto el valor de BD (`grupal`) como el nombre completo (`Clase Grupal`) para mayor compatibilidad.

---

## Instrucciones para Science Chago

### ❌ ANTES (Incorrecto)
Si en Science Chago estaban consultando:
```
GET /api/ventas?tipoPlan=grupal
```

Esto devolvería datos vacíos o incorrectos porque los planes NO están en `ventas`.

### ✅ AHORA (Correcto)

Para consultar **ventas de planes/paquetes**, usar:
```
GET /api/ventas/planes
GET /api/ventas/planes?tipoPlan=grupal
GET /api/ventas/planes?startDate=2026-01-01&endDate=2026-01-31
```

Para consultar **ventas de productos**, usar:
```
GET /api/ventas
GET /api/ventas?tipoProducto=Cafeteria
GET /api/ventas?startDate=2026-01-01&endDate=2026-01-31
```

---

## Estados de Pago en Planes

A diferencia de las ventas de productos (que siempre están pagadas), los planes pueden tener 3 estados:

1. **"pagado"**: `montoPagado >= total`
2. **"parcial"**: `montoPagado > 0 && montoPagado < total`
3. **"pendiente"**: `montoPagado === 0`

Campos adicionales en la respuesta:
- `montoPagado`: Cantidad pagada hasta el momento
- `saldo`: Cantidad pendiente de pagar
- `pagado`: Boolean (true si está completamente pagado)

---

## Tipos de Planes Disponibles

Los tipos de planes en la base de datos usan valores cortos:

| Valor en BD | Nombre Completo | Descripción |
|-------------|-----------------|-------------|
| `grupal` | Clase Grupal | Clases grupales con múltiples participantes |
| `personalizado` | Entrenamiento Personalizado | Sesiones individuales personalizadas |
| `sesion` | Sesión de Rehabilitación/Masaje | Sesiones especializadas |

**Para consultar por tipo:**
```bash
# Usar el valor de BD (recomendado)
GET /api/ventas/planes?tipoPlan=grupal
GET /api/ventas/planes?tipoPlan=personalizado
GET /api/ventas/planes?tipoPlan=sesion

# También funciona con el nombre completo
GET /api/ventas/planes?tipoPlan=Clase Grupal
```

**Obtener lista de tipos:**
```bash
GET /api/planes/tipos
# Devuelve: ["grupal", "personalizado", "sesion"]
```

---

## Resumen

✅ **Nuevo endpoint creado:** `/api/ventas/planes`  
✅ **Consulta solo paquetes asignados** (no productos)  
✅ **Formato consistente** con `/api/ventas`  
✅ **Filtros específicos** para planes  
✅ **Estados de pago** incluidos  

**El error NO está en el sistema Science in Motion**, sino en cómo Science Chago estaba consultando los datos. Ahora tienen el endpoint correcto para cada tipo de consulta.
