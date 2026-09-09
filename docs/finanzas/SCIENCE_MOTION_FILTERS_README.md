# Filtros de Science Motion en Reportes

## 📋 Descripción

Se han agregado filtros personalizados en la página de `/admin/reportes` que permiten visualizar información de ventas, productos, planes y cuentas por cobrar directamente desde la API de Science Motion.

## 🎯 Filtros Implementados

### 1. **Venta General de Productos**
- Muestra el resumen completo de todas las ventas de productos
- Incluye totales, cantidad de ventas y promedio por venta
- Permite filtrar por rango de fechas

### 2. **Venta por Tipo de Producto**
- Filtra las ventas según el tipo de producto seleccionado
- Requiere seleccionar un tipo de producto del dropdown
- Muestra desglose detallado por tipo

### 3. **Venta por Producto Específico**
- Permite ver las ventas de un producto individual
- Selector con todos los productos disponibles
- Muestra historial completo de ventas del producto

### 4. **Venta por Planes y Paquetes**
- Visualiza todas las ventas relacionadas con planes y paquetes
- Resumen general de planes vendidos
- Opción de filtrar por plan específico

### 5. **Venta por Tipo de Plan**
- Agrupa ventas por categoría de plan
- Requiere seleccionar un tipo de plan
- Comparativa entre diferentes tipos

### 6. **Ventas a Cliente Específico**
- Historial completo de compras de un cliente
- Selector de cliente con autocompletado
- Muestra todas las transacciones del cliente seleccionado

### 7. **Total Cuentas por Cobrar**
- Resumen de todas las deudas pendientes
- Detalle por cliente
- Indicador de días de vencimiento

### 8. **Deuda de Cliente Específico**
- Consulta la deuda de un cliente particular
- Requiere seleccionar un cliente
- Muestra montos pagados y pendientes

## 🏗️ Arquitectura

### Servicios

#### `scienceMotionService.js`
Servicio principal que consume la API de Science Motion:
- `getVentas()` - Obtiene ventas con filtros
- `getVentasGenerales()` - Resumen general de ventas
- `getProductos()` - Lista de productos
- `getTiposProducto()` - Tipos de productos disponibles
- `getPlanes()` - Lista de planes y paquetes
- `getTiposPlanes()` - Tipos de planes
- `getCuentasPorCobrar()` - Cuentas pendientes de cobro
- `getDeudaCliente()` - Deuda específica de un cliente

### Endpoints API (Proxy)

Los siguientes endpoints actúan como proxy seguro entre el frontend y Science Motion:

```
/api/science-motion/ventas
/api/science-motion/ventas/general
/api/science-motion/productos
/api/science-motion/productos/tipos
/api/science-motion/planes
/api/science-motion/planes/tipos
/api/science-motion/cuentas-por-cobrar
```

### Componentes React

#### `ScienceMotionFilters.js`
Componente de filtros con:
- Selectores de fechas
- Dropdowns para productos, tipos, planes y clientes
- Botones para aplicar cada filtro
- Estado de carga y validaciones

#### `ScienceMotionResults.js`
Componente de visualización que muestra:
- Tarjetas de resumen con métricas principales
- Tablas de ventas con información detallada
- Tabla de cuentas por cobrar
- Indicadores visuales de estado (pagado, pendiente, parcial)

## 🔧 Configuración

### Variables de Entorno

El sistema utiliza la variable `EXTERNAL_SYSTEM_URL` del archivo `.env.local`:

```env
# Para desarrollo (ambos sistemas en localhost)
EXTERNAL_SYSTEM_URL=http://localhost:3000

# Para producción
EXTERNAL_SYSTEM_URL=https://www.scienceinmotion.com.mx/dashboard
```

### API Key

Los endpoints de Science Motion requieren autenticación con el header:
```
x-api-key: science-chago-api-integration-key-2026
```

Este header se agrega automáticamente en el servicio `scienceMotionService.js`.

### Pasos de Configuración

1. **Asegúrate que Science Motion esté corriendo:**
   ```bash
   cd /ruta/a/science-motion
   npm run dev
   ```
   Science Motion debe estar corriendo en `http://localhost:3000`

2. **Verifica que Science Chago esté en otro puerto:**
   En este proyecto (Science Chago), el puerto por defecto es `3001`

3. **Verifica la URL en `.env.local`:**
   ```env
   EXTERNAL_SYSTEM_URL=http://localhost:3000
   ```

4. **Reinicia el servidor de Science Chago:**
   ```bash
   npm run dev
   ```

## 📊 Uso

### Cómo usar los filtros:

