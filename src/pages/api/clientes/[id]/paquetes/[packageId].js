import { updateAssignedPackage, getUserType } from '../../../../../../lib/firebase/packagesService';

export default async function handler(req, res) {
  const { id: userId, packageId } = req.query;

  if (!userId || !packageId) {
    return res.status(400).json({ 
      success: false, 
      error: 'ID de usuario y paquete son requeridos' 
    });
  }

  // Solo permitir PUT para actualizar
  if (req.method !== 'PUT') {
    return res.status(405).json({ 
      success: false, 
      error: 'Método no permitido' 
    });
  }

  try {
    const { fechaAsignacion, descuento } = req.body;

    // Validar que al menos hay un campo para actualizar
    if (!fechaAsignacion && descuento === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'No hay datos para actualizar' 
      });
    }

    // Verificar que el usuario existe
    const userType = await getUserType(userId);
    if (!userType) {
      return res.status(404).json({ 
        success: false, 
        error: 'Usuario no encontrado' 
      });
    }

    // Preparar datos de actualización
    const updateData = {};
    if (fechaAsignacion) {
      updateData.fechaAsignacion = fechaAsignacion;
    }
    if (descuento !== undefined) {
      updateData.descuento = descuento;
    }

    // Actualizar el paquete asignado
    const result = await updateAssignedPackage(userId, packageId, updateData);

    if (result.success) {
      return res.status(200).json({ 
        success: true, 
        message: 'Paquete actualizado correctamente' 
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        error: result.error || 'Error al actualizar el paquete' 
      });
    }

  } catch (error) {
    console.error('Error in PUT /api/clientes/[id]/paquetes/[packageId]:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
}
