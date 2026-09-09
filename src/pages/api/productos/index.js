import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * GET /api/productos
 * Lista todos los productos disponibles
 * 
 * Headers:
 *   x-api-key: API key para autenticación
 * 
 * Response:
 *   {
 *     success: boolean,
 *     productos: Array<{
 *       id: string,
 *       nombre: string, // Mapeado desde 'name' de Firebase
 *       descripcion: string, // Mapeado desde 'description' de Firebase
 *       tipo: string,
 *       precio: number, // Mapeado desde 'price' de Firebase
 *       inventarioInicial: number,
 *       inventarioActual: number,
 *       imageUrl?: string,
 *       sucursalId: string,
 *       isActive: boolean,
 *       createdAt: timestamp,
 *       updatedAt: timestamp
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
    // Obtener todos los productos (sin orderBy para evitar problemas con campos faltantes)
    const productosRef = collection(db, 'productos');
    const snapshot = await getDocs(productosRef);

    const productos = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Convertir timestamps a strings para serialización JSON
      productos.push({
        id: doc.id,
        nombre: data.name || '',
        descripcion: data.descripcion || data.description || '',
        tipo: data.tipo || '',
        precio: data.precio || data.price || 0,
        inventarioInicial: data.inventarioInicial || 0,
        inventarioActual: data.inventarioActual || 0,
        imageUrl: data.imageUrl || null,
        sucursalId: data.sucursalId || null,
        isActive: data.isActive !== false, // Por defecto true
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      });
    });

    // Ordenar por nombre en JavaScript (para manejar productos sin nombre)
    productos.sort((a, b) => {
      const nombreA = (a.nombre || '').toLowerCase();
      const nombreB = (b.nombre || '').toLowerCase();
      return nombreA.localeCompare(nombreB);
    });

    return res.status(200).json({
      success: true,
      productos,
      total: productos.length
    });

  } catch (error) {
    console.error('Error fetching productos:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener los productos',
      details: error.message
    });
  }
}
