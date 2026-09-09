# Instrucciones para Integración con Science Chago

**Sistema Destino:** admin.scienceinmotion.com.mx  
**Fecha:** 21 de enero de 2026

---

## 📋 Resumen

Debes implementar webhooks que envíen datos de clientes y sucursales hacia Science Chago cada vez que se creen, actualicen o eliminen registros en tu sistema.

⚠️ **IMPORTANTE**: Los webhooks deben enviar **SOLO el registro afectado** (1 cliente o 1 sucursal), no todos los registros.

---

## 🔑 Credenciales

### API Key (Autenticación)
```
science-chago-api-integration-key-2026
```

**Header requerido en todas las peticiones:**
```
x-api-key: science-chago-api-integration-key-2026
```

o alternativamente:
```
Authorization: Bearer science-chago-api-integration-key-2026
```

---

## 🎯 Endpoints de Destino

### Base URL
```
https://admin.scienceinmotion.com.mx
```

### 1. Sincronizar Clientes
```
POST https://admin.scienceinmotion.com.mx/api/integration/sync/clientes
```

### 2. Sincronizar Sucursales
```
POST https://admin.scienceinmotion.com.mx/api/integration/sync/sucursales
```

---

## 📝 Implementación Requerida

### Caso 1: Webhook Individual - Crear/Actualizar/Eliminar Cliente

⚠️ **IMPORTANTE**: Este webhook debe enviar **SOLO el cliente afectado**, no todos los clientes.

Cuando se crea, actualiza o elimina UN cliente en tu sistema, ejecuta:

```javascript
async function sincronizarClienteAScienceChago(cliente, esEliminacion = false) {
  try {
    const response = await fetch('https://admin.scienceinmotion.com.mx/api/integration/sync/clientes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'science-chago-api-integration-key-2026'
      },
      body: JSON.stringify({
        clientes: [  // Array con SOLO 1 cliente
          {
            id: cliente.id,                          // Tu ID interno (REQUERIDO)
            nombre: cliente.nombre,                   // REQUERIDO
            apellidoPaterno: cliente.apellidoPaterno, // REQUERIDO
            apellidoMaterno: cliente.apellidoMaterno || '',
            email: cliente.email || '',
            telefono: cliente.telefono || '',
            fechaNacimiento: cliente.fechaNacimiento || '', // Formato: YYYY-MM-DD
            genero: cliente.genero || '',            // "masculino" | "femenino" | "otro"
            ocupacion: cliente.ocupacion || '',
            numeroExpediente: cliente.numeroExpediente || '',
            sucursal: cliente.sucursalId,            // ID de sucursal (REQUERIDO)
            tipo: cliente.tipo || 'cliente',         // "cliente" | "atleta"
            activo: esEliminacion ? false : (cliente.activo !== undefined ? cliente.activo : true), // true = activo, false = eliminado
            direccion: {
              calle: cliente.direccion?.calle || '',
              numero: cliente.direccion?.numero || '',
              colonia: cliente.direccion?.colonia || '',
              ciudad: cliente.direccion?.ciudad || '',
              estado: cliente.direccion?.estado || '',
              codigoPostal: cliente.direccion?.codigoPostal || ''
            }
          }
        ]
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Cliente sincronizado con Science Chago:', data.results);
    } else {
      console.error('❌ Error al sincronizar cliente:', data.error);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error de conexión con Science Chago:', error);
    throw error;
  }
}
```

**Integración en tu código:**

```javascript
// En tu modelo/controlador de Cliente

// Después de crear cliente
async afterCreate(cliente) {
  // Tu lógica actual...
  
  // Sincronizar con Science Chago (solo este cliente)
  await sincronizarClienteAScienceChago(cliente);
}

// Después de actualizar cliente
async afterUpdate(cliente) {
  // Tu lógica actual...
  
  // Sincronizar con Science Chago (solo este cliente)
  await sincronizarClienteAScienceChago(cliente);
}

// Después de eliminar/desactivar cliente
async afterDelete(cliente) {
  // Tu lógica actual...
  
  // Marcar como inactivo en Science Chago
  await sincronizarClienteAScienceChago(cliente, true);
}
```

---

### Caso 2: Webhook Individual - Crear/Actualizar Sucursal

⚠️ **IMPORTANTE**: Este webhook debe enviar **SOLO la sucursal afectada**, no todas.

