# 📊 Endpoints Actualizados - Formato Expandido

## Cambios Principales Implementados

✅ **Todos los endpoints actualizados para devolver datos en el formato requerido**  
✅ **Ventas expandidas a nivel de item individual (no agrupadas)**  
✅ **Totales calculados correctamente**  
✅ **Campos completos con toda la información necesaria**

---

## 1. GET /api/ventas

**Cambio principal:** Ahora devuelve cada ítem de una venta como una fila individual.

### Ejemplo de uso:
```bash
# Filtrar por tipo de producto
curl -H "x-api-key: science-chago-api-integration-key-2026" \
  "http://localhost:3000/api/ventas?tipoProducto=Cafeteria"

# Filtrar por rango de fechas
curl -H "x-api-key: science-chago-api-integration-key-2026" \
  "http://localhost:3000/api/ventas?startDate=2026-01-01&endDate=2026-01-31"

# Filtrar por cliente específico
curl -H "x-api-key: science-chago-api-integration-key-2026" \
  "http://localhost:3000/api/ventas?clienteId=abc123"
```

### Respuesta:
```json
{
  "success": true,
  "ventas": [
    {
      "id": "venta123_0",
      "ventaId": "venta123",
      "fecha": "2026-01-15",
      "clienteNombre": "Juan Pérez García",
      "clienteId": "cliente_abc",
      "productoNombre": "Café Americano",
      "productoId": "prod_001",
      "tipoProducto": "Cafeteria",
      "cantidad": 2,
      "precioUnitario": 45.00,
      "total": 90.00,
      "estado": "pagado",
      "pagado": true,
      "sucursalId": "suc_001",
      "transactionExternalId": "EXT-2026-001"
    },
    {
      "id": "venta123_1",
      "ventaId": "venta123",
      "fecha": "2026-01-15",
      "clienteNombre": "Juan Pérez García",
      "clienteId": "cliente_abc",
      "productoNombre": "Proteína Whey",
      "productoId": "prod_002",
      "tipoProducto": "Suplementos",
      "cantidad": 1,
      "precioUnitario": 850.00,
      "total": 850.00,
      "estado": "pagado",
      "pagado": true,
      "sucursalId": "suc_001",
      "transactionExternalId": "EXT-2026-001"
    }
  ],
  "totales": {
    "totalVentas": 940.00,
    "cantidadVentas": 2,
    "promedioVenta": 470.00
  },
  "filtros": {
    "startDate": null,
    "endDate": null,
    "clienteId": null,
    "productoId": null,
    "tipoProducto": null,
    "planId": null,
    "tipoPlan": null,
    "sucursalId": null,
    "limit": 1000
  }
}
```

### 💡 Importante:
- **Cada producto vendido es una fila individual**
- Si una venta tiene 3 productos, generará 3 registros
- Todos los campos están completos (fecha, cliente, producto, cantidad, total, estado)
- Perfecto para reportes y análisis por tipo de producto

---

## 2. GET /api/ventas/general

**Cambio principal:** Similar a `/api/ventas` pero sin filtros específicos de producto/cliente.

### Ejemplo de uso:
```bash
curl -H "x-api-key: science-chago-api-integration-key-2026" \
  "http://localhost:3000/api/ventas/general?startDate=2026-01-01&endDate=2026-01-31"
```

### Respuesta:
```json
{
  "success": true,
  "ventas": [
    {
      "id": "venta_item_1",
      "ventaId": "venta001",
      "fecha": "2026-01-15",
      "clienteNombre": "María López Fernández",
      "clienteId": "cliente_xyz",
      "productoNombre": "Matcha Latte",
      "productoId": "prod_003",
      "tipoProducto": "Cafeteria",
      "cantidad": 1,
      "precioUnitario": 65.00,
      "total": 65.00,
      "estado": "pagado",
      "pagado": true,
      "sucursalId": "suc_001"
    }
  ],
  "totales": {
    "totalVentas": 15000.00,
    "cantidadVentas": 120,
    "promedioVenta": 125.00
  },
  "filtros": {
    "startDate": "2026-01-01",
    "endDate": "2026-01-31",
    "sucursalId": null
  }
}
```

---

## 3. GET /api/productos

Ya estaba correcto. Devuelve lista de productos.

