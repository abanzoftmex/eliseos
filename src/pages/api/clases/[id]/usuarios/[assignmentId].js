import { 
  removeUserFromClass
} from '../../../../../../lib/firebase/classesService';

export default async function handler(req, res) {
  // Solo permitir métodos DELETE
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { id: classId, assignmentId } = req.query;

    if (!classId || !assignmentId) {
      return res.status(400).json({ error: 'ID de clase y ID de asignación requeridos' });
    }

    console.log('Eliminando usuario de clase:', { classId, assignmentId });

    const result = await removeUserFromClass(classId, assignmentId);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error deleting user from class:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
}