Cuando se crea o actualiza UNA sucursal en tu sistema, ejecuta:

```javascript
async function sincronizarSucursalAScienceChago(sucursal) {
  try {
    const response = await fetch('https://admin.scienceinmotion.com.mx/api/integration/sync/sucursales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'science-chago-api-integration-key-2026'
      },
      body: JSON.stringify({
        sucursales: [  // Array con SOLO 1 sucursal
          {
            id: sucursal.id,                // Tu ID interno (REQUERIDO)
            name: sucursal.nombre,          // REQUERIDO
            direccion: sucursal.direccion || '',
            telefono: sucursal.telefono || '',
            email: sucursal.email || '',
            ciudad: sucursal.ciudad || '',
            codigoPostal: sucursal.codigoPostal || ''
          }
        ]
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Sucursal sincronizada con Science Chago:', data.results);
    } else {
      console.error('❌ Error al sincronizar sucursal:', data.error);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error de conexión con Science Chago:', error);
    throw error;
  }
}
```

**Integración en tu código:**

```javascript
// En tu modelo/controlador de Sucursal

// Después de crear sucursal
async afterCreate(sucursal) {
  // Tu lógica actual...
  
  // Sincronizar con Science Chago (solo esta sucursal)
  await sincronizarSucursalAScienceChago(sucursal);
}

// Después de actualizar sucursal
async afterUpdate(sucursal) {
  // Tu lógica actual...
  
  // Sincronizar con Science Chago (solo esta sucursal)
  await sincronizarSucursalAScienceChago(sucursal);
}
```

---

## 🔄 Sincronización Masiva (Solo para Carga Inicial o Manual)

⚠️ **NOTA**: Esta sincronización masiva es SOLO para:
- Carga inicial de datos existentes (una sola vez)
- Sincronización manual ocasional
- Reconciliación de datos

**NO uses esto en webhooks automáticos** de creación/actualización individual.

### Sincronizar Todos los Clientes Existentes (Una Sola Vez)

```javascript
async function sincronizarTodosLosClientes() {
  // Obtener TODOS los clientes de tu base de datos
  const clientes = await obtenerTodosLosClientes();
  
  // Dividir en lotes de 50 para no saturar
  const lotes = [];
  for (let i = 0; i < clientes.length; i += 50) {
    lotes.push(clientes.slice(i, i + 50));
  }
  
  for (const lote of lotes) {
    const clientesFormateados = lote.map(cliente => ({
      id: cliente.id,
      nombre: cliente.nombre,
      apellidoPaterno: cliente.apellidoPaterno,
      apellidoMaterno: cliente.apellidoMaterno || '',
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      fechaNacimiento: cliente.fechaNacimiento || '',
      genero: cliente.genero || '',
      ocupacion: cliente.ocupacion || '',
      numeroExpediente: cliente.numeroExpediente || '',
      sucursal: cliente.sucursalId,
      tipo: cliente.tipo || 'cliente',
      activo: cliente.activo !== undefined ? cliente.activo : true,
      direccion: {
        calle: cliente.direccion?.calle || '',
        numero: cliente.direccion?.numero || '',
        colonia: cliente.direccion?.colonia || '',
        ciudad: cliente.direccion?.ciudad || '',
        estado: cliente.direccion?.estado || '',
        codigoPostal: cliente.direccion?.codigoPostal || ''
      }
    }));
    
    const response = await fetch('https://admin.scienceinmotion.com.mx/api/integration/sync/clientes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'science-chago-api-integration-key-2026'
      },
      body: JSON.stringify({ clientes: clientesFormateados })
    });
    
    const data = await response.json();
    console.log(`Lote sincronizado: ${data.results.created} creados, ${data.results.updated} actualizados`);
    
    // Esperar 1 segundo entre lotes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Ejecutar una sola vez
sincronizarTodosLosClientes();
```

### Sincronizar Todas las Sucursales Existentes (Una Sola Vez)

