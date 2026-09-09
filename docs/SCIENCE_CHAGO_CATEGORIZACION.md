# Categorización Automática de Ventas en Science Chago

## Problema Resuelto
Las ventas de Science Motion se sincronizaban a Science Chago sin los campos `generalId` y `subconceptId`, apareciendo como "General: No especificado" y "Subconcepto: No especificado".

## Solución Implementada

### 1. Sistema de Cache de Categorías
Se agregó un sistema que consulta y almacena el ID del general "Ventas" al iniciar la aplicación:

```javascript
// En lib/scienceChago.js
let VENTAS_GENERAL_ID = null;

export async function inicializarCategorias() {
  const response = await fetch(`${BASE_URL}/api/generales?type=entrada`);
  const data = await response.json();
  
  if (data.success) {
    const ventasGeneral = data.data?.find(g => g.name === 'Ventas');
    if (ventasGeneral) {
      VENTAS_GENERAL_ID = ventasGeneral.id;
    }
  }
}
```

### 2. Actualización de createIngresoInScienceChago
La función ahora incluye los campos requeridos:

```javascript
export async function createIngresoInScienceChago({ 
  externalId, 
  sucursalId, 
  clienteId, 
  amount, 
  date, 
  concepto, 
  description,
  generalId,      // ← NUEVO
  subconceptId    // ← NUEVO
}) {
  // Si no tenemos el ID del general, consultarlo
  if (!VENTAS_GENERAL_ID && !generalId) {
    await inicializarCategorias();
  }

  const payload = {
    action: 'ingreso',
    externalId,
    sucursalId,
    clienteId,
    amount,
    date,
    concepto,
    description,
    generalId: generalId || VENTAS_GENERAL_ID,  // Usar "Ventas" por defecto
    subconceptId: subconceptId || null           // Sin subconcepto
  };
  
  // ... resto del código
}
```

### 3. Inicialización en Punto de Venta
Se agregó la llamada a `inicializarCategorias()` al cargar la página:

```javascript
// En src/pages/punto-de-venta/index.js
useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      // Inicializar categorías de Science Chago
      await inicializarCategorias();
      
      // ... resto de la carga de datos
    } catch (error) {
      toast.error('Error al cargar datos');
    }
  };
  fetchData();
}, []);
```

## Resultado Esperado

### Antes
```json
{
  "general": "No especificado",
  "subconcepto": "No especificado",
  "concepto": "Matcha, Agua, Vainilla Chai"
}
```

### Después
```json
{
  "general": "Ventas",
  "generalId": "abc123...",
  "subconcepto": "- Nada -",
  "subconceptId": null,
  "concepto": "Matcha, Agua, Vainilla Chai"
}
```

## Flujo de Categorización

1. **Al iniciar la aplicación** (Punto de Venta):
   - Se llama `inicializarCategorias()`
   - Se consulta `GET /api/generales?type=entrada` en Science Chago
   - Se busca y almacena el ID del general "Ventas"

2. **Al crear una venta**:
   - Se genera el `externalId` único
   - Se construye el `concepto` con nombres de productos
   - Se llama `createIngresoInScienceChago()` con todos los datos
   - Si `VENTAS_GENERAL_ID` no está cargado, se vuelve a consultar
   - Se envía el payload completo con `generalId` y `subconceptId: null`

3. **En Science Chago**:
   - La transacción se registra con el general "Ventas"
   - Aparece correctamente categorizada en reportes
   - El subconcepto queda como "- Nada -" (null)

## Archivos Modificados

- `/lib/scienceChago.js`:
  - Agregada variable `VENTAS_GENERAL_ID`
  - Agregada función `inicializarCategorias()`
  - Agregada función `getVentasGeneralId()`
  - Actualizada función `createIngresoInScienceChago()` para incluir `generalId` y `subconceptId`

- `/src/pages/punto-de-venta/index.js`:
  - Importado `inicializarCategorias`
  - Agregada llamada en `useEffect` de carga inicial

## Uso en Otros Módulos

### Para Asignación de Paquetes
El mismo sistema aplica automáticamente para la asignación de paquetes en `/lib/firebase/packagesService.js`, donde también se usa `createIngresoInScienceChago()`.

### Para Nuevos Tipos de Transacciones
Si necesitas usar otra categoría general:

```javascript
import { inicializarCategorias } from '@/lib/scienceChago';

// Opción 1: Usar el general "Ventas" por defecto
await createIngresoInScienceChago({
  // ... datos básicos
});

// Opción 2: Especificar un general diferente
await createIngresoInScienceChago({
  // ... datos básicos
  generalId: 'otro-general-id',
  subconceptId: 'subconcepto-especifico-id'
});
```

## Verificación

Para verificar que está funcionando:

1. **Revisar consola del navegador** al cargar Punto de Venta:
   ```
   🔄 Consultando categorías de Science Chago...
   ✅ General "Ventas" encontrado: [ID_DEL_GENERAL]
   ```

2. **Revisar consola al hacer una venta**:
   ```
   📤 Enviando ingreso a Science Chago: {
     ...
     generalId: "[ID_DEL_GENERAL]",
     subconceptId: null
   }
   ```

3. **Verificar en Science Chago**:
   - Las transacciones deben aparecer con "General: Ventas"
   - El subconcepto debe ser "- Nada -"
   - El concepto debe tener los nombres de productos

## Notas Importantes

- Si Science Chago no está disponible, el sistema falla silenciosamente y no bloquea las ventas
- El `VENTAS_GENERAL_ID` se recarga automáticamente si no está disponible al crear una transacción
- Las ventas antiguas (antes de esta actualización) permanecen sin categoría
- El sistema es compatible con versiones anteriores de Science Chago
