# 📚 API Endpoints para Integración con Science Chago

## 🔐 Autenticación

Todos los endpoints requieren el header de autenticación:

```
x-api-key: science-chago-api-integration-key-2026
```

**Base URL:** `https://tu-dominio.com` o `http://localhost:3000` (desarrollo)

---

## 📦 Endpoints Disponibles

### 1. GET `/api/productos`

Lista todos los productos disponibles.

**Request:**
```bash
curl -X GET "http://localhost:3000/api/productos" \
  -H "x-api-key: science-chago-api-integration-key-2026"
```

**Response:**
```json
{
  "success": true,
  "productos": [
    {
      "id": "prod_123",
      "nombre": "Proteína Whey",
      "descripcion": "Proteína de suero de leche",
      "tipo": "Suplementos",
      "precio": 850,
      "inventarioInicial": 50,
      "inventarioActual": 35,
      "imageUrl": "https://...",
      "sucursalId": "suc_001",
      "isActive": true,
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-01-25T15:30:00.000Z"
    }
  ],
  "total": 25
}
```

---

### 2. GET `/api/productos/tipos`

Obtiene catálogo de tipos de productos únicos.

**Request:**
```bash
curl -X GET "http://localhost:3000/api/productos/tipos" \
  -H "x-api-key: science-chago-api-integration-key-2026"
```

**Response:**
```json
{
  "success": true,
  "tipos": [
    {
      "id": "cafeteria",
      "nombre": "Cafetería",
      "count": 12
    },
    {
      "id": "merchandising",
      "nombre": "Merchandising",
      "count": 8
    },
    {
      "id": "suplementos",
      "nombre": "Suplementos",
      "count": 15
    }
  ],
  "total": 3
}
```

---

### 3. GET `/api/planes`

Lista todos los planes/paquetes disponibles.

**Request:**
```bash
curl -X GET "http://localhost:3000/api/planes" \
  -H "x-api-key: science-chago-api-integration-key-2026"
```

**Response:**
```json
{
  "success": true,
  "planes": [
    {
      "id": "plan_001",
      "nombre": "Paquete Grupal Mensual",
      "descripcion": "12 clases grupales al mes",
      "tipo": "grupal",
      "precio": 1200,
      "sesiones": 12,
      "duracion": "30 días",
      "imageUrl": "https://...",
      "isActive": true,
      "createdAt": "2026-01-10T08:00:00.000Z",
      "updatedAt": "2026-01-20T12:00:00.000Z"
    }
  ],
  "total": 8
}
```

---

### 4. GET `/api/planes/tipos`

Obtiene catálogo de tipos de planes.

**Request:**
```bash
curl -X GET "http://localhost:3000/api/planes/tipos" \
  -H "x-api-key: science-chago-api-integration-key-2026"
```

**Response:**
```json
{
  "success": true,
  "tipos": [
    {
      "id": "grupal",
      "nombre": "Clase Grupal",
      "descripcion": "Clases grupales con múltiples participantes"
    },
    {
      "id": "personalizado",
      "nombre": "Entrenamiento Personalizado",
      "descripcion": "Sesiones individuales personalizadas"
    },
    {
      "id": "sesion",
      "nombre": "Sesión de Rehabilitación/Masaje",
      "descripcion": "Sesiones especializadas de rehabilitación o masaje"
    }
  ],
  "total": 3
}
```

---

### 5. GET `/api/ventas/general`

Resumen general de ventas con análisis.

**Query Params:**
- `startDate` (opcional): Fecha inicio YYYY-MM-DD
- `endDate` (opcional): Fecha fin YYYY-MM-DD
- `sucursalId` (opcional): ID de la sucursal

**Request:**
```bash
curl -X GET "http://localhost:3000/api/ventas/general?startDate=2026-01-01&endDate=2026-01-31" \
  -H "x-api-key: science-chago-api-integration-key-2026"
```