```javascript
async function sincronizarTodasLasSucursales() {
  const sucursales = await obtenerTodasLasSucursales();
  
  const sucursalesFormateadas = sucursales.map(sucursal => ({
    id: sucursal.id,
    name: sucursal.nombre,
    direccion: sucursal.direccion || '',
    telefono: sucursal.telefono || '',
    email: sucursal.email || '',
    ciudad: sucursal.ciudad || '',
    codigoPostal: sucursal.codigoPostal || ''
  }));
  
  const response = await fetch('https://admin.scienceinmotion.com.mx/api/integration/sync/sucursales', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'science-chago-api-integration-key-2026'
    },
    body: JSON.stringify({ sucursales: sucursalesFormateadas })
  });
  
  const data = await response.json();
  console.log('Sucursales sincronizadas:', data.results);
}

// Ejecutar una sola vez
sincronizarTodasLasSucursales();
```

---

## 🕐 Cron Job (Reconciliación Diaria - Opcional)

⚠️ **RECOMENDACIÓN**: Usa webhooks individuales (Caso 1 y 2) para sincronización en tiempo real.
Usa este cron solo como **reconciliación diaria** para capturar registros que no se sincronizaron por algún error.

```javascript
const cron = require('node-cron');

// Ejecutar diariamente a las 2am
cron.schedule('0 2 * * *', async () => {
  console.log('🔄 Iniciando reconciliación diaria con Science Chago...');
  
  try {
    // Obtener clientes modificados en las últimas 25 horas (con margen)
    const clientesModificados = await obtenerClientesModificadosDesde(new Date(Date.now() - 25 * 60 * 60 * 1000));
    
    if (clientesModificados.length > 0) {
      const clientesFormateados = clientesModificados.map(cliente => ({
        id: cliente.id,
        nombre: cliente.nombre,
        apellidoPaterno: cliente.apellidoPaterno,
        apellidoMaterno: cliente.apellidoMaterno || '',
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        fechaNacimiento: cliente.fechaNacimiento || '',
        genero: cliente.genero || '',
        ocupacion: cliente.ocupacion || '',
        numeroExpediente: cliente.numeroExpediente || '',
        sucursal: cliente.sucursalId,
        tipo: cliente.tipo || 'cliente',
        activo: cliente.activo !== undefined ? cliente.activo : true,
        direccion: {
          calle: cliente.direccion?.calle || '',
          numero: cliente.direccion?.numero || '',
          colonia: cliente.direccion?.colonia || '',
          ciudad: cliente.direccion?.ciudad || '',
          estado: cliente.direccion?.estado || '',
          codigoPostal: cliente.direccion?.codigoPostal || ''
        }
      }));
      
      const response = await fetch('https://admin.scienceinmotion.com.mx/api/integration/sync/clientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'science-chago-api-integration-key-2026'
        },
        body: JSON.stringify({ clientes: clientesFormateados })
      });
      
      const data = await response.json();
      console.log(`✅ Sincronizados ${clientesModificados.length} clientes:`, data.results);
    }
    
    // Lo mismo para sucursales
    const sucursalesModificadas = await obtenerSucursalesModificadasDesde(new Date(Date.now() - 25 * 60 * 60 * 1000));
    
    if (sucursalesModificadas.length > 0) {
      const sucursalesFormateadas = sucursalesModificadas.map(sucursal => ({
        id: sucursal.id,
        name: sucursal.nombre,
        direccion: sucursal.direccion || '',
        telefono: sucursal.telefono || '',
        email: sucursal.email || '',
        ciudad: sucursal.ciudad || '',
        codigoPostal: sucursal.codigoPostal || ''
      }));
      
      const response = await fetch('https://admin.scienceinmotion.com.mx/api/integration/sync/sucursales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'science-chago-api-integration-key-2026'
        },
        body: JSON.stringify({ sucursales: sucursalesFormateadas })
      });
      
      const data = await response.json();
      console.log(`✅ Sincronizadas ${sucursalesModificadas.length} sucursales:`, data.results);
    }
    
  } catch (error) {
    console.error('❌ Error en reconciliación diaria:', error);
  }
});

console.log('⏰ Cron job de reconciliación iniciado (diario a las 2am)');
```

---

## ✅ Validaciones Requeridas

### Campos Obligatorios de Cliente:
- ✅ `id` - Tu ID interno
- ✅ `nombre` - Nombre del cliente
- ✅ `apellidoPaterno` - Apellido paterno
- ✅ `sucursal` - ID de la sucursal

### Manejo de Clientes Eliminados:
- ✅ `activo` - Opcional, por defecto `true`
- Cuando elimines/desactives un cliente, envía `activo: false`
- Los clientes con `activo: false` aparecerán marcados como inactivos en Science Chago

