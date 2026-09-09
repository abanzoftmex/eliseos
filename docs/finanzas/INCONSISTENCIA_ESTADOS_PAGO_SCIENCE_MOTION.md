# 🔴 PROMPT: Corregir Inconsistencia en Estados de Pago - Science Motion

## Problema Detectado

Existe una inconsistencia crítica entre lo que muestra la interfaz de usuario y lo que devuelven las APIs:

### En la UI de Science Motion (`/transacciones/entradas`):
- Cliente: **NEGRO PRUEBA PRUEBA**
- Muestra "Terapia-Sesión Paquete 1" ($1,800) con estado: **"Pendiente"**
- Muestra "Paquete básico" ($9,000) con estado: **"Pendiente"**
- Muestra "Personalizado-Plan 3" ($6,720) con estado: **"Pendiente"**

### En las APIs de Science Motion:

**Endpoint:** `GET /api/ventas/planes`

```json
[
  {
    "id": "JLL1fDwaxh48SuxtavD1",
    "fecha": "2026-01-23",
    "clienteNombre": "NEGRO PRUEBA PRUEBA",
    "clienteId": "59OrxEjScWTuQcsuHf16",
    "productoNombre": "Terapia-Sesión Paquete 1",
    "productoId": "2RmajJ0sjVtRD8pybtEH",
    "tipoProducto": "sesion",
    "cantidad": 1,
    "precioUnitario": 1800,
    "total": 1800,
    "montoPagado": 1800,
    "saldo": 0,
    "estado": "pagado",
    "pagado": true
  },
  {
    "id": "O7ZpE6VcBLxOl9iTEAvU",
    "fecha": "2026-01-23",
    "clienteNombre": "NEGRO PRUEBA PRUEBA",
    "clienteId": "59OrxEjScWTuQcsuHf16",
    "productoNombre": "Personalizado-Plan 3",
    "productoId": "1jqKUIZUKMcvbnrsXUS5",
    "tipoProducto": "personalizado",
    "cantidad": 1,
    "precioUnitario": 6720,
    "total": 6720,
    "montoPagado": 6720,
    "saldo": 0,
    "estado": "pagado",
    "pagado": true
  },
  {
    "id": "kLoySbrIWaREwKjZMK8z",
    "fecha": "2026-01-26",
    "clienteNombre": "NEGRO PRUEBA PRUEBA",
    "clienteId": "59OrxEjScWTuQcsuHf16",
    "productoNombre": "Paquete básico",
    "productoId": "7US9tDOdNDBuI4TpyTsb",
    "tipoProducto": "grupal",
    "cantidad": 1,
    "precioUnitario": 9000,
    "total": 9000,
    "montoPagado": 9000,
    "saldo": 0,
    "estado": "pagado",
    "pagado": true
  }
]
```

**Endpoint:** `GET /api/cuentas-por-cobrar?clienteId=59OrxEjScWTuQcsuHf16`

```json
{
  "success": true,
  "cuentas": [],
  "totales": {
    "totalPorCobrar": 0,
    "totalCobrado": 0,
    "saldoPendiente": 0
  }
}
```

---

## El Problema

Las APIs están diciendo que **TODO está pagado** (`montoPagado` = `total`, `saldo: 0`, `estado: "pagado"`), pero la UI muestra "Pendiente" con el badge rojo.

Esto causa que:
1. ❌ **Science Chago** muestra "Pagado" (porque lee de la API)
2. ❌ **Science Motion UI** muestra "Pendiente" (inconsistencia interna)
3. ❌ **Cuentas por cobrar** regresan vacías porque la API dice que todo está pagado
4. ❌ **Reportes** no coinciden con la realidad del negocio

---

## Causa Raíz Probable

La lógica que calcula `montoPagado`, `saldo` y `estado` en el endpoint `/api/ventas/planes` está incorrecta. Parece estar:

- ✗ Sumando el total del plan como si fuera un pago (asume pagado por defecto)
- ✗ No consultando las transacciones reales de pago
- ✗ No validando si existen pagos confirmados en Firebase/base de datos
- ✗ Asignando `montoPagado = total` automáticamente

---

## Solución Requerida

### 1. Revisar la lógica de cálculo de pagos en `/api/ventas/planes`

El endpoint debe calcular el estado real basándose en transacciones de pago registradas:

