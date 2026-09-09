import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * GET /api/planes
 * Lista todos los planes/paquetes disponibles
 * 
 * Headers:
 *   x-api-key: API key para autenticación
 * 
 * Response:
 *   {
 *     success: boolean,
 *     planes: Array<{
 *       id: string,
 *       nombre: string,
 *       descripcion: string,
 *       tipo: string ('grupal' | 'personalizado' | 'sesion'),
 *       precio: number,
 *       sesiones: number,
 *       duracion: string,
 *       imageUrl?: string,
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
    // Obtener todos los paquetes/planes
    const planesRef = collection(db, 'packages');
    const snapshot = await getDocs(planesRef);

    const planes = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Convertir timestamps a strings para serialización JSON
      planes.push({
        id: doc.id,
        nombre: data.nombre || '',
        descripcion: data.descripcion || '',
        tipo: data.tipo || 'grupal',
        precio: data.precio || 0,
        sesiones: data.sesiones || 0,
        duracion: data.duracion || '30 días',
        imageUrl: data.imageUrl || null,
        isActive: data.isActive !== false, // Por defecto true
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      });
    });

    // Ordenar por nombre en JavaScript
    planes.sort((a, b) => {
      const nombreA = (a.nombre || '').toLowerCase();
      const nombreB = (b.nombre || '').toLowerCase();
      return nombreA.localeCompare(nombreB);
    });

    return res.status(200).json({
      success: true,
      planes,
      total: planes.length
    });

  } catch (error) {
    console.error('Error fetching planes:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener los planes',
      details: error.message
    });
  }
}