### Campos Obligatorios de Sucursal:
- ✅ `id` - Tu ID interno
- ✅ `name` - Nombre de la sucursal

### Formato de Email:
Si incluyes email, debe ser un formato válido (ejemplo@dominio.com)

### Formato de Fecha:
Las fechas deben estar en formato ISO: `YYYY-MM-DD` (ejemplo: "1990-01-15")

---

## 🧪 Pruebas

### Probar Sincronización de Cliente Individual

```bash
curl -X POST "https://admin.scienceinmotion.com.mx/api/integration/sync/clientes" \
  -H "Content-Type: application/json" \
  -H "x-api-key: science-chago-api-integration-key-2026" \
  -d '{
    "clientes": [
      {
        "id": "test-cliente-001",
        "nombre": "Juan",
        "apellidoPaterno": "Pérez",
        "apellidoMaterno": "García",
        "email": "juan.perez@test.com",
        "telefono": "5512345678",
        "sucursal": "valquirico",
        "tipo": "cliente",
        "activo": true
      }
    ]
  }'
```

### Probar Sincronización de Sucursal Individual

```bash
curl -X POST "https://admin.scienceinmotion.com.mx/api/integration/sync/sucursales" \
  -H "Content-Type: application/json" \
  -H "x-api-key: science-chago-api-integration-key-2026" \
  -d '{
    "sucursales": [
      {
        "id": "test-sucursal-001",
        "name": "Sucursal Test",
        "direccion": "Av. Test #123",
        "telefono": "5512345678",
        "email": "test@sucursal.com",
        "ciudad": "CDMX",
        "codigoPostal": "01000"
      }
    ]
  }'
```

---

## 📊 Respuestas Esperadas

### Éxito (200 OK):
```json
{
  "success": true,
  "results": {
    "created": 5,
    "updated": 10,
    "errors": []
  },
  "message": "Sincronización completada: 5 creados, 10 actualizados, 0 errores"
}
```

### Error de Validación (400):
```json
{
  "success": false,
  "error": "Errores de validación en los datos de clientes",
  "validationErrors": [
    {
      "index": 0,
      "clienteId": "cliente-001",
      "errors": ["El nombre es requerido"]
    }
  ]
}
```

### Error de Autenticación (401):
```json
{
  "success": false,
  "error": "API key inválida"
}
```

---

## 🏗️ Arquitectura Recomendada

### Flujo de Sincronización

```
┌─────────────────────┐
│  Tu Sistema         │
└──────────┬──────────┘
           │
           │ (1) Evento: Cliente creado/actualizado/eliminado
           ▼
┌─────────────────────┐
│  Webhook Individual │ ◄─── Envía SOLO 1 cliente
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Science Chago API  │
│  /sync/clientes     │
└─────────────────────┘

┌─────────────────────┐
│  Cron Diario 2am    │ ◄─── Reconciliación de datos perdidos
└──────────┬──────────┘
           │
           │ (2) Sincronización masiva de registros modificados ayer
           ▼
┌─────────────────────┐
│  Science Chago API  │
│  /sync/clientes     │
└─────────────────────┘
```

### Ventajas de este Modelo

✅ **Webhooks Individuales**: 
- Sincronización en tiempo real
- Envío eficiente (solo 1 registro por petición)
- Bajo consumo de recursos
- No requiere consultar toda la base de datos

✅ **Cron Diario**:
- Recupera registros perdidos por errores temporales
- Reconcilia datos inconsistentes
- Se ejecuta en horario de baja carga (2am)
- Funciona como backup de los webhooks

---

## 🔒 Seguridad

1. **Nunca** expongas la API key en código del frontend
2. **Siempre** usa HTTPS (https://)
3. La API key debe estar en variables de entorno:
   ```
   SCIENCE_CHAGO_API_KEY=science-chago-api-integration-key-2026
   ```

---

## 📞 Soporte

Si tienes problemas con la integración:
1. Verifica que la API key sea correcta
2. Confirma que estás usando HTTPS
3. Revisa los logs de tu servidor
4. Verifica que los campos requeridos estén presentes
5. **Importante**: Confirma que los webhooks individuales envíen solo 1 registro

---

**Última actualización:** 21 de enero de 2026