```javascript
// Para cada plan asignado
const total = planAsignado.precio * planAsignado.cantidad;

// IMPORTANTE: Buscar pagos REALES en la base de datos
const montoPagado = await calcularTotalPagosRealizados({
  planId: planAsignado.id,
  clienteId: planAsignado.clienteId,
  sucursalId: planAsignado.sucursalId
});

const saldo = total - montoPagado;

// Calcular estado basado en el saldo
let estado;
let pagado;

if (saldo === 0 && total > 0) {
  estado = 'pagado';
  pagado = true;
} else if (montoPagado > 0 && saldo > 0) {
  estado = 'parcial';
  pagado = false;
} else {
  estado = 'pendiente';
  pagado = false;
}

return {
  ...planAsignado,
  total,
  montoPagado,
  saldo,
  estado,
  pagado
};
```

### 2. Función para calcular pagos reales

```javascript
async function calcularTotalPagosRealizados({ planId, clienteId, sucursalId }) {
  // Buscar en la colección de transacciones/pagos
  // Ajustar según tu estructura de Firebase
  
  const pagosRef = db.collection('transacciones')
    .where('tipo', '==', 'ingreso')
    .where('clienteId', '==', clienteId)
    .where('planId', '==', planId);
    
  if (sucursalId) {
    pagosRef = pagosRef.where('sucursalId', '==', sucursalId);
  }
  
  const pagosSnapshot = await pagosRef.get();
  
  // Sumar SOLO los pagos confirmados/completados
  let totalPagado = 0;
  
  pagosSnapshot.forEach(doc => {
    const pago = doc.data();
    // Validar que el pago está confirmado/completado
    if (pago.estado === 'completado' || pago.estado === 'confirmado') {
      totalPagado += pago.monto || 0;
    }
  });
  
  return totalPagado;
}
```

### 3. Validar consistencia con la UI

**CRÍTICO:** La UI de Science Motion en `/transacciones/entradas` también debe usar la misma lógica.

Si actualmente la UI y la API usan diferentes fuentes de datos:
- **UI** lee de `usuarios/{userId}/paquetesAsignados` → muestra "Pendiente"
- **API** lee de la misma colección pero calcula mal → dice "Pagado"

**Solución:** Usar la MISMA función `calcularTotalPagosRealizados()` en:
- El endpoint `/api/ventas/planes`
- La UI de `/transacciones/entradas`
- El endpoint `/api/cuentas-por-cobrar`

### 4. Revisar también `/api/cuentas-por-cobrar`

Debe incluir en las cuentas por cobrar TODOS los planes con `saldo > 0`:

```javascript
async function getCuentasPorCobrar({ clienteId }) {
  // Obtener todos los planes asignados
  const planesAsignados = await obtenerPlanesAsignados({ clienteId });
  
  const cuentas = [];
  
  for (const plan of planesAsignados) {
    const montoPagado = await calcularTotalPagosRealizados({
      planId: plan.id,
      clienteId: plan.clienteId,
      sucursalId: plan.sucursalId
    });
    
    const total = plan.precio;
    const saldo = total - montoPagado;
    
    // Solo incluir si tiene saldo pendiente
    if (saldo > 0) {
      cuentas.push({
        id: plan.id,
        clienteNombre: plan.clienteNombre,
        fechaVenta: plan.fechaAsignacion,
        totalVenta: total,
        pagado: montoPagado,
        saldo: saldo,
        diasVencido: calcularDiasVencido(plan.fechaAsignacion)
      });
    }
  }
  
  return {
    success: true,
    cuentas,
    totales: {
      totalPorCobrar: cuentas.reduce((sum, c) => sum + c.totalVenta, 0),
      totalCobrado: cuentas.reduce((sum, c) => sum + c.pagado, 0),
      saldoPendiente: cuentas.reduce((sum, c) => sum + c.saldo, 0)
    }
  };
}
```

---

## Datos de Prueba

### Cliente de prueba: **NEGRO PRUEBA PRUEBA**
- ID: `59OrxEjScWTuQcsuHf16`
- Sucursal: `QpO3rlTae09Aw3WcqdCM`

### Planes asignados (según UI, deberían estar pendientes):

| Plan | Precio | Estado Real (UI) |
|------|--------|------------------|
| Terapia-Sesión Paquete 1 | $1,800.00 | Pendiente |
| Paquete básico | $9,000.00 | Pendiente |
| Personalizado-Plan 3 | $6,720.00 | Pendiente |
| Grupal - Plan 3 | $1,800.00 | Pendiente |
| Grupal - Plan 3 | $2,000.00 | Pendiente |

**Total deuda esperada:** $17,320.00

---

## Verificación

Después de corregir, ejecutar estos comandos para validar:

### 1. Verificar ventas de planes del cliente
```bash
curl -X GET "http://localhost:3000/api/ventas/planes?clienteId=59OrxEjScWTuQcsuHf16" \
  -H "x-api-key: science-chago-api-integration-key-2026" \
  -H "Content-Type: application/json" | python3 -m json.tool
```

