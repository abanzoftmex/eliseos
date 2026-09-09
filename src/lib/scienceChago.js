const SCIENCE_CHAGO_URL =
    process.env.SCIENCE_CHAGO_URL ||
    process.env.NEXT_PUBLIC_SCIENCE_CHAGO_URL ||
    'https://admin.scienceinmotion.com.mx';
const API_KEY =
    process.env.SCIENCE_CHAGO_API_KEY ||
    process.env.NEXT_PUBLIC_SCIENCE_CHAGO_API_KEY ||
    'science-chago-api-integration-key-2026';

async function parseScienceChagoResponse(response, endpointLabel) {
    const contentType = response.headers.get('content-type') || '';
    const rawBody = await response.text();

    if (!response.ok) {
        const preview = rawBody.substring(0, 200);
        throw new Error(`${endpointLabel} responded with ${response.status}: ${preview}`);
    }

    if (contentType.includes('application/json')) {
        return rawBody ? JSON.parse(rawBody) : { success: true };
    }

    if (contentType.includes('text/html')) {
        throw new Error(`${endpointLabel} devolvio HTML en lugar de JSON. Verifica que Science Chago este corriendo en ${SCIENCE_CHAGO_URL} y que el endpoint /api/integration/sync/* exista.`);
    }

    if (!rawBody) {
        return { success: true };
    }

    try {
        return JSON.parse(rawBody);
    } catch {
        throw new Error(`${endpointLabel} devolvio una respuesta no-JSON: ${rawBody.substring(0, 200)}`);
    }
}

/**
 * Sincroniza un cliente con Science Chago
 * @param {Object} clienteData - Datos del cliente
 * @param {boolean} isDeletion - Indica si es una eliminación (actualmente no documentada en endpoint, se envía como actualización por defecto, o se podría implementar lógica específica si el endpoint lo soportara)
 * @returns {Promise<Object>} Respuesta de la API
 */
export async function syncClienteToScienceChago(clienteData, isDeletion = false) {
    try {
        const sucursalesArray = Array.isArray(clienteData.sucursales)
            ? clienteData.sucursales
            : (clienteData.sucursal ? [clienteData.sucursal] : []);

        // Mapeo de datos según docs/INTEGRATION_DATA_MODELS.md
        const mappedCliente = {
            id: clienteData.id,
            nombre: clienteData.nombre,
            apellidoPaterno: clienteData.apellidoPaterno,
            apellidoMaterno: clienteData.apellidoMaterno || "",
            email: clienteData.email || "",
            telefono: clienteData.telefonoContacto || clienteData.telefono || "",
            fechaNacimiento: clienteData.fechaNacimiento || "",
            genero: clienteData.genero || "",
            ocupacion: clienteData.ocupacion || "",
            numeroExpediente: clienteData.numeroExpediente || "",
            sucursales: sucursalesArray,
            sucursal: sucursalesArray[0] || "",
            tipo: clienteData.tipo || "cliente",
            activo: isDeletion ? false : (clienteData.activo !== undefined ? clienteData.activo : true),
            direccion: {
                calle: clienteData.direccion?.calle || "",
                numero: clienteData.direccion?.numero || "",
                colonia: clienteData.direccion?.colonia || "",
                ciudad: clienteData.direccion?.ciudad || "",
                estado: clienteData.direccion?.estado || "",
                codigoPostal: clienteData.direccion?.codigoPostal || ""
            }
        };

        const payload = {
            clientes: [mappedCliente],
            esEliminacion: isDeletion
        };

        const response = await fetch(`${SCIENCE_CHAGO_URL}/api/integration/sync/clientes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify(payload)
        });

        return await parseScienceChagoResponse(response, 'Science Chago clientes API');

    } catch (error) {
        console.error('Error syncing client to Science Chago:', error);
        // No lanzamos el error para no romper el flujo principal de la app si la integración falla,
        // pero devolvemos un objeto de error para que el llamador lo sepa si quiere.
        return { success: false, error: error.message };
    }
}

/**
 * Sincroniza una sucursal con Science Chago
 * @param {Object} sucursalData - Datos de la sucursal
 * @returns {Promise<Object>} Respuesta de la API
 */
export async function syncSucursalToScienceChago(sucursalData) {
    try {
        // Mapeo de datos según docs/INTEGRATION_DATA_MODELS.md
        const mappedSucursal = {
            id: sucursalData.id,
            name: sucursalData.nombre || sucursalData.name, // Normalización de nombre
            direccion: sucursalData.direccion || "",
            telefono: sucursalData.telefono || "",
            email: sucursalData.email || "",
            ciudad: sucursalData.ciudad || "",
            codigoPostal: sucursalData.cp || sucursalData.codigoPostal || ""
        };

        const payload = {
            sucursales: [mappedSucursal]
        };

        const response = await fetch(`${SCIENCE_CHAGO_URL}/api/integration/sync/sucursales`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify(payload)
        });

        return await parseScienceChagoResponse(response, 'Science Chago sucursales API');

    } catch (error) {
        console.error('Error syncing sucursal to Science Chago:', error);
        return { success: false, error: error.message };
    }
}
