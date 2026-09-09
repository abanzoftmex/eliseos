/**
 * GET /api/planes/tipos
 * Obtiene el catálogo de tipos de planes
 * 
 * Headers:
 *   x-api-key: API key para autenticación
 * 
 * Response:
 *   {
 *     success: boolean,
 *     tipos: Array<string>
 *   }
 */
export default async function handler(req, res) {
  // Solo permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Método no permitido. Use GET.' 
    });
  }

  // Validar API Key
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.NEXT_PUBLIC_SCIENCE_CHAGO_API_KEY || 'science-chago-api-integration-key-2026';
  
  if (apiKey !== expectedKey) {
    return res.status(401).json({ 
      success: false, 
      error: 'API key inválida o faltante' 
    });
  }

  try {
    // Tipos de planes según tu sistema (valores que están en la BD)
    const tipos = [
      'grupal',
      'personalizado',
      'sesion'
    ];

    return res.status(200).json({
      success: true,
      tipos
    });

  } catch (error) {
    console.error('Error fetching plan tipos:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener los tipos de planes',
      details: error.message
    });
  }
}