**Response:**
```json
{
  "success": true,
  "resumen": {
    "totalVentas": 245,
    "totalIngresos": 125750.50,
    "promedioTicket": 513.27,
    "ventasPorDia": [
      {
        "fecha": "2026-01-15",
        "total": 3450.00,
        "count": 8
      }
    ],
    "productosMasVendidos": [
      {
        "nombre": "Café Americano",
        "cantidad": 89,
        "total": 2670.00
      },
      {
        "nombre": "Proteína Whey",
        "cantidad": 12,
        "total": 10200.00
      }
    ],
    "periodo": {
      "inicio": "2026-01-01",
      "fin": "2026-01-31"
    }
  }
}
```

---

### 6. GET `/api/ventas`

Lista detallada de ventas con múltiples filtros.

**Query Params:**
- `startDate` (opcional): Fecha inicio YYYY-MM-DD
- `endDate` (opcional): Fecha fin YYYY-MM-DD
- `clienteId` (opcional): ID del cliente
- `productoId` (opcional): ID del producto
- `tipoProducto` (opcional): Tipo de producto
- `planId` (opcional): ID del plan
- `tipoPlan` (opcional): Tipo de plan (grupal, personalizado, sesion)
- `sucursalId` (opcional): ID de la sucursal
- `limit` (opcional): Límite de resultados (default: 100)

**Request:**
```bash
curl -X GET "http://localhost:3000/api/ventas?startDate=2026-01-20&endDate=2026-01-26&limit=50" \
  -H "x-api-key: science-chago-api-integration-key-2026"
```

**Response:**
```json
{
  "success": true,
  "ventas": [
    {
      "id": "venta_001",
      "date": "2026-01-25T14:30:00.000Z",
      "total": 550.00,
      "totalItems": 3,
      "items": [
        {
          "id": "prod_123",
          "name": "Café Americano",
          "price": 35,
          "quantity": 2,
          "tipo": "Cafetería"
        },
        {
          "id": "prod_456",
          "name": "Barra de Proteína",
          "price": 80,
          "quantity": 1,
          "tipo": "Suplementos"
        }
      ],
      "client": {
        "id": "cliente_789",
        "nombre": "Juan",
        "apellidoPaterno": "Pérez",
        "apellidoMaterno": "García",
        "email": "juan@example.com"
      },
      "sucursalId": "suc_001",
      "transactionExternalId": "sci-chago-trans-123"
    }
  ],
  "total": 50,
  "totalSinLimite": 125,
  "filtros": {
    "startDate": "2026-01-20",
    "endDate": "2026-01-26",
    "clienteId": null,
    "productoId": null,
    "tipoProducto": null,
    "planId": null,
    "tipoPlan": null,
    "sucursalId": null,
    "limit": 50
  }
}
```

**Ejemplos de filtros adicionales:**

```bash
# Ventas de un cliente específico
curl -X GET "http://localhost:3000/api/ventas?clienteId=cliente_789" \
  -H "x-api-key: science-chago-api-integration-key-2026"

# Ventas de productos de tipo "Suplementos"
curl -X GET "http://localhost:3000/api/ventas?tipoProducto=Suplementos" \
  -H "x-api-key: science-chago-api-integration-key-2026"

# Ventas de planes personalizados
curl -X GET "http://localhost:3000/api/ventas?tipoPlan=personalizado" \
  -H "x-api-key: science-chago-api-integration-key-2026"
```

---

### 7. GET `/api/cuentas-por-cobrar`

Obtiene cuentas por cobrar (paquetes con saldo pendiente).

**Query Params:**
- `clienteId` (opcional): ID del cliente específico

**Request:**
```bash
curl -X GET "http://localhost:3000/api/cuentas-por-cobrar" \
  -H "x-api-key: science-chago-api-integration-key-2026"
```

