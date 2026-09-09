# Modelos de Datos para Integración con Science Chago

Este documento define la estructura exacta de los objetos JSON que son enviados al sistema externo "Science Chago" a través de los webhooks de sincronización.

---

## 📅 Modelo: Cliente

Cuando se sincroniza un cliente, se envía un array `clientes` conteniendo objetos con la siguiente estructura:

### Endpoint Destino
`POST /api/integration/sync/clientes`

### Estructura JSON

```json
{
  "clientes": [
    {
      "id": "string (UUID / Firestore ID)",       // [REQUERIDO] Identificador único e inmutable
      "nombre": "string",                         // [REQUERIDO] Nombre(s)
      "apellidoPaterno": "string",                // [REQUERIDO] Primer apellido
      "apellidoMaterno": "string",                // [OPCIONAL] Segundo apellido (cadena vacía si no existe)
      "email": "string",                          // [OPCIONAL] Correo electrónico
      "telefono": "string",                       // [OPCIONAL] Teléfono de contacto (móvil o fijo)
      "fechaNacimiento": "string (YYYY-MM-DD)",   // [OPCIONAL] Fecha en formato ISO 8601
      "genero": "string",                         // [OPCIONAL] "Masculino", "Femenino", "Otro", etc.
      "ocupacion": "string",                      // [OPCIONAL] Profesión o actividad
      "numeroExpediente": "string",               // [OPCIONAL] Identificador interno de expediente físico/digital
      "sucursal": "string (ID)",                  // [REQUERIDO] ID de la sucursal principal asignada
      "tipo": "string",                           // [OPCIONAL] "cliente" o "atleta" (default: "cliente")
      "direccion": {
        "calle": "string",                        // [OPCIONAL]
        "numero": "string",                       // [OPCIONAL]
        "colonia": "string",                      // [OPCIONAL]
        "ciudad": "string",                       // [OPCIONAL]
        "estado": "string",                       // [OPCIONAL]
        "codigoPostal": "string"                  // [OPCIONAL]
      }
    }
  ]
}
```

### Reglas de Negocio
1. **IDs Inmutables**: El campo `id` debe coincidir con el ID del documento en Firebase.
2. **Sucursal Principal**: Aunque el sistema origen soporte múltiples sucursales, para esta integración se envía solo la **primera sucursal** del array o el ID único si es singular.

---

## 🏢 Modelo: Sucursal

Cuando se sincroniza una sucursal, se envía un array `sucursales`.

### Endpoint Destino
`POST /api/integration/sync/sucursales`

### Estructura JSON

```json
{
  "sucursales": [
    {
      "id": "string (UUID / Firestore ID)", // [REQUERIDO] Identificador único
      "name": "string",                     // [REQUERIDO] Nombre comercial de la sucursal
      "direccion": "string",                // [OPCIONAL] Dirección completa en formato texto
      "telefono": "string",                 // [OPCIONAL] Teléfono de contacto de la sucursal
      "email": "string",                    // [OPCIONAL] Email de contacto administrativo
      "ciudad": "string",                   // [OPCIONAL] Ciudad de ubicación
      "codigoPostal": "string"              // [OPCIONAL] CP de ubicación
    }
  ]
}
```

### Reglas de Negocio
1. **Unidireccional**: La sincronización fluye desde el sistema local hacia Science Chago.
2. **Manejo de Nombres**: Se aceptan tanto `name` como `nombre` en la entrada, pero se normaliza a `name` para el sistema destino.

---

## 🔐 Autenticación y Headers

Todas las peticiones incluyen el siguiente header para seguridad:

```http
x-api-key: science-chago-api-integration-key-2026
Content-Type: application/json
```

---

_Documento generado automáticamente el 21 de enero de 2026_
