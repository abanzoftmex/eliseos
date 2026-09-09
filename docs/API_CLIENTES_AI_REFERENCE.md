# Documentación Técnica: API de Clientes (Referencia para IA)

Este documento describe la arquitectura y funcionamiento de los endpoints de la API de Clientes (`/api/clientes`). Está diseñado para proporcionar contexto técnico completo a agentes de IA que necesiten interactuar con, refactorizar o extender este módulo.

## Estructura de Archivos

El módulo se ha refactorizado para seguir una estructura RESTful en Next.js:

- **`src/pages/api/clientes/index.js`**: Maneja el listado, filtrado y búsqueda de clientes. Soporta modos "simple" y "detallado".
- **`src/pages/api/clientes/[id].js`**: Maneja operaciones CRUD sobre un cliente específico (GET, PUT, DELETE).

---

## Endpoint: Listado de Clientes (`GET /api/clientes`)

Este endpoint es multimodal. Su comportamiento cambia drásticamente dependiendo del parámetro `simple`.

### Parámetros de Query

| Parámetro  | Tipo     | Default    | Descripción |
|------------|----------|------------|-------------|
| `simple`   | `boolean`| `false`    | **CRÍTICO**. Si es `true`, activa el "Modo Simple" (sin paginación, datos ligeros). |
| `search`   | `string` | `''`       | Término de búsqueda (filtra por nombre, email, ocupación, expediente). |
| `page`     | `number` | `1`        | Número de página (solo en Modo Normal). |
| `pageSize` | `number` | `12`       | Elementos por página (solo en Modo Normal). |
| `sucursal` | `string` | `''`       | ID de la sucursal o 'todas'. |
| `tipo`     | `string` | `''`       | 'atleta', 'cliente' o 'todos'. |
| `sortBy`   | `string` | `'nombre'` | Campo de ordenamiento ('nombre' o 'numeroExpediente'). |

### 1. Modo Simple (`simple=true`)
Diseñado para selectores, autocompletados y componentes de UI que necesitan velocidad. 
- **Comportamiento**: Recupera **TODOS** los clientes de la colección `clientes`.
- **Exclusiones**: NO realiza joins con otras colecciones (como consultas). NOpagina.
- **Respuesta**:
```json
{
  "success": true,
  "data": [
    {
      "id": "docId",
      "nombre": "Juan",
      "apellidoPaterno": "Pérez",
      // ...campos básicos solamente
    }
  ],
  "count": 150
}
```

### 2. Modo Normal (`simple=false`)
Diseñado para la vista principal de gestión de directorio. Es pesado en procesamiento.
- **Lógica de Población (Population)**: Para CADA cliente recuperado, realiza una sub-consulta a la colección `consultas` para encontrar la **última consulta** (completada o borrador).
- **Atributo `ultimaConsulta`**: Se inyecta al objeto cliente. Contiene diagnóstico, objetivo y el estado real del paciente.
- **Filtrado en Memoria**: Debido a las limitaciones de Firestore con queries complejas (OR conditions), gran parte del filtrado (search, sucursal múltiple) se realiza en servidor (Node.js) después de obtener datos iniciales.
- **Paginación Manual**: La paginación se aplica sobre el array filtrado en memoria (`resultData.slice`).

---

## Endpoint: Operaciones Individuales (`/api/clientes/[id]`)

### Eliminación en Cascada (`DELETE`)
Este es un proceso crítico y destructivo. No solo elimina al documento en `clientes`, sino que asegura la integridad referencial eliminando documentos huérfanos en **7 colecciones relacionadas**.

**Flujo de Eliminación**:
1. Verifica existencia del usuario.
2. Ejecuta `Promise.all` para eliminar documentos en:
   - `consultas`
   - `consultasNormales` (legacy/drafts)
   - `consultasDeportivas` (legacy/drafts)
   - `paquetes`
   - `citas`
   - `historialClinico`
3. **Actualización de Arrays**: Busca en `clases` donde el ID esté en `participantes` array y lo remueve (updateDoc), no elimina la clase.
4. Finalmente, elimina el documento `clientes/{id}`.

### Detalles de Implementación
- **Dependencias**: Firebase Admin SDK (`db` importada de `lib/firebase`).
- **Seguridad**: Validar siempre `req.method`.
- **Performance**: Usar `Promise.all` para operaciones concurrentes en Firestore siempre que sea posible.

---

## Notas para el Desarrollador/Agente IA
- **Búsqueda**: Actualmente es una búsqueda lineal en memoria (`filter` en JS). Si la base de datos crece >2000 usuarios, considerar migrar a Algolia o usar índices compuestos específicos en Firestore.
- **Indexación**: El ordenamiento por `numeroExpediente` hace un cast inteligente de string a int para ordenar correctamente "10" después de "2".
- **Estado**: El estado de un cliente (activo/inactivo/paciente) se infiere dinámicamente basado en la existencia de `ultimaConsulta`.
