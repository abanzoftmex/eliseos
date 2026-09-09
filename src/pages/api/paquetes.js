import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

/**
 * API para obtener todos los paquetes disponibles
 * GET /api/paquetes - Lista todos los paquetes
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    console.log('Cargando paquetes desde la colección "packages"...');
    
    // Obtener todos los paquetes
    const snapshot = await getDocs(collection(db, 'packages'));
    
    console.log('Documentos encontrados:', snapshot.size);
    
    const allPackages = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log('Paquete encontrado:', doc.id, data);
      allPackages.push({
        id: doc.id,
        ...data
      });
    });
    
    console.log('Total de paquetes cargados:', allPackages.length);

    return res.status(200).json({
      success: true,
      packages: allPackages
    });

  } catch (error) {
    console.error('Error in /api/paquetes:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      packages: []
    });
  }
}
