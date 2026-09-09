# 🔗 Guía de Integración para Science Chago

Esta guía te ayudará a integrar los endpoints de Science Motion en tu sistema Science Chago.

## 📋 Resumen Rápido

✅ **7 endpoints creados y funcionando**  
✅ **Autenticación por API Key implementada**  
✅ **Respuestas en formato JSON**  
✅ **Filtros y parámetros implementados**  
✅ **Manejo de errores consistente**

---

## 🚀 Inicio Rápido

### 1. Verificar que el servidor esté corriendo

```bash
cd /Users/gabrielhernandez/Projects/science-in-motion
npm run dev
```

El servidor debe estar en: `http://localhost:3000`

### 2. Probar los endpoints

Abre en tu navegador: `http://localhost:3000/api-tester.html`

Esto abrirá una interfaz visual para probar todos los endpoints.

---

## 🔑 Autenticación

Todos los endpoints requieren el header:

```javascript
headers: {
  'x-api-key': 'science-chago-api-integration-key-2026'
}
```

⚠️ **Importante**: Esta clave está hardcodeada actualmente. Puedes cambiarla en:
- Variable de entorno: `NEXT_PUBLIC_SCIENCE_CHAGO_API_KEY`
- O directamente en cada archivo de endpoint

---

## 📊 Estructura de Datos

### Productos
```typescript
interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  precio: number;
  inventarioInicial: number;
  inventarioActual: number;
  imageUrl?: string;
  sucursalId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Planes
```typescript
interface Plan {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'grupal' | 'personalizado' | 'sesion';
  precio: number;
  sesiones: number;
  duracion: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Ventas
```typescript
interface Venta {
  id: string;
  date: string; // ISO 8601
  total: number;
  totalItems: number;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    tipo?: string;
  }>;
  client?: {
    id: string;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    email: string;
  };
  sucursalId: string;
  transactionExternalId?: string;
}
```

---

## 💻 Ejemplos de Código para Science Chago

### Configuración Base

```javascript
// config.js
const API_CONFIG = {
  baseUrl: process.env.SCIENCE_MOTION_API_URL || 'http://localhost:3000',
  apiKey: process.env.SCIENCE_MOTION_API_KEY || 'science-chago-api-integration-key-2026'
};

async function fetchScienceMotion(endpoint, options = {}) {
  const url = `${API_CONFIG.baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'x-api-key': API_CONFIG.apiKey,
      ...options.headers
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error en la petición');
  }
  
  return response.json();
}

module.exports = { fetchScienceMotion };
```

### Ejemplo 1: Obtener Productos

```javascript
const { fetchScienceMotion } = require('./config');

async function obtenerProductos() {
  try {
    const data = await fetchScienceMotion('/api/productos');
    
    console.log(`✅ ${data.total} productos encontrados`);
    
    // Procesar productos
    data.productos.forEach(producto => {
      console.log(`- ${producto.nombre}: $${producto.precio}`);
    });
    
    return data.productos;
  } catch (error) {
    console.error('❌ Error al obtener productos:', error.message);
    return [];
  }
}
```

### Ejemplo 2: Ventas del Mes

```javascript
async function obtenerVentasDelMes() {
  const hoy = new Date();
  const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  
  const startDate = primerDia.toISOString().split('T')[0];
  const endDate = ultimoDia.toISOString().split('T')[0];
  
  try {
    const data = await fetchScienceMotion(
      `/api/ventas?startDate=${startDate}&endDate=${endDate}`
    );
    
    console.log(`✅ ${data.total} ventas en el mes`);
    
    // Calcular total de ingresos
    const totalIngresos = data.ventas.reduce((sum, v) => sum + v.total, 0);
    console.log(`💰 Total ingresos: $${totalIngresos.toFixed(2)}`);
    
    return data.ventas;
  } catch (error) {
    console.error('❌ Error al obtener ventas:', error.message);
    return [];
  }
}
```

### Ejemplo 3: Resumen de Ventas

```javascript
async function obtenerResumenVentas(startDate, endDate) {
  try {
    const data = await fetchScienceMotion(
      `/api/ventas/general?startDate=${startDate}&endDate=${endDate}`
    );
    
    const { resumen } = data;
    
    console.log('📊 RESUMEN DE VENTAS');
    console.log('='.repeat(50));
    console.log(`Total Ventas: ${resumen.totalVentas}`);
    console.log(`Total Ingresos: $${resumen.totalIngresos.toFixed(2)}`);
    console.log(`Promedio Ticket: $${resumen.promedioTicket.toFixed(2)}`);
    console.log('\n🏆 Productos más vendidos:');
    
    resumen.productosMasVendidos.slice(0, 5).forEach((prod, index) => {
      console.log(`${index + 1}. ${prod.nombre}: ${prod.cantidad} unidades`);
    });
    
    return resumen;
  } catch (error) {
    console.error('❌ Error al obtener resumen:', error.message);
    return null;
  }
}
```

### Ejemplo 4: Cuentas por Cobrar

```javascript
async function obtenerCuentasPorCobrar() {
  try {
    const data = await fetchScienceMotion('/api/cuentas-por-cobrar');
    
    console.log('💳 CUENTAS POR COBRAR');
    console.log('='.repeat(50));
    console.log(`Total Cuentas: ${data.totalCuentas}`);
    console.log(`Total General: $${data.totalGeneral.toFixed(2)}`);
    console.log('\n📋 Detalle:');
    
    data.cuentasPorCobrar.forEach(cuenta => {
      console.log(`\n👤 ${cuenta.clienteNombre}`);
      console.log(`   Email: ${cuenta.clienteEmail || 'N/A'}`);
      console.log(`   Saldo Pendiente: $${cuenta.totalPendiente.toFixed(2)}`);
      
      cuenta.paquetes.forEach(paq => {
        console.log(`   - ${paq.nombre}: $${paq.saldoPendiente.toFixed(2)}`);
      });
    });
    
    return data.cuentasPorCobrar;
  } catch (error) {
    console.error('❌ Error al obtener cuentas por cobrar:', error.message);
    return [];
  }
}
```

### Ejemplo 5: Sincronización Completa

```javascript
async function sincronizarDatos() {
  console.log('🔄 Iniciando sincronización...\n');
  
  try {
    // 1. Obtener productos
    console.log('📦 Sincronizando productos...');
    const productos = await obtenerProductos();
    // Guardar en tu base de datos de Science Chago
    await guardarProductosEnBD(productos);
    
    // 2. Obtener planes
    console.log('\n📋 Sincronizando planes...');
    const planes = await fetchScienceMotion('/api/planes');
    await guardarPlanesEnBD(planes.planes);
    
    // 3. Obtener ventas recientes
    console.log('\n💰 Sincronizando ventas...');
    const hoy = new Date().toISOString().split('T')[0];
    const ventas = await fetchScienceMotion(`/api/ventas?startDate=${hoy}`);
    await procesarVentas(ventas.ventas);
    
    // 4. Actualizar cuentas por cobrar
    console.log('\n💳 Actualizando cuentas por cobrar...');
    const cuentas = await obtenerCuentasPorCobrar();
    await actualizarCuentasPorCobrar(cuentas);
    
    console.log('\n✅ Sincronización completada');
  } catch (error) {
    console.error('\n❌ Error en sincronización:', error.message);
  }
}

