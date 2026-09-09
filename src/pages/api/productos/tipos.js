import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * GET /api/productos/tipos
 * Obtiene el catálogo único de tipos de productos
 * 
 * Headers:
 *   x-api-key: API key para autenticación
 * 
 * Response:
 *   {
 *     success: boolean,
 *     tipos: Array<{
 *       id: string,
 *       nombre: string,
 *       count: number
 *     }>
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
    // Obtener todos los productos
    const productosRef = collection(db, 'productos');
    const snapshot = await getDocs(productosRef);

    // Extraer tipos únicos y contar productos por tipo
    const tiposMap = new Map();
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const tipo = data.tipo || 'Sin categoría';
      
      if (tiposMap.has(tipo)) {
        tiposMap.set(tipo, tiposMap.get(tipo) + 1);
      } else {
        tiposMap.set(tipo, 1);
      }
    });

    // Convertir a array simple de strings ordenado alfabéticamente
    const tipos = Array.from(tiposMap.keys()).sort((a, b) => a.localeCompare(b));

    return res.status(200).json({
      success: true,
      tipos
    });

  } catch (error) {
    console.error('Error fetching product tipos:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener los tipos de productos',
      details: error.message
    });
  }
}
