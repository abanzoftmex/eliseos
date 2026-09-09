import { db } from '../../../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export default async function handler(req, res) {
  // Solo permitir métodos GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { search = '', limit = 100 } = req.query;

    // Obtener todos los profesionales del directorio
    const directorioRef = collection(db, 'directorio');
    let directorioQuery = query(directorioRef, orderBy('nombre', 'asc'));
    
    const directorioSnapshot = await getDocs(directorioQuery);
    let profesionalesData = directorioSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filtrar en el servidor si hay término de búsqueda
    if (search.trim()) {
      const lowerSearchTerm = search.toLowerCase();
      
      profesionalesData = profesionalesData.filter(profesional => {
        const nombreCompleto = `${profesional.nombre || ''} ${profesional.apellidoPaterno || ''} ${profesional.apellidoMaterno || ''}`.toLowerCase();
        const especialidad = (profesional.especialidad || '').toLowerCase();
        const puesto = (profesional.puesto || '').toLowerCase();
        const area = (profesional.area || '').toLowerCase();
        const email = (profesional.email || '').toLowerCase();
        const telefono = (profesional.telefono || '').toLowerCase();
        
        return nombreCompleto.includes(lowerSearchTerm) ||
               especialidad.includes(lowerSearchTerm) ||
               puesto.includes(lowerSearchTerm) ||
               area.includes(lowerSearchTerm) ||
               email.includes(lowerSearchTerm) ||
               telefono.includes(lowerSearchTerm);
      });
    }

    // Limitar resultados si se especifica
    if (limit && limit !== 'all') {
      profesionalesData = profesionalesData.slice(0, parseInt(limit));
    }

    res.status(200).json({
      success: true,
      data: profesionalesData,
      total: profesionalesData.length
    });

  } catch (error) {
    console.error('Error fetching directorio:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor al obtener directorio',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}