1. **Navega a** `/admin/reportes`

2. **Selecciona fechas** (opcional pero recomendado):
   - Fecha inicio
   - Fecha fin

3. **Elige el tipo de filtro**:
   - Para filtros que requieren selección (productos, clientes, tipos):
     - Primero selecciona el elemento del dropdown
     - Luego haz clic en el botón correspondiente
   - Para filtros generales:
     - Simplemente haz clic en el botón

4. **Visualiza los resultados**:
   - Aparecerá una sección con tarjetas de resumen
   - Tabla detallada con todas las transacciones
   - Opciones de ordenamiento y filtrado

5. **Limpia los filtros**:
   - Haz clic en "Limpiar filtros" para resetear

## 🎨 Interfaz Visual

### Tarjetas de Resumen
- **Total Ventas**: Monto total en MXN (azul)
- **Cantidad de Ventas**: Número de transacciones (verde)
- **Promedio por Venta**: Ticket promedio (morado)
**Causa:** Science Motion no está corriendo o no está accesible

**Solución:**
1. Verifica que Science Motion esté corriendo:
   ```bash
   cd /ruta/a/science-motion
   npm run dev
   ```
2. Verifica que esté en el puerto correcto (3000)
3. Asegúrate que `EXTERNAL_SYSTEM_URL=http://localhost:3000` en `.env.local`
4. Reinicia ambos servidores

### Error: "SyntaxError: Unexpected token '<', '<!DOCTYPE'..."
**Causa:** Los endpoints no existen en Science Motion (devuelve HTML 404)

**Solución:**
1. Verifica que Science Motion tenga todos los endpoints creados:
   - `/api/productos`
   - `/api/productos/tipos`
   - `/api/planes`
   - `/api/planes/tipos`
   - `/api/ventas`
   - `/api/ventas/general`
   - `/api/cuentas-por-cobrar`

2. Prueba los endpoints directamente:
   ```bash
   curl -H "x-api-key: science-chago-api-integration-key-2026" \
        http://localhost:3000/api/productos
   ```

### Error: "No se puede conectar a Science Motion"
**Causa:** Problemas de conectividad entre los dos sistemas

**Solución:**
1. Verifica que ambos sistemas estén corriendo
2. Confirma que estén en puertos diferentes (3000 y 3001)
3. Desactiva cualquier firewall que pueda bloquear localhost
4. Verifica la consola de Science Motion para ver si hay errores

### Error: "Error al aplicar filtro"
**Causa:** El endpoint existe pero devuelve un error

**Solución:**
1. Revisa la consola del navegador (F12) para ver el error específico
2. Revisa los logs del servidor de Science Motion
3. Verifica que los datos en Firestore existan
4. Confirma que el API key sea correcta

- Los endpoints API actúan como proxy, protegiendo credenciales
- El frontend nunca accede directamente a Science Motion
- Todas las peticiones pasan por el backend de Next.js
- Validación de datos en ambos lados (cliente y servidor)

## 🚀 Características Futuras

Posibles mejoras para implementar:

1. **Exportación de datos filtrados** a Excel/PDF
2. **Gráficas visuales** para cada tipo de filtro
3. **Comparativas entre períodos** de tiempo
4. **Alertas automáticas** para cuentas vencidas
5. **Dashboard de métricas** de Science Motion
6. **Sincronización en tiempo real** con webhooks

## 🐛 Troubleshooting

### Error: "Error al cargar datos de filtros"
- Verifica que `EXTERNAL_SYSTEM_URL` esté correctamente configurada
- Asegúrate que Science Motion esté accesible
- Revisa los logs del servidor para más detalles

### Error: "Error al aplicar filtro"
- Verifica que hayas seleccionado todos los campos requeridos
- Confirma que las fechas sean válidas
- Revisa la consola del navegador para errores específicos

### No se muestran datos
- Verifica que existan datos en Science Motion para el período seleccionado
- Confirma que los filtros aplicados sean correctos
- Revisa que los endpoints de Science Motion estén respondiendo

## 📝 Notas Técnicas

- Los componentes son completamente independientes del resto de reportes
- Se pueden activar/desactivar sin afectar la funcionalidad existente
- Los datos se cargan bajo demanda (lazy loading)
- Optimizado para manejar grandes volúmenes de datos

## 📞 Soporte

Para problemas o consultas sobre esta funcionalidad, contacta al equipo de desarrollo o revisa los logs en:
- Console del navegador (F12)
- Logs del servidor Next.js
- Logs de la API de Science Motion

---

**Última actualización:** 26 de enero de 2026
**Versión:** 1.0.0
