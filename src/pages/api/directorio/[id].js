import { db } from '../../../../lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'ID del profesional es requerido'
    });
  }

  try {
    const profesionalRef = doc(db, 'directorio', id);

    switch (req.method) {
      case 'GET':
        // Obtener un profesional específico
        const profesionalSnap = await getDoc(profesionalRef);
        
        if (!profesionalSnap.exists()) {
          return res.status(404).json({
            success: false,
            error: 'Profesional no encontrado'
          });
        }

        return res.status(200).json({
          success: true,
          data: {
            id: profesionalSnap.id,
            ...profesionalSnap.data()
          }
        });

      case 'PUT':
        // Actualizar profesional
        const { 
          nombre,
          apellidoPaterno,
          apellidoMaterno,
          email,
          telefono,
          telefonoContacto,
          especialidad,
          puesto,
          ocupacion,
          area,
          foto,
          status,
          tipo,
          observaciones
        } = req.body;

        // Validaciones básicas
        if (!nombre || !apellidoPaterno) {
          return res.status(400).json({
            success: false,
            error: 'Nombre y apellido paterno son requeridos'
          });
        }

        // Verificar si el profesional existe
        const existingProfesional = await getDoc(profesionalRef);
        if (!existingProfesional.exists()) {
          return res.status(404).json({
            success: false,
            error: 'Profesional no encontrado'
          });
        }

        // Datos a actualizar
        const updateData = {
          nombre: nombre.trim(),
          apellidoPaterno: apellidoPaterno.trim(),
          apellidoMaterno: apellidoMaterno?.trim() || '',
          email: email?.trim() || '',
          telefono: telefono?.trim() || '',
          telefonoContacto: telefonoContacto?.trim() || telefono?.trim() || '',
          especialidad: especialidad?.trim() || '',
          puesto: puesto?.trim() || '',
          ocupacion: ocupacion?.trim() || puesto?.trim() || '',
          area: area?.trim() || '',
          foto: foto?.trim() || '',
          status: status || 'active',
          tipo: tipo?.trim() || 'Médico',
          observaciones: observaciones?.trim() || '',
          fechaActualizacion: new Date().toISOString()
        };

        await updateDoc(profesionalRef, updateData);

        return res.status(200).json({
          success: true,
          message: 'Profesional actualizado exitosamente',
          data: {
            id,
            ...updateData
          }
        });

      case 'DELETE':
        // Eliminar profesional
        const profesionalToDelete = await getDoc(profesionalRef);
        
        if (!profesionalToDelete.exists()) {
          return res.status(404).json({
            success: false,
            error: 'Profesional no encontrado'
          });
        }

        await deleteDoc(profesionalRef);

        return res.status(200).json({
          success: true,
          message: 'Profesional eliminado exitosamente',
          data: {
            id,
            deletedAt: new Date().toISOString()
          }
        });

      default:
        return res.status(405).json({
          success: false,
          error: 'Método no permitido'
        });
    }

  } catch (error) {
    console.error(`Error en operación ${req.method} para profesional ${id}:`, error);
    
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}