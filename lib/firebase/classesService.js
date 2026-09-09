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
  serverTimestamp,
  collectionGroup,
  limit,
  startAfter,
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

// ====== TIPOS DE CLASES ======
export const CLASS_TYPES = {
  GRUPAL: 'grupal',
  PERSONALIZADO: 'personalizado',
  SESION: 'sesion'
};

export const CLASS_TYPE_LABELS = {
  [CLASS_TYPES.GRUPAL]: 'Grupal',
  [CLASS_TYPES.PERSONALIZADO]: 'Personalizado',
  [CLASS_TYPES.SESION]: 'Rehabilitación/Readaptación'
};

// ====== STATUS DE CLASES ======
export const CLASS_STATUS = {
  PROGRAMADA: 'programada',
  EN_PROGRESO: 'en_progreso',
  COMPLETADA: 'completada',
  CANCELADA: 'cancelada'
};

export const CLASS_STATUS_LABELS = {
  [CLASS_STATUS.PROGRAMADA]: 'Programada',
  [CLASS_STATUS.EN_PROGRESO]: 'En Progreso',
  [CLASS_STATUS.COMPLETADA]: 'Completada',
  [CLASS_STATUS.CANCELADA]: 'Cancelada'
};

// ====== FUNCIONES AUXILIARES ======

/**
 * Formatear precio para mostrar
 */
export const formatPrice = (price) => {
  if (!price) return '$0';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(price);
};

/**
 * Formatear fecha y hora
 */
