# Configuración del Cron Job para Expiración de Paquetes

Este documento explica cómo configurar el sistema de verificación automática de expiración de paquetes.

## Descripción

Todos los paquetes tienen una duración de **30 días** desde su fecha de asignación. Este sistema verifica diariamente qué paquetes han cumplido ese período y automáticamente cambia su estado a `expired`.a

## Componentes

### 1. API Endpoint
**Ruta:** `/api/paquetes/verificar-expiracion.js`

Este endpoint:
- Busca todos los paquetes con estado `active` en las colecciones de clientes y atletas
- Calcula los días transcurridos desde la fecha de asignación
- Actualiza a estado `expired` los paquetes que han pasado 30 días o más
- Retorna estadísticas de la verificación

**Llamada manual:**
```bash
curl -X POST http://localhost:3000/api/paquetes/verificar-expiracion
```

### 2. Script de Cron Job
**Ubicación:** `scripts/verificar-expiracion-paquetes.js`

Script Node.js que llama al endpoint API y registra los resultados.

**Ejecutar manualmente:**
```bash
node scripts/verificar-expiracion-paquetes.js
```

### 3. Utilidades de Cliente
**Ubicación:** `src/utils/packageUtils.js`

Funciones auxiliares para calcular y mostrar días restantes en la interfaz:
- `calcularDiasRestantes(fechaAsignacion)` - Calcula días restantes del paquete
- `isPaqueteExpirado(fechaAsignacion)` - Verifica si un paquete está expirado
- `formatearDiasRestantes(diasRestantes)` - Formatea para UI con colores según estado

## Configuración del Cron Job

### Opción 1: Cron tradicional (Linux/macOS)

1. Crear directorio para logs:
```bash
mkdir -p /ruta/a/tu/proyecto/logs
```

2. Abrir el editor de crontab:
```bash
crontab -e
```

3. Agregar la siguiente línea para ejecutar diariamente a las 2:00 AM:
```cron
0 2 * * * cd /ruta/a/tu/proyecto && node scripts/verificar-expiracion-paquetes.js >> logs/cron-expiracion.log 2>&1
```

4. Guardar y salir. Verificar que se guardó correctamente:
```bash
crontab -l
```

### Opción 2: PM2 (Recomendado para producción)

1. Instalar PM2 si no lo tienes:
```bash
npm install -g pm2
```

2. Crear archivo de configuración `ecosystem.config.js` en la raíz:
```javascript
module.exports = {
  apps: [{
    name: 'verificar-expiracion',
    script: './scripts/verificar-expiracion-paquetes.js',
    cron_restart: '0 2 * * *', // 2:00 AM diario
    autorestart: false,
    watch: false,
    env: {
      BASE_URL: 'http://localhost:3000'
    }
  }]
};
```

3. Iniciar con PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Opción 3: Vercel Cron Jobs

Si estás desplegando en Vercel, crea `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/paquetes/verificar-expiracion",
    "schedule": "0 2 * * *"
  }]
}
```

## Variables de Entorno

Asegúrate de configurar la variable de entorno `BASE_URL` en producción:

```bash
# .env.production
BASE_URL=https://tu-dominio.com
```

## Monitoreo

### Ver logs del cron (opción 1):
```bash
tail -f logs/cron-expiracion.log
```

### Ver logs de PM2 (opción 2):
```bash
pm2 logs verificar-expiracion
```

### Formato de salida esperado:
```
[2025-10-27T02:00:00.000Z] Iniciando verificación de expiración de paquetes...
[2025-10-27T02:00:00.000Z] URL: http://localhost:3000/api/paquetes/verificar-expiracion
[2025-10-27T02:00:02.000Z] ✅ Verificación completada exitosamente
[2025-10-27T02:00:02.000Z] Paquetes verificados: 45
[2025-10-27T02:00:02.000Z] Paquetes actualizados a expirado: 3
[2025-10-27T02:00:02.000Z] Script finalizado correctamente
```

## Pruebas

### Probar el script manualmente:
```bash
# Desarrollo
BASE_URL=http://localhost:3000 node scripts/verificar-expiracion-paquetes.js

# Producción
BASE_URL=https://tu-dominio.com node scripts/verificar-expiracion-paquetes.js
```

### Probar el API directamente:
```bash
curl -X POST http://localhost:3000/api/paquetes/verificar-expiracion | jq
```

## Visualización en la Interfaz

Los días restantes se muestran automáticamente en ambas vistas (grid y tabla):

- **Verde**: 8+ días restantes
- **Naranja**: 1-7 días restantes
- **Rojo**: Expirado (0 o menos días)

## Solución de Problemas

### El cron no se ejecuta
1. Verificar que el cron esté configurado: `crontab -l`
2. Verificar permisos de ejecución: `chmod +x scripts/verificar-expiracion-paquetes.js`
3. Verificar que la ruta en el cron sea absoluta

### Errores en los logs
1. Verificar que el servidor esté corriendo
2. Verificar la variable `BASE_URL`
3. Revisar los logs de Firebase para errores de permisos

### Paquetes no se marcan como expirados
1. Verificar que la fecha de asignación esté guardada correctamente en Firestore
2. Ejecutar manualmente el script para ver errores específicos
3. Verificar que los paquetes tengan el campo `status: 'active'`

## Mantenimiento

- Los logs deben limpiarse periódicamente para no consumir espacio en disco
- Se recomienda configurar logrotate o similar para gestionar los logs
- Monitorear el tiempo de ejecución del script; si toma mucho tiempo, considerar optimizar las consultas a Firestore