**Response:**
```json
{
  "success": true,
  "cuentasPorCobrar": [
    {
      "clienteId": "cliente_789",
      "clienteNombre": "Juan Pérez",
      "clienteEmail": "juan@example.com",
      "clienteTelefono": "5551234567",
      "paquetes": [
        {
          "id": "asig_001",
          "nombre": "Paquete Personalizado 10 Sesiones",
          "precioTotal": 5000,
          "montoPagado": 2500,
          "saldoPendiente": 2500,
          "fechaAsignacion": "2026-01-15T10:00:00.000Z",
          "status": "active",
          "tipo": "personalizado"
        }
      ],
      "totalPendiente": 2500
    },
    {
      "clienteId": "cliente_456",
      "clienteNombre": "María González",
      "clienteEmail": "maria@example.com",
      "clienteTelefono": "5559876543",
      "paquetes": [
        {
          "id": "asig_002",
          "nombre": "Membresía Mensual Grupal",
          "precioTotal": 1200,
          "montoPagado": 600,
          "saldoPendiente": 600,
          "fechaAsignacion": "2026-01-20T12:00:00.000Z",
          "status": "active",
          "tipo": "grupal"
        }
      ],
      "totalPendiente": 600
    }
  ],
  "totalCuentas": 2,
  "totalGeneral": 3100,
  "filtros": {
    "clienteId": null
  }
}
```

**Filtrar por cliente específico:**
```bash
curl -X GET "http://localhost:3000/api/cuentas-por-cobrar?clienteId=cliente_789" \
  -H "x-api-key: science-chago-api-integration-key-2026"
```

---

## 🔒 Manejo de Errores

Todos los endpoints devuelven errores en formato consistente:

### 401 - No autorizado
```json
{
  "success": false,
  "error": "API key inválida o faltante"
}
```

### 405 - Método no permitido
```json
{
  "success": false,
  "error": "Método no permitido. Use GET."
}
```

### 500 - Error del servidor
```json
{
  "success": false,
  "error": "Error al obtener los productos",
  "details": "Mensaje de error técnico"
}
```

---

## 📝 Notas Importantes

1. **API Key**: La clave actual es `science-chago-api-integration-key-2026`. Se puede cambiar en las variables de entorno (`NEXT_PUBLIC_SCIENCE_CHAGO_API_KEY`).

2. **Formatos de Fecha**: Todas las fechas se devuelven en formato ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ).

3. **Filtros de Fecha**: Los parámetros `startDate` y `endDate` deben estar en formato YYYY-MM-DD.

4. **Límites**: Por defecto, `/api/ventas` limita a 100 resultados. Usa el parámetro `limit` para ajustar.

5. **Paginación**: Actualmente no hay paginación completa. Se recomienda usar filtros de fecha para reducir resultados.

6. **Sucursales**: Usa `sucursalId="Todas"` para obtener datos de todas las sucursales.

---

## 🧪 Testing Rápido

Puedes probar los endpoints en tu navegador o con herramientas como Postman, Insomnia o cURL.

**Ejemplo con JavaScript (desde Science Chago):**

```javascript
const API_BASE = 'http://localhost:3000';
const API_KEY = 'science-chago-api-integration-key-2026';

async function obtenerProductos() {
  const response = await fetch(`${API_BASE}/api/productos`, {
    headers: {
      'x-api-key': API_KEY
    }
  });
  
  const data = await response.json();
  console.log(data);
  return data;
}

async function obtenerVentasDelMes() {
  const startDate = '2026-01-01';
  const endDate = '2026-01-31';
  
  const response = await fetch(
    `${API_BASE}/api/ventas?startDate=${startDate}&endDate=${endDate}`,
    {
      headers: {
        'x-api-key': API_KEY
      }
    }
  );
  
  const data = await response.json();
  console.log(data);
  return data;
}
```

---

## 🚀 Próximos Pasos

1. ✅ Todos los endpoints están implementados y funcionales
2. 🔄 Cambiar el dominio base cuando despliegues a producción
3. 🔐 Considera cambiar el API key en producción
4. 📊 Implementar paginación completa si los datasets crecen
5. 📈 Agregar más métricas según necesidades

---

**Fecha de creación:** 26 de enero de 2026  
**Versión:** 1.0.0  
**Autor:** Science in Motion Team