### Respuesta:
```json
{
  "success": true,
  "productos": [
    {
      "id": "prod_001",
      "nombre": "Café Americano",
      "descripcion": "Café negro americano 12oz",
      "tipo": "Cafeteria",
      "precio": 45.00,
      "inventarioInicial": 100,
      "inventarioActual": 85,
      "imageUrl": "https://...",
      "sucursalId": "suc_001",
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-15T10:30:00.000Z"
    }
  ],
  "total": 25
}
```

---

## 4. GET /api/productos/tipos

**Cambio principal:** Ahora devuelve array simple de strings (no objetos).

### Respuesta ANTERIOR:
```json
{
  "success": true,
  "tipos": [
    {
      "id": "cafeteria",
      "nombre": "Cafeteria",
      "count": 15
    }
  ]
}
```

### Respuesta NUEVA:
```json
{
  "success": true,
  "tipos": [
    "Cafeteria",
    "Suplementos",
    "Bebidas",
    "Snacks",
    "Merch"
  ]
}
```

---

## 5. GET /api/planes

Ya estaba correcto. Devuelve lista de planes/paquetes.

### Respuesta:
```json
{
  "success": true,
  "planes": [
    {
      "id": "plan_001",
      "nombre": "Membresía Mensual Premium",
      "descripcion": "Acceso ilimitado por 30 días",
      "tipo": "grupal",
      "precio": 1200.00,
      "sesiones": 12,
      "duracion": "30 días",
      "imageUrl": "https://...",
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-10T15:20:00.000Z"
    }
  ],
  "total": 8
}
```

---

## 6. GET /api/planes/tipos

**Cambio principal:** Ahora devuelve array simple de strings (no objetos).

### Respuesta ANTERIOR:
```json
{
  "success": true,
  "tipos": [
    {
      "id": "grupal",
      "nombre": "Clase Grupal",
      "descripcion": "Clases grupales con múltiples participantes"
    }
  ]
}
```

### Respuesta NUEVA:
```json
{
  "success": true,
  "tipos": [
    "Clase Grupal",
    "Entrenamiento Personalizado",
    "Sesión de Rehabilitación/Masaje"
  ]
}
```

---

## 7. GET /api/cuentas-por-cobrar

**Cambio principal:** Ahora devuelve cuentas expandidas por paquete individual.

### Ejemplo de uso:
```bash
# Todas las cuentas por cobrar
curl -H "x-api-key: science-chago-api-integration-key-2026" \
  "http://localhost:3000/api/cuentas-por-cobrar"

# Cuentas de un cliente específico
curl -H "x-api-key: science-chago-api-integration-key-2026" \
  "http://localhost:3000/api/cuentas-por-cobrar?clienteId=abc123"
```

### Respuesta ANTERIOR (Agrupada por cliente):
```json
{
  "success": true,
  "cuentasPorCobrar": [
    {
      "clienteId": "cliente_001",
      "clienteNombre": "Pedro Ramírez",
      "paquetes": [
        {
          "id": "paq_001",
          "nombre": "Plan Mensual",
          "precioTotal": 500.00,
          "montoPagado": 200.00,
          "saldoPendiente": 300.00
        }
      ],
      "totalPendiente": 300.00
    }
  ]
}
```

### Respuesta NUEVA (Expandida por paquete):
```json
{
  "success": true,
  "cuentas": [
    {
      "id": "cliente_001_paq_001",
      "clienteId": "cliente_001",
      "clienteNombre": "Pedro Ramírez González",
      "clienteEmail": "pedro@example.com",
      "paqueteId": "paq_001",
      "paqueteNombre": "Plan Mensual Premium",
      "fechaVenta": "2026-01-10",
      "totalVenta": 500.00,
      "pagado": 200.00,
      "saldo": 300.00,
      "diasVencido": 5,
      "status": "active",
      "tipo": "grupal"
    },
    {
      "id": "cliente_002_paq_005",
      "clienteId": "cliente_002",
      "clienteNombre": "Ana Martínez López",
      "clienteEmail": "ana@example.com",
      "paqueteId": "paq_005",
      "paqueteNombre": "Sesiones Personalizadas",
      "fechaVenta": "2026-01-20",
      "totalVenta": 800.00,
      "pagado": 400.00,
      "saldo": 400.00,
      "diasVencido": 0,
      "status": "active",
      "tipo": "personalizado"
    }
  ],
  "totales": {
    "totalPorCobrar": 1300.00,
    "totalCobrado": 600.00,
    "saldoPendiente": 700.00
  },
  "filtros": {
    "clienteId": null
  }
}
```