**Resultado esperado:**
```json
{
  "success": true,
  "ventas": [
    {
      "clienteNombre": "NEGRO PRUEBA PRUEBA",
      "productoNombre": "Terapia-Sesión Paquete 1",
      "total": 1800,
      "montoPagado": 0,
      "saldo": 1800,
      "estado": "pendiente",
      "pagado": false
    }
    // ... más planes pendientes
  ]
}
```

### 2. Verificar cuentas por cobrar
```bash
curl -X GET "http://localhost:3000/api/cuentas-por-cobrar?clienteId=59OrxEjScWTuQcsuHf16" \
  -H "x-api-key: science-chago-api-integration-key-2026" \
  -H "Content-Type: application/json" | python3 -m json.tool
```

**Resultado esperado:**
```json
{
  "success": true,
  "cuentas": [
    {
      "clienteNombre": "NEGRO PRUEBA PRUEBA",
      "totalVenta": 1800,
      "pagado": 0,
      "saldo": 1800
    }
    // ... más cuentas
  ],
  "totales": {
    "totalPorCobrar": 17320,
    "totalCobrado": 0,
    "saldoPendiente": 17320
  }
}
```

### 3. Verificar todos los planes
```bash
curl -X GET "http://localhost:3000/api/ventas/planes" \
  -H "x-api-key: science-chago-api-integration-key-2026" \
  -H "Content-Type: application/json" | python3 -m json.tool | head -100
```

---

## Checklist de Corrección

### Backend (APIs)
- [ ] Revisar cómo se calculan los pagos en la función que genera `/api/ventas/planes`
- [ ] Crear función `calcularTotalPagosRealizados()` que consulte transacciones reales
- [ ] Asegurar que `montoPagado` viene de transacciones confirmadas, NO del total del plan
- [ ] Validar que `estado` se calcula como: `saldo === 0 ? 'pagado' : (montoPagado > 0 ? 'parcial' : 'pendiente')`
- [ ] Actualizar `/api/cuentas-por-cobrar` para incluir planes con `saldo > 0`
- [ ] NO asumir que un plan asignado = plan pagado

### Frontend (UI)
- [ ] Verificar que la UI de `/transacciones/entradas` use la misma lógica
- [ ] Confirmar que UI y API muestran el mismo estado (Pendiente/Pagado/Parcial)
- [ ] Validar que los badges de estado son consistentes

### Testing
- [ ] Probar con el cliente NEGRO PRUEBA PRUEBA (ID: `59OrxEjScWTuQcsuHf16`)
- [ ] Confirmar que planes pendientes muestran `estado: "pendiente"`, `saldo > 0`
- [ ] Confirmar que `/api/cuentas-por-cobrar` lista correctamente las deudas
- [ ] Validar que un plan pagado muestra `estado: "pagado"`, `saldo: 0`
- [ ] Validar que un plan parcialmente pagado muestra `estado: "parcial"`, `0 < saldo < total`

### Validación Final
- [ ] UI de Science Motion muestra estados correctos
- [ ] API `/api/ventas/planes` devuelve estados correctos
- [ ] API `/api/cuentas-por-cobrar` lista todas las deudas
- [ ] Science Chago muestra la información correctamente
- [ ] Los reportes coinciden con la realidad del negocio

---

## Notas Adicionales

### Estructura de Datos Esperada

Cada venta de plan debe incluir:

```typescript
interface VentaPlan {
  id: string;
  fecha: string;              // ISO date
  clienteNombre: string;
  clienteId: string;
  productoNombre: string;     // Nombre del plan/paquete
  productoId: string;         // ID del plan/paquete
  tipoProducto: string;       // "grupal", "personalizado", "sesion"
  cantidad: number;
  precioUnitario: number;
  total: number;              // precio * cantidad
  montoPagado: number;        // SUMA de transacciones confirmadas
  saldo: number;              // total - montoPagado
  estado: "pendiente" | "parcial" | "pagado";
  pagado: boolean;            // true solo si saldo === 0
  sucursalId?: string;
  transactionExternalId?: string;
  status: string;
}
```

### Puntos Críticos

1. **NO inventar pagos**: `montoPagado` debe venir de transacciones reales registradas en la base de datos
2. **Estado automático**: Calcular `estado` basado en `saldo`, no guardarlo como campo separado
3. **Consistencia**: UI y APIs deben usar la MISMA lógica de cálculo
4. **Cuentas por cobrar**: Debe incluir TODO lo que tenga `saldo > 0`

---

## Contacto

Si necesitas más información o aclaraciones sobre este problema, contacta al equipo de Science Chago.

**Fecha del reporte:** 28 de enero de 2026
