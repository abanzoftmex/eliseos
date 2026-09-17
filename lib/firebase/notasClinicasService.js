import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Determinar el tipo de usuario (cliente o atleta)
 */
export const getUserType = async (userId) => {
  try {
    // Verificar si es cliente
    const clienteRef = doc(db, 'clientes', userId);
    const clienteDoc = await getDoc(clienteRef);
    
    if (clienteDoc.exists()) {
      return 'cliente';
    }
    
    // Verificar si es atleta
    const atletaRef = doc(db, 'atletas', userId);
    const atletaDoc = await getDoc(atletaRef);
    
    if (atletaDoc.exists()) {
      return 'atleta';
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user type:', error);
    return null;
  }
};

/**
 * Crear una nueva nota clínica
 * @param {string} userId - ID del usuario (cliente o atleta)
 * @param {Object} notaData - Datos de la nota clínica
 * @param {string} notaData.subjetivo - Manifestaciones subjetivas del paciente
 * @param {string} notaData.objetivo - Evaluación objetiva
 * @param {string} notaData.evaluacion - Evaluación profesional
 * @param {string} notaData.planTerapeutico - Plan terapéutico
 * @param {Date|string} notaData.fecha - Fecha de la sesión (opcional, por defecto hoy)
 * @param {number} notaData.numeroSesion - Número de sesión (opcional)
 */
export const createNotaClinica = async (userId, notaData) => {
  try {
    console.log('[createNotaClinica] userId:', userId, 'notaData:', notaData);
    
    // Determinar el tipo de usuario
    const userType = await getUserType(userId);
    if (!userType) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    const userCollection = userType === 'cliente' ? 'clientes' : 'atletas';
    const notaRef = doc(collection(db, userCollection, userId, 'notasClinicas'));
    
    // Preparar la fecha
    // Si la fecha viene como string YYYY-MM-DD, agregarle hora para evitar problemas de zona horaria
    let fechaNota;
    if (notaData.fecha) {
      if (typeof notaData.fecha === 'string') {
        // Si el string ya tiene 'T' (hora incluida), usarlo directamente
        // Si no, agregar T12:00:00 para evitar problemas de zona horaria
        const fechaString = notaData.fecha.includes('T') 
          ? notaData.fecha 
          : `${notaData.fecha}T12:00:00`;
        fechaNota = new Date(fechaString);
      } else if (notaData.fecha instanceof Date) {
        fechaNota = notaData.fecha;
      } else {
        fechaNota = serverTimestamp();
      }
    } else {
      fechaNota = serverTimestamp();
    }

    const notaCompleta = {
      id: notaRef.id,
      ...notaData,
      subjetivo: notaData.subjetivo || '',
      objetivo: notaData.objetivo || '',
      evaluacion: notaData.evaluacion || '',
      planTerapeutico: notaData.planTerapeutico || '',
      fecha: fechaNota,
      hora: notaData.hora || null,
      numeroSesion: notaData.numeroSesion || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(notaRef, notaCompleta);
    console.log('[createNotaClinica] Nota creada exitosamente:', notaRef.id);
    
    return { success: true, notaId: notaRef.id };
  } catch (error) {
    console.error('Error creating nota clinica:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener todas las notas clínicas de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<{success: boolean, notas?: Array, error?: string}>}
 */
export const getNotasClinicas = async (userId) => {
  try {
    console.log('[getNotasClinicas] userId:', userId);
    
    // Determinar el tipo de usuario
    const userType = await getUserType(userId);
    if (!userType) {
      return { success: false, error: 'Usuario no encontrado', notas: [] };
    }

    const userCollection = userType === 'cliente' ? 'clientes' : 'atletas';
    const q = query(
      collection(db, userCollection, userId, 'notasClinicas'),
      orderBy('fecha', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const notas = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notas.push({
        id: doc.id,
        ...data,
        // Convertir Timestamp a Date si es necesario
        fecha: data.fecha?.toDate ? data.fecha.toDate() : data.fecha,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
      });
    });
    
    console.log('[getNotasClinicas] Total notas encontradas:', notas.length);
    return { success: true, notas };
  } catch (error) {
    console.error('Error getting notas clinicas:', error);
    return { success: false, error: error.message, notas: [] };
  }
};

/**
 * Obtener una nota clínica específica
 * @param {string} userId - ID del usuario
 * @param {string} notaId - ID de la nota
 */
export const getNotaClinicaById = async (userId, notaId) => {
  try {
    console.log('[getNotaClinicaById] userId:', userId, 'notaId:', notaId);
    
    // Determinar el tipo de usuario
    const userType = await getUserType(userId);
    if (!userType) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    const userCollection = userType === 'cliente' ? 'clientes' : 'atletas';
    const notaDoc = await getDoc(doc(db, userCollection, userId, 'notasClinicas', notaId));
    
    if (!notaDoc.exists()) {
      return { success: false, error: 'Nota clínica no encontrada' };
    }

    const data = notaDoc.data();
    const nota = {
      id: notaDoc.id,
      ...data,
      fecha: data.fecha?.toDate ? data.fecha.toDate() : data.fecha,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
    };
    
    return { success: true, nota };
  } catch (error) {
    console.error('Error getting nota clinica:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Actualizar una nota clínica existente
 * @param {string} userId - ID del usuario
 * @param {string} notaId - ID de la nota
 * @param {Object} updateData - Datos a actualizar
 */
export const updateNotaClinica = async (userId, notaId, updateData) => {
  try {
    console.log('[updateNotaClinica] userId:', userId, 'notaId:', notaId, 'updateData:', updateData);
    
    // Determinar el tipo de usuario
    const userType = await getUserType(userId);
    if (!userType) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    const userCollection = userType === 'cliente' ? 'clientes' : 'atletas';
    const notaRef = doc(db, userCollection, userId, 'notasClinicas', notaId);
    
    // Verificar que la nota existe
    const notaDoc = await getDoc(notaRef);
    if (!notaDoc.exists()) {
      return { success: false, error: 'Nota clínica no encontrada' };
    }

    // Preparar datos de actualización
    const updates = {
      ...updateData,
      updatedAt: serverTimestamp()
    };

    // Si se actualiza la fecha
    if (updateData.fecha) {
      if (typeof updateData.fecha === 'string') {
        // Si el string ya tiene 'T' (hora incluida), usarlo directamente
        // Si no, agregar T12:00:00 para evitar problemas de zona horaria
        const fechaString = updateData.fecha.includes('T') 
          ? updateData.fecha 
          : `${updateData.fecha}T12:00:00`;
        updates.fecha = new Date(fechaString);
      } else if (updateData.fecha instanceof Date) {
        updates.fecha = updateData.fecha;
      }
    }
    
    await updateDoc(notaRef, updates);
    console.log('[updateNotaClinica] Nota actualizada exitosamente:', notaId);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating nota clinica:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Eliminar una nota clínica
 * @param {string} userId - ID del usuario
 * @param {string} notaId - ID de la nota
 */
export const deleteNotaClinica = async (userId, notaId) => {
  try {
    console.log('[deleteNotaClinica] userId:', userId, 'notaId:', notaId);
    
    // Determinar el tipo de usuario
    const userType = await getUserType(userId);
    if (!userType) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    const userCollection = userType === 'cliente' ? 'clientes' : 'atletas';
    const notaRef = doc(db, userCollection, userId, 'notasClinicas', notaId);
    
    // Verificar que la nota existe
    const notaDoc = await getDoc(notaRef);
    if (!notaDoc.exists()) {
      return { success: false, error: 'Nota clínica no encontrada' };
    }

    await deleteDoc(notaRef);
    console.log('[deleteNotaClinica] Nota eliminada exitosamente:', notaId);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting nota clinica:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener estadísticas de notas clínicas de un usuario
 * @param {string} userId - ID del usuario
 */
export const getNotasClinicasStats = async (userId) => {
  try {
    const result = await getNotasClinicas(userId);
    
    if (!result.success) {
      return result;
    }

    const stats = {
      total: result.notas.length,
      ultimaNota: result.notas.length > 0 ? result.notas[0].fecha : null,
      primeraNota: result.notas.length > 0 ? result.notas[result.notas.length - 1].fecha : null
    };

    return { success: true, stats };
  } catch (error) {
    console.error('Error getting notas clinicas stats:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Validar datos de nota clínica
 * @param {Object} notaData - Datos a validar
 */
export const validateNotaClinica = (notaData) => {
  const errors = [];

  if (notaData.tipoNota === 'hoja_clinica_eliseos' || notaData.paquete) {
    if (!notaData.paquete?.trim()) {
      errors.push('El campo Paquete es obligatorio');
    }
  } else {
    if (!notaData.subjetivo?.trim() && !notaData.objetivo?.trim() && 
        !notaData.evaluacion?.trim() && !notaData.planTerapeutico?.trim()) {
      errors.push('Debe completar al menos un campo de la nota clínica');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
