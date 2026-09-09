const BASE_URL = process.env.NEXT_PUBLIC_SCIENCE_CHAGO_URL || 'https://admin.scienceinmotion.com.mx';
const API_KEY = process.env.NEXT_PUBLIC_SCIENCE_CHAGO_API_KEY || 'science-chago-api-integration-key-2026';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { type, data, esEliminacion } = req.body;

    console.log('🔔 Sync trigger llamado con:', {
        type,
        clienteId: data?.id,
        sucursales: data?.sucursales,
        esEliminacion
    });

    if (!data || !data.id) {
        return res.status(400).json({ error: 'Missing data or ID' });
    }

    try {
        let result;

        if (type === 'cliente') {
            // Construir payload directamente aquí para evitar problemas de caché
            const sucursalesArray = Array.isArray(data.sucursales) 
                ? data.sucursales 
                : (data.sucursal ? [data.sucursal] : []);
            
            console.log('📦 Sucursales a enviar:', sucursalesArray);

            const payload = {
                clientes: [{
                    id: data.id,
                    nombre: data.nombre,
                    apellidoPaterno: data.apellidoPaterno,
                    apellidoMaterno: data.apellidoMaterno || '',
                    email: data.email || '',
                    telefono: data.telefonoContacto || data.telefono || '',
                    fechaNacimiento: data.fechaNacimiento || '',
                    genero: data.genero || '',
                    ocupacion: data.ocupacion || '',
                    numeroExpediente: data.numeroExpediente || '',
                    sucursales: sucursalesArray,
                    tipo: data.tipo || 'cliente',
                    activo: esEliminacion ? false : (data.activo !== undefined ? data.activo : true),
                    direccion: data.direccion || {}
                }]
            };

            console.log('📤 Payload completo:', JSON.stringify(payload, null, 2));

            const syncUrl = `${BASE_URL}/api/integration/sync/clientes`;
            console.log('🌐 Llamando a:', syncUrl);

            const response = await fetch(syncUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': API_KEY
                },
                body: JSON.stringify(payload)
            });

            // Verificar si la respuesta es OK
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error en respuesta:', response.status, errorText);
                return res.status(200).json({ 
                    success: false, 
                    warning: `Sync externo falló (${response.status}): ${errorText.substring(0, 200)}`,
                    localUpdate: true
                });
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
            } else {
                const text = await response.text();
                console.log('📄 Respuesta no-JSON:', text.substring(0, 200));
                result = { success: true, message: 'Sync completado (respuesta no-JSON)' };
            }
            console.log('✅ Resultado:', result);
        } else if (type === 'sucursal') {
            const { syncSucursalToScienceChago } = require('../../../../lib/scienceChago');
            result = await syncSucursalToScienceChago(data);
        } else {
            return res.status(400).json({ error: 'Invalid type' });
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error('Sync Proxy Error:', error.message, error.cause || '');
        // En lugar de fallar con 500, devolver éxito parcial
        // ya que el cliente SÍ se guardó en Firebase
        return res.status(200).json({ 
            success: false, 
            warning: `Sync externo no disponible: ${error.message}`,
            localUpdate: true
        });
    }
}
