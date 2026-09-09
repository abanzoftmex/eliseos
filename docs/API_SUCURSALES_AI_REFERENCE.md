# Documentación Técnica: API de Sucursales (Referencia para IA)

Este documento describe la arquitectura y funcionamiento de los endpoints de la API de Sucursales (`/api/sucursales`). Está diseñado para proporcionar contexto técnico completo a agentes de IA.

## Endpoint: Listado de Sucursales (`GET /api/sucursales`)

Este endpoint proporciona un listado centralizado de todas las sucursales operativas de la organización. Su objetivo principal es alimentar selectores, filtros y lógica de negocio dependiente de la ubicación.

### Comportamiento
- **Conexión**: Consulta directa a la colección `sucursales` de Firestore.
- **Ordenamiento**: Ascendente por campo `name`.
- **Sin Paginación**: Se asume (por regla de negocio) que el número de sucursales es bajo (< 50), por lo que siempre retorna la lista completa.

### Respuesta Exitosa (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "cdmx",
      "name": "Ciudad de México",
      "direccion": "Av. Reforma...",
      "telefono": "555..."
    },
    {
      "id": "valquirico",
      "name": "Valquirico",
      // ...
    }
  ],
  "count": 2
}
```

### Manejo de Errores
- **500 Internal Server Error**: Si falla la conexión a Firestore.
- **405 Method Not Allowed**: Si se intenta usar otro verbo HTTP que no sea GET.

---

## Notas para el Desarrollador/Agente IA

1.  **Uso en Frontend**:
    - Este endpoint debe sustituir gradualmente a las consultas directas (HARDCODED) en `src/store/sucursalStore.js` o componentes individuales.
    - Ideal para poblar el `useSucursalStore` durante la inicialización de la app.

2.  **Escalabilidad**:
    - Si en el futuro se requieren configuraciones específicas por sucursal (ej. horarios, inventarios habilitados), este endpoint es el lugar correcto para expandir el modelo de datos sin romper los clientes actuales.

3.  **Seguridad**:
    - Actualmente es público (dentro de la sesión autenticada). Si se requiere restringir visibilidad por rol de usuario (ej. un recepcionista que solo vea SU sucursal), la lógica de filtrado debe implementarse aquí antes de retornar la respuesta.