export const formatDateTime = (date) => {
  if (!date) return 'No definida';
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  return dateObj.toLocaleString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formatear horario recurrente
 */
export const formatRecurrentSchedule = (classData) => {
  if (!classData.diasSemana || classData.diasSemana.length === 0) {
    return 'Sin horario definido';
  }

  const diasMap = {
    'lunes': 'Lun',
    'martes': 'Mar',
    'miercoles': 'Mié',
    'jueves': 'Jue',
    'viernes': 'Vie',
    'sabado': 'Sáb',
    'domingo': 'Dom'
  };

  const diasAbrev = classData.diasSemana
    .map(dia => diasMap[dia] || dia)
    .join(', ');

  const hora = classData.horaInicio || '__:__';

  return `${diasAbrev} a las ${hora}`;
};

/**
 * Normalizar clase al nuevo formato (migración desde formato antiguo)
 * Convierte fechaEspecifica/horaEspecifica a fechasEspecificas array
 */
export const normalizeClassData = (classData) => {
  if (!classData) return null;

  // Si ya tiene modoProgramacion, no hacer nada
  if (classData.modoProgramacion) {
    return classData;
  }

  // Migrar formato antiguo
  const normalized = { ...classData };

  // Si tiene diasSemana, es recurrente
  if (classData.diasSemana && classData.diasSemana.length > 0) {
    normalized.modoProgramacion = 'recurrente';
  }
  // Si tiene fechaEspecifica (singular), convertir a fechasEspecificas (plural)
  else if (classData.fechaEspecifica) {
    normalized.modoProgramacion = 'especifica';
    normalized.fechasEspecificas = [{
      fecha: classData.fechaEspecifica,
      hora: classData.horaEspecifica || '00:00'
    }];
    // Mantener campos antiguos por compatibilidad
  }
  // Por defecto, recurrente
  else {
    normalized.modoProgramacion = 'recurrente';
    normalized.diasSemana = normalized.diasSemana || [];
  }

  return normalized;
};

/**
 * Formatear fechas específicas para mostrar
 */
export const formatSpecificDates = (fechasEspecificas) => {
  if (!fechasEspecificas || fechasEspecificas.length === 0) {
    return 'Sin fechas programadas';
  }

  if (fechasEspecificas.length === 1) {
    const item = fechasEspecificas[0];
    const fecha = new Date(item.fecha + 'T00:00:00').toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    return `${fecha} a las ${item.hora}`;
  }

  return `${fechasEspecificas.length} fechas programadas`;
};

// ====== FUNCIONES PARA CLASES ======

/**
 * Crear una nueva clase
 */
export const createClass = async (classData) => {
  try {
    const classRef = doc(collection(db, 'clases'));
    const classWithMetadata = {
      ...classData,
      id: classRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: CLASS_STATUS.PROGRAMADA,
      participantesActuales: 0,
      // Cupo: respeta lo que defina el admin para CUALQUIER tipo de clase.
      // Solo si no se especifica un número válido usamos un default por tipo.
      maxParticipantes: Number(classData.maxParticipantes) > 0
        ? Number(classData.maxParticipantes)
        : (classData.tipo === CLASS_TYPES.GRUPAL ? 20 : 1),
      precio: classData.precio || 0,
      duracion: classData.duracion || 60, // minutos
      instructor: classData.instructor || '',
      ubicacion: classData.ubicacion || '',
      descripcion: classData.descripcion || '',
      equipamientoNecesario: classData.equipamientoNecesario || [],
      // Modo de programación
      modoProgramacion: classData.modoProgramacion || 'recurrente',
      // Horarios según el modo de programación
      ...(classData.modoProgramacion === 'recurrente' && {
        diasSemana: classData.diasSemana || [],
        horaInicio: classData.horaInicio || null
      }),
      ...(classData.modoProgramacion === 'especifica' && {
        fechasEspecificas: classData.fechasEspecificas || []
      }),
      // Campos específicos por tipo
      ...(classData.tipo === CLASS_TYPES.PERSONALIZADO && {
        clienteAsignado: classData.clienteAsignado || null,
        objetivos: classData.objetivos || [],
        plan: classData.plan || ''
      }),
      ...(classData.tipo === CLASS_TYPES.SESION && {
        tipoSesion: classData.tipoSesion || 'masaje', // masaje, rehabilitacion, fisioterapia
        clienteAsignado: classData.clienteAsignado || null,
        notas: classData.notas || ''
      })
    };

    // Crear la clase
    await setDoc(classRef, classWithMetadata);

    // Si hay un cliente asignado, crear automáticamente la asignación
    if (classWithMetadata.clienteAsignado &&
      (classData.tipo === CLASS_TYPES.PERSONALIZADO || classData.tipo === CLASS_TYPES.SESION)) {

      console.log('Asignando cliente automáticamente:', classWithMetadata.clienteAsignado);

      const assignmentData = {
        notas: classWithMetadata.notas || '',
        estado: 'activa'
      };

      // Para clases de fecha específica, usar la primera fecha como fecha de asignación
      if (classWithMetadata.modoProgramacion === 'especifica' &&
        classWithMetadata.fechasEspecificas &&
        classWithMetadata.fechasEspecificas.length > 0) {
        assignmentData.fechaEspecifica = classWithMetadata.fechasEspecificas[0].fecha;
      }

      const assignResult = await assignUserToClass(
        classRef.id,
        classWithMetadata.clienteAsignado,
        'cliente',
        assignmentData
      );

      if (!assignResult.success) {
        console.warn('Error asignando cliente automáticamente:', assignResult.error);
        // No fallar la creación de la clase por este error
      } else {
        console.log('Cliente asignado automáticamente con éxito');
        // Actualizar contador de participantes
        classWithMetadata.participantesActuales = 1;
        await updateDoc(classRef, { participantesActuales: 1 });
      }
    }

    return { success: true, classId: classRef.id, classData: classWithMetadata };
  } catch (error) {
    console.error('Error creating class:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener todas las clases con filtros
 */
export const getClasses = async (filters = {}) => {
  try {
    console.log('Cargando clases con filtros:', filters);

    let classesQuery = collection(db, 'clases');
    const queryConstraints = [];

    // Filtrar por tipo de clase
    if (filters.tipo) {
      queryConstraints.push(where('tipo', '==', filters.tipo));
    }

    // Filtrar por status
    if (filters.status) {
      queryConstraints.push(where('status', '==', filters.status));
    }

    // Filtrar por instructor
    if (filters.instructor) {
      queryConstraints.push(where('instructor', '==', filters.instructor));
    }

    // Ordenar por nombre si no hay otro criterio
    queryConstraints.push(orderBy('nombre', 'asc'));

    // Limitar resultados si se especifica
    if (filters.limit) {
      queryConstraints.push(limit(filters.limit));
    }

    if (queryConstraints.length > 0) {
      classesQuery = query(classesQuery, ...queryConstraints);
    }

    const snapshot = await getDocs(classesQuery);
    const classes = snapshot.docs.map(doc => {
      const classData = {
        id: doc.id,
        ...doc.data()
      };
      // Normalizar al nuevo formato
      return normalizeClassData(classData);
    });

    console.log('Clases cargadas:', classes.length);
    return { success: true, classes };
  } catch (error) {
    console.error('Error getting classes:', error);
    // Si falla por índices, intentar sin filtros complejos
    try {
      const snapshot = await getDocs(collection(db, 'clases'));
      const allClasses = snapshot.docs.map(doc => {
        const classData = {
          id: doc.id,
          ...doc.data()
        };
        // Normalizar al nuevo formato
        return normalizeClassData(classData);
      });

      // Filtrar manualmente si es necesario
      let filteredClasses = allClasses;

      if (filters.tipo) {
        filteredClasses = filteredClasses.filter(cls => cls.tipo === filters.tipo);
      }

      if (filters.status) {
        filteredClasses = filteredClasses.filter(cls => cls.status === filters.status);
      }

      // Ordenar por nombre
      filteredClasses.sort((a, b) => {
        return (a.nombre || '').localeCompare(b.nombre || '');
      });

      return { success: true, classes: filteredClasses };
    } catch (secondError) {
      console.error('Error getting classes (second attempt):', secondError);
      return { success: false, error: secondError.message };
    }
  }
};

/**
 * Obtener una clase por ID
 */
export const getClassById = async (classId) => {
  try {
    const classDoc = await getDoc(doc(db, 'clases', classId));

    if (!classDoc.exists()) {
      return { success: false, error: 'Clase no encontrada' };
    }

    const classData = {
      id: classDoc.id,
      ...classDoc.data()
    };

    // Normalizar al nuevo formato si es necesario
    const normalizedData = normalizeClassData(classData);

    return { success: true, class: normalizedData };
  } catch (error) {
    console.error('Error getting class:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Actualizar una clase
 */
export const updateClass = async (classId, updateData) => {
  try {
    const classRef = doc(db, 'clases', classId);
    const dataToUpdate = {
      ...updateData,
      updatedAt: serverTimestamp()
    };

    await updateDoc(classRef, dataToUpdate);
    return { success: true };
  } catch (error) {
    console.error('Error updating class:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Eliminar una clase
 */
export const deleteClass = async (classId) => {
  try {
    const classRef = doc(db, 'clases', classId);
    await deleteDoc(classRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting class:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clonar una clase
 */
export const cloneClass = async (classId) => {
  try {
    // Obtener la clase original
    const result = await getClassById(classId);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    const originalClass = result.class;

    // Crear una copia de la clase con algunos ajustes
    const clonedClassData = {
      ...originalClass,
      nombre: `${originalClass.nombre} (Copia)`,
      isCloned: true, // Marca para identificar que es una copia
      clonedFrom: classId, // Referencia a la clase original
      participantesActuales: 0, // Resetear participantes
      status: CLASS_STATUS.PROGRAMADA, // Resetear a programada
      clienteAsignado: null, // No copiar asignación de cliente
    };

    // Eliminar campos que no deben copiarse
    delete clonedClassData.id;
    delete clonedClassData.createdAt;
    delete clonedClassData.updatedAt;

    // Crear la nueva clase
    const createResult = await createClass(clonedClassData);

    return createResult;
  } catch (error) {
    console.error('Error cloning class:', error);
    return { success: false, error: error.message };
  }
};

// ====== FUNCIONES PARA PARTICIPANTES/ASIGNACIONES ======

/**
 * Asignar un usuario a una clase
 */
export const assignUserToClass = async (classId, userId, userType, assignmentData = {}) => {
  try {
    const userCollection = userType === 'cliente' ? 'clientes' : 'atletas';
    const assignmentRef = doc(collection(db, userCollection, userId, 'clasesAsignadas'));

    const assignmentWithMetadata = {
      idClase: classId,
      fechaAsignacion: serverTimestamp(),
      estado: 'activa',
      notas: assignmentData.notas || '',
      ...assignmentData
    };

    await setDoc(assignmentRef, assignmentWithMetadata);

    // Actualizar contador de participantes en la clase de forma atómica
    const classRef = doc(db, 'clases', classId);
    await updateDoc(classRef, {
      participantesActuales: increment(1)
    }).catch(err => {
      console.warn('Could not increment participantesActuales:', err);
    });

    return { success: true, assignmentId: assignmentRef.id };
  } catch (error) {
    console.error('Error assigning user to class:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener usuarios asignados a una clase
 */
export const getClassAssignedUsers = async (classId) => {
  try {
    const users = [];

    // Buscar en todas las subcolecciones de clasesAsignadas
    // Nota: Esta consulta requiere un índice compuesto en Firebase
    // Si falla, usar el filtrado en memoria como fallback
    try {
      const assignmentsQuery = query(
        collectionGroup(db, 'clasesAsignadas'),
        where('idClase', '==', classId)
      );

      const querySnapshot = await getDocs(assignmentsQuery);

      // Obtener información de usuarios para cada asignación
      for (const assignmentDoc of querySnapshot.docs) {
        const assignmentData = assignmentDoc.data();
        const userPath = assignmentDoc.ref.parent.parent;

        if (userPath) {
          const userDoc = await getDoc(userPath);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userType = userPath.parent.id; // 'clientes' o 'atletas'

            users.push({
              id: userDoc.id,
              name: `${userData.nombre} ${userData.apellidoPaterno} ${userData.apellidoMaterno || ''}`.trim(),
              email: userData.email || 'Sin email',
              telefono: userData.telefonoContacto || userData.telefono || userData.celular || null,
              type: userType === 'clientes' ? 'Cliente' : 'Atleta',
              assignedAt: assignmentData.fechaAsignacion,
              estado: assignmentData.estado,
              notas: assignmentData.notas,
              assignmentId: assignmentDoc.id,
              packageAssignmentId: assignmentData.packageAssignmentId
            });
          }
        }
      }
    } catch (indexError) {
      console.warn('Índice no disponible, usando método alternativo:', indexError.message);

      // Fallback: buscar en clientes y atletas individualmente
      const clientesSnapshot = await getDocs(collection(db, 'clientes'));
      const atletasSnapshot = await getDocs(collection(db, 'atletas'));

      // Buscar en clientes
      for (const clienteDoc of clientesSnapshot.docs) {
        const assignmentsSnapshot = await getDocs(
          collection(db, 'clientes', clienteDoc.id, 'clasesAsignadas')
        );

        for (const assignmentDoc of assignmentsSnapshot.docs) {
          const assignmentData = assignmentDoc.data();
          if (assignmentData.idClase === classId) {
            const userData = clienteDoc.data();
            users.push({
              id: clienteDoc.id,
              name: `${userData.nombre} ${userData.apellidoPaterno} ${userData.apellidoMaterno || ''}`.trim(),
              email: userData.email || 'Sin email',
              telefono: userData.telefonoContacto || userData.telefono || userData.celular || null,
              type: 'Cliente',
              assignedAt: assignmentData.fechaAsignacion,
              estado: assignmentData.estado,
              notas: assignmentData.notas,
              assignmentId: assignmentDoc.id,
              packageAssignmentId: assignmentData.packageAssignmentId
            });
          }
        }
      }

      // Buscar en atletas
      for (const atletaDoc of atletasSnapshot.docs) {
        const assignmentsSnapshot = await getDocs(
          collection(db, 'atletas', atletaDoc.id, 'clasesAsignadas')
        );

        for (const assignmentDoc of assignmentsSnapshot.docs) {
          const assignmentData = assignmentDoc.data();
          if (assignmentData.idClase === classId) {
            const userData = atletaDoc.data();
            users.push({
              id: atletaDoc.id,
              name: `${userData.nombre} ${userData.apellidoPaterno} ${userData.apellidoMaterno || ''}`.trim(),
              email: userData.email || 'Sin email',
              telefono: userData.telefonoContacto || userData.telefono || userData.celular || null,
              type: 'Atleta',
              assignedAt: assignmentData.fechaAsignacion,
              estado: assignmentData.estado,
              notas: assignmentData.notas,
              assignmentId: assignmentDoc.id,
              packageAssignmentId: assignmentData.packageAssignmentId
            });
          }
        }
      }
    }

    return { success: true, users };
  } catch (error) {
    console.error('Error getting class assigned users:', error);
    return { success: false, error: error.message, users: [] };
  }
};

/**
 * Remover un usuario de una clase
 */
export const removeUserFromClass = async (classId, assignmentId) => {
  try {
    console.log('Eliminando asignación de clase:', { classId, assignmentId });

    let assignmentRef = null;

    // Intentar buscar con collectionGroup (más rápido si el índice existe)
    try {
      const assignmentsQuery = query(
        collectionGroup(db, 'clasesAsignadas'),
        where('idClase', '==', classId)
      );

      const querySnapshot = await getDocs(assignmentsQuery);

      for (const assignmentDoc of querySnapshot.docs) {
        if (assignmentDoc.id === assignmentId) {
          assignmentRef = assignmentDoc.ref;
          console.log('Asignación encontrada en:', assignmentRef.path);
          break;
        }
      }
    } catch (indexError) {
      console.warn('Índice no disponible, usando método alternativo');

      // Fallback: buscar en clientes y atletas
      const clientesSnapshot = await getDocs(collection(db, 'clientes'));
      const atletasSnapshot = await getDocs(collection(db, 'atletas'));

      // Buscar en clientes
      for (const clienteDoc of clientesSnapshot.docs) {
        if (assignmentRef) break;
        const assignmentDocRef = doc(db, 'clientes', clienteDoc.id, 'clasesAsignadas', assignmentId);
        const assignmentDocSnap = await getDoc(assignmentDocRef);

        if (assignmentDocSnap.exists() && assignmentDocSnap.data().idClase === classId) {
          assignmentRef = assignmentDocRef;
          console.log('Asignación encontrada en clientes:', assignmentRef.path);
          break;
        }
      }

      // Buscar en atletas si no se encontró en clientes
      if (!assignmentRef) {
        for (const atletaDoc of atletasSnapshot.docs) {
          const assignmentDocRef = doc(db, 'atletas', atletaDoc.id, 'clasesAsignadas', assignmentId);
          const assignmentDocSnap = await getDoc(assignmentDocRef);

          if (assignmentDocSnap.exists() && assignmentDocSnap.data().idClase === classId) {
            assignmentRef = assignmentDocRef;
            console.log('Asignación encontrada en atletas:', assignmentRef.path);
            break;
          }
        }
      }
    }

    if (!assignmentRef) {
      return { success: false, error: 'Asignación no encontrada' };
    }

    // Eliminar la asignación
    await deleteDoc(assignmentRef);

    // Actualizar contador de participantes en la clase
    const classRef = doc(db, 'clases', classId);
    const classDoc = await getDoc(classRef);

    if (classDoc.exists()) {
      const currentParticipants = classDoc.data().participantesActuales || 0;
      await updateDoc(classRef, {
        participantesActuales: Math.max(0, currentParticipants - 1)
      });
    }

    console.log('Asignación eliminada exitosamente:', assignmentId);
    return { success: true, message: 'Usuario eliminado de la clase exitosamente' };

  } catch (error) {
    console.error('Error removing user from class:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subir imagen para una clase
 */
export const uploadClassImage = async (classId, file) => {
  try {
    const imageRef = ref(storage, `clases/${classId}/${file.name}`);
    const snapshot = await uploadBytes(imageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Actualizar el documento de la clase con la URL de la imagen
    const classRef = doc(db, 'clases', classId);
    await updateDoc(classRef, {
      imageUrl: downloadURL,
      updatedAt: serverTimestamp()
    });

    return { success: true, imageUrl: downloadURL };
  } catch (error) {
    console.error('Error uploading class image:', error);
    return { success: false, error: error.message };
  }
};