---

## 🧪 Cómo Probar los Endpoints

### Opción 1: Usar el API Tester (Recomendado)
1. Asegúrate de que el servidor esté corriendo:
   ```bash
   npm run dev
   ```

2. Abre en tu navegador:
   ```
   http://localhost:3000/api-tester.html
   ```

3. Prueba cada endpoint con diferentes filtros

### Opción 2: Usar curl desde la terminal
```bash
# Ventas por tipo de producto
curl -H "x-api-key: science-chago-api-integration-key-2026" \
  "http://localhost:3000/api/ventas?tipoProducto=Cafeteria" | jq

# Ventas generales del mes
curl -H "x-api-key: science-chago-api-integration-key-2026" \
  "http://localhost:3000/api/ventas/general?startDate=2026-01-01&endDate=2026-01-31" | jq

# Tipos de productos
curl -H "x-api-key: science-chago-api-integration-key-2026" \
  "http://localhost:3000/api/productos/tipos" | jq

# Cuentas por cobrar
curl -H "x-api-key: science-chago-api-integration-key-2026" \
  "http://localhost:3000/api/cuentas-por-cobrar" | jq
```

---

## ✅ Resumen de Cambios

| Endpoint | Cambio Principal |
|----------|------------------|
| `/api/ventas` | ✅ Ventas expandidas a nivel de item + totales (SOLO PRODUCTOS) |
| `/api/ventas/general` | ✅ Ventas expandidas a nivel de item + totales (SOLO PRODUCTOS) |
| `/api/ventas/planes` | ✨ **NUEVO** - Ventas de planes/paquetes (NO productos) |
| `/api/productos` | ✅ Sin cambios (ya estaba correcto) |
| `/api/productos/tipos` | ✅ Array simple de strings |
| `/api/planes` | ✅ Sin cambios (ya estaba correcto) |
| `/api/planes/tipos` | ✅ Array simple de strings |
| `/api/cuentas-por-cobrar` | ✅ Cuentas expandidas por paquete + totales |

---

## ⚠️ IMPORTANTE: Diferencia entre Productos y Planes

### `/api/ventas` - Solo Productos del POS
- **Consulta:** Colección `ventas`
- **Contenido:** Productos de cafetería, merch, suplementos
- **Ejemplo:** Matcha, Agua, Proteína, Café
- **Filtro:** `tipoProducto` (Cafeteria, Suplementos, Merch)

### `/api/ventas/planes` - Solo Planes/Paquetes
- **Consulta:** Subcolecciones `paquetesAsignados`
- **Contenido:** Planes y paquetes asignados a usuarios
- **Ejemplo:** Plan Mensual, Clase Grupal, Entrenamiento Personalizado
- **Filtro:** `tipoPlan` (grupal, personalizado, sesion)

📖 **Ver documentación completa:** [docs/VENTAS_PRODUCTOS_VS_PLANES.md](VENTAS_PRODUCTOS_VS_PLANES.md)

---

## 🎯 Beneficios

1. **Datos completos:** Cada registro tiene TODA la información necesaria (fecha, cliente, producto, cantidad, total, estado)
2. **No más N/A:** Cuando filtras por `tipoProducto`, obtienes ventas individuales con todos sus detalles
3. **Fácil de consumir:** Los datos están en el formato esperado por Science Chago
4. **Totales calculados:** Cada respuesta incluye totales agregados
5. **Listo para reportes:** Perfecto para tablas, gráficos y análisis

---

## 📝 Notas Importantes

- **API Key requerida:** Todos los endpoints requieren el header `x-api-key`
- **Formato de fecha:** Todas las fechas están en formato `YYYY-MM-DD`
- **Ventas expandidas:** Una venta con 3 productos = 3 registros en la respuesta
- **Estado siempre "pagado":** Las ventas del POS son siempre pagadas al momento
- **Límite por defecto:** 1000 registros (ajustable con el parámetro `limit`)
