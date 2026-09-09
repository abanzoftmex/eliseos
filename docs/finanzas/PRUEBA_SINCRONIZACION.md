# Guía de Prueba de Sincronización

## Estado Actual

✅ **Endpoints creados en Science Chago:**
- `POST /api/integration/sync/clientes` - Recibe clientes del sistema externo
- `POST /api/integration/sync/sucursales` - Recibe sucursales del sistema externo
- `POST /api/integration/trigger-sync` - Dispara sincronización manual consultando science-in-motion
- `GET /api/clientes` - Lista clientes sincronizadosa
- `GET /api/sucursales` - Lista sucursales sincronizadas

✅ **UI completada:**
- Sidebar con sección "Integración"
- `/admin/integracion/clientes` - Ver y sincronizar clientes
- `/admin/integracion/sucursales` - Ver y sincronizar sucursales

---

## Cómo Probar la Sincronización

### 1. Iniciar ambos sistemas

**Terminal 1 - Science in Motion (puerto 3000):**
```bash
cd /Volumes/ExternoSSD/trabajo/valquirico/science-in-motion
npm run dev
```

**Terminal 2 - Science Chago (puerto 3001):**
```bash
cd /Volumes/ExternoSSD/trabajo/valquirico/science-chago
npm run dev
```

### 2. Verificar que ambos sistemas estén corriendo

```bash
# Verificar Science in Motion (debe mostrar cantidad de clientes)
curl -s 'http://localhost:3000/api/clientes?simple=true' | jq '.count'

# Verificar Science Chago
curl -s 'http://localhost:3001/api/sucursales' | jq '.success'
```

### 3. Probar sincronización desde UI

1. Abrir Science Chago: http://localhost:3001
2. Ir a **Integración > Clientes**
3. Clic en **"Sincronizar Ahora"**
4. Debería mostrar: "✅ Sincronización completada: X clientes creados, Y actualizados"

### 4. Probar sincronización desde API (cURL)

**Sincronizar solo clientes:**
```bash
curl -X POST http://localhost:3001/api/integration/trigger-sync \
  -H "Content-Type: application/json" \
  -d '{"type": "clientes"}' | jq
```

**Sincronizar solo sucursales:**
```bash
curl -X POST http://localhost:3001/api/integration/trigger-sync \
  -H "Content-Type: application/json" \
  -d '{"type": "sucursales"}' | jq
```

**Sincronizar todo:**
```bash
curl -X POST http://localhost:3001/api/integration/trigger-sync \
  -H "Content-Type: application/json" \
  -d '{"type": "all"}' | jq
```

### 5. Verificar datos sincronizados

**Ver clientes en Science Chago:**
```bash
curl -s 'http://localhost:3001/api/clientes' | jq '.count'
```

**Ver sucursales en Science Chago:**
```bash
curl -s 'http://localhost:3001/api/sucursales' | jq '.count'
```

---

## Flujo de Sincronización

```
┌─────────────────────────┐
│  Science in Motion      │
│  (puerto 3000)          │
│  87 clientes            │
└──────────┬──────────────┘
           │
           │ 1. GET /api/clientes?simple=true
           │ 2. GET /api/sucursales
           │
           ▼
┌─────────────────────────┐
│  trigger-sync endpoint  │
│  /api/integration/      │
│  trigger-sync           │
└──────────┬──────────────┘
           │
           │ 3. Transforma datos
           │ 4. Llama a clienteService.syncFromExternal()
           │
           ▼
┌─────────────────────────┐
│  Firestore              │
│  Science Chago          │
│  (clientes collection)  │
└─────────────────────────┘
```

---

## Mapeo de Datos

### Clientes (Science in Motion → Science Chago)

| Science in Motion        | Science Chago           | Transformación                           |
|-------------------------|-------------------------|------------------------------------------|
| `id`                    | `id`                    | Directo (ID de Firestore)                |
| `nombre`                | `nombre`                | Directo                                  |
| `apellidoPaterno`       | `apellidoPaterno`       | Directo                                  |
| `apellidoMaterno`       | `apellidoMaterno`       | Directo (o '' si no existe)              |
| `email`                 | `email`                 | Directo                                  |
| `telefono`              | `telefono`              | Directo                                  |
| `sucursales[0]`         | `sucursal`              | Primera sucursal del array               |
| `esAtleta`              | `tipo`                  | `esAtleta ? 'atleta' : 'cliente'`        |
| `numeroExpediente`      | `numeroExpediente`      | Directo                                  |
| -                       | `activo`                | Por defecto `true`                       |

### Sucursales

| Science in Motion | Science Chago    | Transformación           |
|------------------|------------------|--------------------------|
| `id`             | `id`             | Directo                  |
| `name/nombre`    | `name`           | Acepta ambos nombres     |
| `direccion`      | `direccion`      | Directo                  |
| `telefono`       | `telefono`       | Directo                  |
| `email`          | `email`          | Directo                  |
| `ciudad`         | `ciudad`         | Directo                  |
| `codigoPostal`   | `codigoPostal`   | Directo                  |

---

## Troubleshooting

### Error: "EXTERNAL_SYSTEM_URL no configurada"
- Verificar que `.env.local` tenga: `EXTERNAL_SYSTEM_URL=http://localhost:3000`
- Reiniciar el servidor de Science Chago

### Error: "Error al obtener clientes del sistema externo"
- Verificar que Science in Motion esté corriendo en puerto 3000
- Probar manualmente: `curl http://localhost:3000/api/clientes?simple=true`

### No se ven clientes en la UI
- Verificar que la sincronización se haya completado sin errores
- Revisar la consola del navegador (F12)
- Verificar los logs del servidor

### Puerto 3000 ya en uso
- Cambiar puerto en Science in Motion o Science Chago
- Actualizar `EXTERNAL_SYSTEM_URL` en `.env.local`

---

## Próximos Pasos

1. ✅ Iniciar ambos sistemas
2. ✅ Probar sincronización manual desde UI
3. ✅ Verificar que los 87 clientes se sincronicen correctamente
4. ⏳ Implementar webhooks automáticos en Science in Motion (opcional)
5. ⏳ Configurar cron job para reconciliación diaria (ya configurado en vercel.json)

---

**Fecha:** 22 de enero de 2026