// Ejecutar cada 5 minutos
setInterval(sincronizarDatos, 5 * 60 * 1000);
```

---

## 🔍 Casos de Uso Específicos

### Filtrar ventas de un cliente
```javascript
const ventasCliente = await fetchScienceMotion(
  `/api/ventas?clienteId=cliente_123`
);
```

### Obtener solo productos de tipo "Suplementos"
```javascript
const ventas = await fetchScienceMotion(
  `/api/ventas?tipoProducto=Suplementos`
);
```

### Ventas de planes personalizados
```javascript
const ventasPlanes = await fetchScienceMotion(
  `/api/ventas?tipoPlan=personalizado&startDate=2026-01-01`
);
```

### Deuda de un cliente específico
```javascript
const deudaCliente = await fetchScienceMotion(
  `/api/cuentas-por-cobrar?clienteId=cliente_123`
);
```

---

## 🐛 Debugging

### Ver logs en Science Motion
Los endpoints registran logs en consola. Revisa el terminal donde corre `npm run dev`.

### Errores comunes

**Error: API key inválida**
```json
{
  "success": false,
  "error": "API key inválida o faltante"
}
```
**Solución**: Verifica que el header `x-api-key` esté presente y correcto.

**Error: HTML en lugar de JSON**
```html
<!DOCTYPE html>...
```
**Solución**: El endpoint no existe o la ruta está mal. Verifica la URL.

**Error: CORS**
```
Access to fetch blocked by CORS policy
```
**Solución**: Los endpoints ya tienen CORS habilitado para desarrollo. En producción, configura los dominios permitidos.

---

## 📝 Checklist de Integración

- [ ] Servidor de Science Motion corriendo (`npm run dev`)
- [ ] Probador visual funcionando (`/api-tester.html`)
- [ ] API Key configurada en Science Chago
- [ ] Función base `fetchScienceMotion` implementada
- [ ] Probado endpoint `/api/productos`
- [ ] Probado endpoint `/api/planes`
- [ ] Probado endpoint `/api/ventas`
- [ ] Probado endpoint `/api/cuentas-por-cobrar`
- [ ] Sincronización automática configurada
- [ ] Manejo de errores implementado
- [ ] Logs de debugging configurados

---

## 🚀 Próximos Pasos

1. **Desarrollo**: Usa `http://localhost:3000` para pruebas
2. **Staging**: Cambia a tu URL de staging cuando despliegues
3. **Producción**: Actualiza `NEXT_PUBLIC_SCIENCE_CHAGO_API_KEY` con una clave segura
4. **Monitoreo**: Considera agregar logs de requests en ambos sistemas

---

## 📞 Soporte

Si encuentras algún problema:
1. Revisa los logs del servidor Next.js
2. Usa el probador visual (`/api-tester.html`)
3. Verifica que Firebase esté configurado correctamente
4. Confirma que la API key sea la correcta

**Fecha:** 26 de enero de 2026  
**Versión:** 1.0.0
