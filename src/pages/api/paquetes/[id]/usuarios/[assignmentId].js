import { 
  doc, 
  deleteDoc,
  getDoc,
  collectionGroup,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../../../../../../lib/firebase';

export default async function handler(req, res) {
  // Solo permitir métodos DELETE
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { id: packageId, assignmentId } = req.query;

    if (!packageId || !assignmentId) {
      return res.status(400).json({ error: 'ID de paquete y ID de asignación requeridos' });
    }

    console.log('Eliminando asignación:', { packageId, assignmentId });

    // La estructura de asignaciones es: /clientes/{userId}/paquetesAsignados/{assignmentId}
    // o /atletas/{userId}/paquetesAsignados/{assignmentId}
    
    // Primero necesitamos encontrar la asignación para eliminarla
    // Buscamos en ambas colecciones (clientes y atletas)
    
    let assignmentFound = false;
    let assignmentRef = null;

    // Buscar la asignación en todas las subcolecciones de paquetesAsignados
    try {
      const assignmentsQuery = query(
        collectionGroup(db, 'paquetesAsignados'),
        where('idPaquete', '==', packageId)
      );
      
      const querySnapshot = await getDocs(assignmentsQuery);
      
      for (const assignmentDoc of querySnapshot.docs) {
        if (assignmentDoc.id === assignmentId) {
          assignmentRef = assignmentDoc.ref;
          assignmentFound = true;
          console.log('Asignación encontrada en:', assignmentRef.path);
          break;
        }
      }
      
    } catch (error) {
      console.error('Error buscando asignación:', error);
    }

    if (!assignmentFound || !assignmentRef) {
      return res.status(404).json({ error: 'Asignación no encontrada' });
    }

    // Eliminar la asignación
    await deleteDoc(assignmentRef);
    
    console.log('Asignación eliminada exitosamente:', assignmentId);

    res.status(200).json({
      success: true,
      message: 'Usuario eliminado del paquete exitosamente'
    });

  } catch (error) {
    console.error('Error deleting user assignment:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
}