# ⚡ Configuración Rápida - Filtros de Science Motion

## 🚀 Pasos Rápidos

### 1. Asegúrate que Science Motion esté corriendo

```bash
# Terminal 1 - Science Motion (puerto 3000)
cd /ruta/a/science-motion
npm run dev
```

### 2. Verifica la configuración de Science Chago

En `.env.local` debe estar:
```env
EXTERNAL_SYSTEM_URL=http://localhost:3000
```

### 3. Reinicia Science Chago

```bash
# Terminal 2 - Science Chago (puerto 3001)
cd /ruta/a/science-chago
npm run dev
```

### 4. Verifica la conexión

```bash
# En la carpeta de Science Chago
node scripts/verify-science-motion-connection.js
```

Deberías ver algo como:
```
✅ /api/productos
✅ /api/productos/tipos
✅ /api/planes
✅ /api/planes/tipos
✅ /api/ventas
✅ /api/ventas/general
✅ /api/cuentas-por-cobrar

📊 Resultados: 7/7 endpoints funcionando
✅ ¡Todo funcionando correctamente!
```

### 5. Prueba en el navegador

1. Ve a `http://localhost:3001/admin/reportes`
2. Deberías ver la sección "Filtros de Science Motion"
3. Los dropdowns deberían cargarse con datos
4. Al hacer clic en cualquier filtro, deberían mostrarse resultados

## ❌ Si algo falla

### Error: "No se puede conectar"

**Problema:** Science Motion no está corriendo o está en el puerto incorrecto

**Solución:**
```bash
# En Science Motion, verifica que diga:
# ▲ Next.js 14.x.x
# - Local: http://localhost:3000
```

### Error: "Endpoint no encontrado"

**Problema:** Los endpoints no existen en Science Motion

**Solución:**
Asegúrate que Science Motion tenga creados estos archivos:
- `src/pages/api/productos/index.js`
- `src/pages/api/productos/tipos.js`
- `src/pages/api/planes/index.js`
- `src/pages/api/planes/tipos.js`
- `src/pages/api/ventas/index.js`
- `src/pages/api/ventas/general.js`
- `src/pages/api/cuentas-por-cobrar.js`

### Error: "401 Unauthorized"

**Problema:** El API key no es correcto

**Solución:**
Verifica que en Science Motion, los endpoints acepten:
```
x-api-key: science-chago-api-integration-key-2026
```

## 🧪 Pruebas Manuales

Puedes probar los endpoints directamente con curl:

```bash
# Productos
curl -H "x-api-key: science-chago-api-integration-key-2026" \
     http://localhost:3000/api/productos

# Tipos de productos
curl -H "x-api-key: science-chago-api-integration-key-2026" \
     http://localhost:3000/api/productos/tipos

# Ventas generales
curl -H "x-api-key: science-chago-api-integration-key-2026" \
     http://localhost:3000/api/ventas/general
```

## 📝 Checklist de Configuración

- [ ] Science Motion corriendo en puerto 3000
- [ ] Science Chago corriendo en puerto 3001 (o diferente de 3000)
- [ ] `EXTERNAL_SYSTEM_URL=http://localhost:3000` en `.env.local`
- [ ] Los 7 endpoints creados en Science Motion
- [ ] API key configurada en ambos sistemas
- [ ] Script de verificación muestra ✅ en todos los endpoints
- [ ] La página `/admin/reportes` carga sin errores
- [ ] Los dropdowns se llenan con datos de Science Motion

## 🎯 Arquitectura

```
┌─────────────────────┐
│  Science Chago      │
│  (localhost:3001)   │
│                     │
│  /admin/reportes    │
│  ↓                  │
│  ScienceMotionFilters│
│  ↓                  │
│  /api/science-motion/* (proxy)
│  ↓                  │
│  scienceMotionService│
└─────────┬───────────┘
          │ HTTP GET + x-api-key
          ↓
┌─────────────────────┐
│  Science Motion     │
│  (localhost:3000)   │
│                     │
│  /api/productos     │
│  /api/planes        │
│  /api/ventas        │
│  etc...             │
│  ↓                  │
│  Firestore DB       │
└─────────────────────┘
```

## 💡 Flujo de Datos

1. Usuario selecciona filtro en `/admin/reportes`
2. `ScienceMotionFilters` hace fetch a `/api/science-motion/*`
3. Endpoint proxy agrega header `x-api-key` automáticamente
4. Llama a Science Motion en `localhost:3000`
5. Science Motion consulta Firestore
6. Devuelve JSON con datos
7. `ScienceMotionResults` muestra los datos formateados

---

**¿Necesitas ayuda?** Revisa [SCIENCE_MOTION_FILTERS_README.md](./SCIENCE_MOTION_FILTERS_README.md) para documentación completa.
