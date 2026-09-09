/**
 * Science Chago Integration Service
 * Handles synchronization of data to the external admin system.
 */

const BASE_URL = process.env.NEXT_PUBLIC_SCIENCE_CHAGO_URL || 'https://admin.scienceinmotion.com.mx';
const API_KEY = process.env.NEXT_PUBLIC_SCIENCE_CHAGO_API_KEY || 'science-chago-api-integration-key-2026';

// Almacenar el ID del general "Ventas" globalmente
let VENTAS_GENERAL_ID = null;

/**
 * Initialize categories by fetching the "Ventas" general ID from Science Chago
 * This should be called when the application starts
 * Fails silently if Science Chago is not available
 */
export async function inicializarCategorias() {
    try {
        console.log('🔄 Consultando categorías de Science Chago...');
        
        const response = await fetch(`${BASE_URL}/api/generales?type=entrada`, {
            headers: {
                'x-api-key': API_KEY
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Buscar el general "Ventas"
            const ventasGeneral = data.data?.find(g => g.name === 'Ventas');
            
            if (ventasGeneral) {
                VENTAS_GENERAL_ID = ventasGeneral.id;
                console.log('✅ General "Ventas" encontrado:', VENTAS_GENERAL_ID);
            } else {
                console.warn('⚠️ No se encontró el general "Ventas". Se creará automáticamente.');
            }
        }
    } catch (error) {
        // Fallar silenciosamente - no bloquear la aplicación
        console.warn('⚠️ Science Chago no disponible para consultar categorías:', error.message);
        console.warn('   Las ventas se sincronizarán sin categoría (se creará automáticamente)');
    }
}

/**
 * Get the cached Ventas general ID
 */
export function getVentasGeneralId() {
    return VENTAS_GENERAL_ID;
}


/**
 * Synchronize a client to Science Chago
 * @param {Object} cliente - Client data object
 * @param {boolean} esEliminacion - Whether the client is being deleted/deactivated (default: false)
 */
export async function syncClienteToScienceChago(cliente, esEliminacion = false) {
    console.log('🎨 INICIO syncClienteToScienceChago - cliente.id:', cliente?.id, 'sucursales:', cliente?.sucursales);
    
    // If no API key is set (and we aren't using the default for some reason), warn and skip
    // But here we use the hardcoded one from instructions if env var is missing for safety in this demo

    try {
        console.log('📋 Datos del cliente recibidos para sync:', {
            id: cliente.id,
            sucursales: cliente.sucursales,
            hasArraySucursales: Array.isArray(cliente.sucursales),
            sucursalesLength: cliente.sucursales?.length
        });

        const sucursalesArray = Array.isArray(cliente.sucursales) 
            ? cliente.sucursales 
            : (cliente.sucursal ? [cliente.sucursal] : []);

        const payload = {
            clientes: [
                {
                    id: cliente.id || cliente.uid,           // Ensure we have an ID
                    nombre: cliente.nombre,
                    apellidoPaterno: cliente.apellidoPaterno,
                    apellidoMaterno: cliente.apellidoMaterno || '',
                    email: cliente.email || '',
                    telefono: cliente.telefonoContacto || cliente.telefono || '',
                    fechaNacimiento: cliente.fechaNacimiento || '',
                    genero: cliente.genero || '',
                    ocupacion: cliente.ocupacion || '',
                    numeroExpediente: cliente.numeroExpediente || '',
                    sucursales: sucursalesArray,
                    sucursal: sucursalesArray[0] || '',
                    tipo: cliente.tipo || 'cliente',
                    activo: esEliminacion ? false : (cliente.activo !== undefined ? cliente.activo : true),
                    direccion: {
                        calle: cliente.direccion?.calle || '',
                        numero: cliente.direccion?.numero || '',
                        colonia: cliente.direccion?.colonia || '',
                        ciudad: cliente.direccion?.ciudad || '',
                        estado: cliente.direccion?.estado || '',
                        codigoPostal: cliente.direccion?.codigoPostal || ''
                    }
                }
            ],
            esEliminacion
        };

        console.log('🔄 Syncing Client to Science Chago:', cliente.id, esEliminacion ? '(DELETION)' : '(UPDATE/CREATE)');
        console.log('📤 Payload que se enviará:', JSON.stringify(payload, null, 2));

        const response = await fetch(`${BASE_URL}/api/integration/sync/clientes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Client synced successfully:', data.results);
        } else {
            console.error('❌ Failed to sync client:', data.error);
        }

        return data;
    } catch (error) {
        console.error('❌ Connection error with Science Chago:', error);
        // Don't throw, just log error so we don't break the main flow
        return { success: false, error: error.message };
    }
}

/**
 * Synchronize a a branch (sucursal) to Science Chago
 * @param {Object} sucursal - Sucursal data object
 */
export async function syncSucursalToScienceChago(sucursal) {
    try {
        const payload = {
            sucursales: [
                {
                    id: sucursal.id,
                    name: sucursal.name || sucursal.nombre, // Handle both naming conventions
                    direccion: sucursal.address || sucursal.direccion || '',
                    telefono: sucursal.phone || sucursal.telefono || '',
                    email: sucursal.email || '',
                    ciudad: sucursal.ciudad || '',
                    codigoPostal: sucursal.codigoPostal || ''
                }
            ]
        };

        console.log('🔄 Syncing Sucursal to Science Chago:', sucursal.id);

        const response = await fetch(`${BASE_URL}/api/integration/sync/sucursales`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Sucursal synced successfully:', data.results);
        } else {
            console.error('❌ Failed to sync sucursal:', data.error);
        }

        return data;
    } catch (error) {
        console.error('❌ Connection error with Science Chago:', error);
        return { success: false, error: error.message };
    }
}
/**
 * Generate a unique external ID for transactions
 * Format: sim-{timestamp}-{random}
 */
export function generateTransactionExternalId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `sim-${timestamp}-${random}`;
}

/**
 * Create an "ingreso" (income) transaction in Science Chago when a package is assigned
 * @param {Object} options - Transaction options
 * @param {string} options.externalId - Unique ID from this system (assignment ID)
 * @param {string} options.sucursalId - Branch ID (default: 'valquirico')
 * @param {string} options.clienteId - Client/User ID
 * @param {number} options.amount - Amount of the transaction
 * @param {string} options.date - Date in format YYYY-MM-DD
 * @param {string} options.concepto - Concept/name of the transaction (e.g., package name)
 * @param {string} options.description - Description of the transaction
 * @param {string} options.generalId - (Optional) General category ID. If not provided, uses "Ventas"
 * @param {string} options.subconceptId - (Optional) Subconcepto ID. Defaults to null
 */
export async function createIngresoInScienceChago({ externalId, sucursalId = 'valquirico', clienteId, amount, date, concepto, description, generalId, subconceptId = null }) {
    try {
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
            generalId: generalId || VENTAS_GENERAL_ID,  // Usar el general "Ventas" por defecto
            subconceptId: subconceptId                   // Sin subconcepto por defecto
        };

        console.log('🔄 Creating Ingreso in Science Chago:', externalId);
        console.log('📤 Payload:', JSON.stringify(payload, null, 2));

        // Use local API proxy to avoid CORS issues
        const response = await fetch('/api/integration/transacciones', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success || response.ok) {
            console.log('✅ Ingreso created successfully:', data);
        } else {
            console.warn('⚠️ Failed to create ingreso:', data.error || data);
        }

        return data;
    } catch (error) {
        // Silently handle connection errors - don't break the main flow
        console.warn('⚠️ Science Chago unavailable:', error.message);
        return { success: false, error: error.message, skipped: true };
    }
}

/**
 * Server-side variant of createIngresoInScienceChago.
 *
 * createIngresoInScienceChago() above does fetch('/api/integration/transacciones'),
 * a RELATIVE URL that only resolves inside the browser. From a Next.js API route
 * (e.g. the Stripe webhook, which runs in Node) that throws "Failed to parse URL".
 * This version talks to Science Chago directly server-to-server, mirroring the
 * proxy in /api/integration/transacciones.js, so it is safe to call from the server.
 *
 * @param {Object} options
 * @param {string} options.externalId - Unique ID from this system (e.g. Stripe session id)
 * @param {string} options.sucursalId - Branch ID (default: 'valquirico')
 * @param {string} options.clienteId  - Client/User ID (same ID used when syncing the client)
 * @param {number} options.amount     - Amount of the transaction
 * @param {string} options.date       - Date in format YYYY-MM-DD
 * @param {string} options.concepto   - Concept/name of the transaction
 * @param {string} options.description- Description of the transaction
 * @param {string} [options.generalId]- Optional general category ID (defaults to "Ventas")
 * @param {string} [options.subconceptId] - Optional subconcept ID
 */
export async function createIngresoInScienceChagoDirect({ externalId, sucursalId = 'valquirico', clienteId, amount, date, concepto, description, generalId = null, subconceptId = null }) {
    try {
        if (!VENTAS_GENERAL_ID && !generalId) {
            await inicializarCategorias();
        }

        const payload = {
            externalId,
            sucursalId,
            clienteId,
            amount,
            date,
            concepto,
            description,
            generalId: generalId || VENTAS_GENERAL_ID,
            subconceptId,
        };

        const response = await fetch(`${BASE_URL}/api/integration/sync/transacciones/ingreso`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));

        if (data.success || response.ok) {
            console.log('✅ Ingreso (server) created in Science Chago:', externalId);
        } else {
            console.warn('⚠️ Failed to create ingreso (server):', data.error || `HTTP ${response.status}`);
        }

        return data;
    } catch (error) {
        // Silently handle connection errors - don't break the payment flow
        console.warn('⚠️ Science Chago unavailable (server):', error.message);
        return { success: false, error: error.message, skipped: true };
    }
}

/**
 * Delete a transaction in Science Chago by external ID
 * @param {string} externalId - The external ID of the transaction to delete
 * @param {string} reason - Reason for deletion (optional)
 */
export async function deleteTransactionInScienceChago(externalId, reason = 'Paquete desasignado') {
    try {
        console.log('🔄 Deleting transaction in Science Chago:', externalId);

        // Use local API proxy to avoid CORS issues
        const url = new URL('/api/integration/transacciones', window.location.origin);
        url.searchParams.append('externalId', externalId);
        if (reason) {
            url.searchParams.append('reason', reason);
        }

        const response = await fetch(url.toString(), {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success || response.ok) {
            console.log('✅ Transaction deleted successfully:', data);
        } else {
            console.warn('⚠️ Failed to delete transaction:', data.error || data);
        }

        return data;
    } catch (error) {
        // Silently handle connection errors - don't break the main flow
        console.warn('⚠️ Science Chago unavailable for deletion:', error.message);
        return { success: false, error: error.message, skipped: true };
    }
}
