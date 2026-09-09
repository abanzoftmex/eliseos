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
  collectionGroup
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { createIngresoInScienceChago, deleteTransactionInScienceChago, generateTransactionExternalId } from '../scienceChago';

// ====== TIPOS DE PAQUETES ======
export const PACKAGE_TYPES = {
  GRUPAL: 'grupal',
  PERSONALIZADO: 'personalizado',
  SESION: 'sesion'
};

export const PACKAGE_TYPE_LABELS = {
  [PACKAGE_TYPES.GRUPAL]: 'Clase Grupal',
  [PACKAGE_TYPES.PERSONALIZADO]: 'Entrenamiento Personalizado',
  [PACKAGE_TYPES.SESION]: 'Sesión de Rehabilitación/Masaje'
};

// ====== FUNCIONES AUXILIARES ======

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

// ====== FUNCIONES PARA PAQUETES ======

/**
 * Crear un nuevo paquete
 */
export const createPackage = async (packageData) => {
  try {
    const packageRef = doc(collection(db, 'packages'));

    // Validar que el tipo sea válido
    const validTypes = ['grupal', 'personalizado', 'sesion'];
    if (packageData.tipo && !validTypes.includes(packageData.tipo)) {
      return { success: false, error: 'Tipo de paquete no válido. Debe ser: grupal, personalizado o sesion' };
    }

    const packageWithMetadata = {
      ...packageData,
      id: packageRef.id,
      tipo: packageData.tipo || 'grupal', // Tipo por defecto
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true
    };

    await setDoc(packageRef, packageWithMetadata);
    return { success: true, packageId: packageRef.id };
  } catch (error) {
    console.error('Error creating package:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener todos los paquetes
 */
export const getPackages = async () => {
  try {
    console.log('Cargando paquetes desde la colección "packages"...');

    // Obtener todos los paquetes sin filtros ni ordenamiento
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

    // Por ahora, mostrar todos los paquetes sin filtrar por isActive
    // para diagnosticar el problema
    console.log('Total de paquetes cargados:', allPackages.length);

    return { success: true, packages: allPackages };
  } catch (error) {
    console.error('Error getting packages:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener un paquete por ID
 */
export const getPackageById = async (packageId) => {
  try {
    const packageDoc = await getDoc(doc(db, 'packages', packageId));

    if (!packageDoc.exists()) {
      return { success: false, error: 'Paquete no encontrado' };
    }

    return {
      success: true,
      package: { id: packageDoc.id, ...packageDoc.data() }
    };
  } catch (error) {
    console.error('Error getting package:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Actualizar un paquete
 */
export const updatePackage = async (packageId, updateData) => {
  try {
    // Validar que el tipo sea válido si se está actualizando
    const validTypes = ['grupal', 'personalizado', 'sesion'];
    if (updateData.tipo && !validTypes.includes(updateData.tipo)) {
      return { success: false, error: 'Tipo de paquete no válido. Debe ser: grupal, personalizado o sesion' };
    }

    const packageRef = doc(db, 'packages', packageId);
    const updateWithTimestamp = {
      ...updateData,
      updatedAt: serverTimestamp()
    };

    await updateDoc(packageRef, updateWithTimestamp);
    return { success: true };
  } catch (error) {
    console.error('Error updating package:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Eliminar un paquete y todas sus asignaciones
 */
export const deletePackage = async (packageId) => {
  try {
    // Primero, buscar todas las asignaciones de este paquete
    const assignmentsQuery = query(
      collectionGroup(db, 'paquetesAsignados'),
      where('idPaquete', '==', packageId)
    );
    const assignmentsSnapshot = await getDocs(assignmentsQuery);

    const affectedUsers = [];
    const deletePromises = [];
    const userFetchPromises = [];
    const transactionExternalIds = []; // Para eliminar transacciones en Science Chago

    // Recopilar información de usuarios afectados y preparar eliminación
    assignmentsSnapshot.forEach((assignmentDoc) => {
      const data = assignmentDoc.data();
      const userId = assignmentDoc.ref.parent.parent.id; // Obtener el ID del usuario desde la ruta
      const userCollection = assignmentDoc.ref.parent.parent.parent.id; // 'clientes' o 'atletas'

      // Guardar el transactionExternalId si existe
      if (data.transactionExternalId) {
        transactionExternalIds.push({
          externalId: data.transactionExternalId,
          packageName: data.nombre || 'Sin nombre'
        });
      }

      // Crear promesa para obtener datos del usuario
      const userPromise = getDoc(doc(db, userCollection, userId))
        .then((userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Manejar tanto apellidos como apellidoPaterno/apellidoMaterno
            const apellidos = userData.apellidos || `${userData.apellidoPaterno || ''} ${userData.apellidoMaterno || ''}`.trim();
            const userName = `${userData.nombre || ''} ${apellidos}`.trim() || 'Sin nombre';

            affectedUsers.push({
              userId,
              userName,
              userCollection,
              assignmentId: assignmentDoc.id,
              packageName: data.nombre,
              sesionesRestantes: data.sesionesRestantes || 0,
              status: data.status
            });
          } else {
            // Si no se encuentra el usuario, usar solo el ID
            console.warn(`Usuario no encontrado: ${userId}`);
            affectedUsers.push({
              userId,
              userName: `Usuario ${userId}`,
              userCollection,
              assignmentId: assignmentDoc.id,
              packageName: data.nombre,
              sesionesRestantes: data.sesionesRestantes || 0,
              status: data.status
            });
          }
        })
        .catch((error) => {
          console.error(`Error fetching user ${userId}:`, error);
          // En caso de error, usar solo el ID
          affectedUsers.push({
            userId,
            userName: `Usuario ${userId}`,
            userCollection,
            assignmentId: assignmentDoc.id,
            packageName: data.nombre,
            sesionesRestantes: data.sesionesRestantes || 0,
            status: data.status
          });
        });

      userFetchPromises.push(userPromise);

      // Agregar promesa de eliminación
      deletePromises.push(deleteDoc(assignmentDoc.ref));
    });

    // Esperar a que se obtengan todos los datos de usuarios
    await Promise.all(userFetchPromises);

    // Eliminar todas las asignaciones
    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
    }

    // Eliminar transacciones en Science Chago (no bloquear si falla)
    if (transactionExternalIds.length > 0) {
      try {
        await Promise.all(
          transactionExternalIds.map(({ externalId, packageName }) =>
            deleteTransactionInScienceChago(externalId, `Paquete eliminado: ${packageName}`)
          )
        );
      } catch (syncError) {
        console.error('Error deleting transactions in Science Chago during package deletion:', syncError);
      }
    }

    // Ahora eliminar el paquete permanentemente (hard delete)
    const packageRef = doc(db, 'packages', packageId);
    await deleteDoc(packageRef);

    return {
      success: true,
      affectedUsers,
      message: affectedUsers.length > 0
        ? `Paquete eliminado. ${affectedUsers.length} usuario(s) afectado(s)`
        : 'Paquete eliminado sin asignaciones activas'
    };
  } catch (error) {
    console.error('Error deleting package:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subir imagen de paquete
 */
export const uploadPackageImage = async (file, packageId) => {
  try {
    const imageRef = ref(storage, `packages/${packageId}/${file.name}`);
    const snapshot = await uploadBytes(imageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return { success: true, imageUrl: downloadURL };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { success: false, error: error.message };
  }
};

// ====== FUNCIONES PARA ASIGNACIONES DE PAQUETES ======

/**
 * Asignar paquete a un usuario (nueva estructura con subcolecciones)
 * @param {string} userId - ID del usuario
 * @param {string} packageId - ID del paquete
 * @param {string|null} discountName - Nombre del descuento (opcional)
 * @param {string|Date|null} customFechaAsignacion - Fecha personalizada de asignación (opcional)
 * @param {string|null} sucursalId - ID de la sucursal donde se asigna el paquete (opcional)
 */
export const assignPackageToUser = async (userId, packageId, discountInput = null, customFechaAsignacion = null, sucursalId = null) => {
  try {
    // Obtener información del paquete
    const packageResult = await getPackageById(packageId);
    if (!packageResult.success) {
      return packageResult;
    }

    const packageData = packageResult.package;

    // Parsear descuento y calcular precio
    const parsedDiscount = parseDiscountInput(discountInput, packageData);
    const finalPrice = calculateDiscountedPrice(packageData, discountInput);

    // Determinar la colección del usuario (clientes o atletas)
    const userType = await getUserType(userId);
    if (!userType) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    // Crear documento en la subcolección del usuario
    const userCollection = userType === 'cliente' ? 'clientes' : 'atletas';
    const assignmentRef = doc(collection(db, userCollection, userId, 'paquetesAsignados'));

    // Determinar la fecha de asignación
    let fechaAsignacion;
    if (customFechaAsignacion) {
      // Si se proporciona una fecha personalizada, convertirla a Timestamp
      if (typeof customFechaAsignacion === 'string') {
        // Convertir string YYYY-MM-DD a Date usando hora local (no UTC)
        // Esto evita el problema de timezone donde el día puede cambiar
        const [year, month, day] = customFechaAsignacion.split('-').map(Number);
        const date = new Date(year, month - 1, day, 12, 0, 0); // Usar mediodía para evitar problemas de timezone
        fechaAsignacion = date;
      } else if (customFechaAsignacion instanceof Date) {
        fechaAsignacion = customFechaAsignacion;
      } else {
        fechaAsignacion = serverTimestamp();
      }
    } else {
      // Si no se proporciona, usar serverTimestamp
      fechaAsignacion = serverTimestamp();
    }

    // Generar un externalId único para la transacción en Science Chago
    const transactionExternalId = generateTransactionExternalId();

    // Determinar la sucursal de asignación (usar la proporcionada o la primera del paquete o 'valquirico' por defecto)
    const finalSucursalId = sucursalId || (packageData.sucursales && packageData.sucursales.length > 0 ? packageData.sucursales[0] : 'valquirico');

    const assignmentData = {
      id: assignmentRef.id,
      idPaquete: packageId,
      nombre: packageData.name,
      descripcion: packageData.description || packageData.descripcion || '',
      tipo: packageData.tipo || 'grupal', // Guardar el tipo del paquete
      precioOriginal: packageData.price,
      descuento: parsedDiscount ? parsedDiscount.name : null,
      descuentoNombre: parsedDiscount ? parsedDiscount.name : null,
      descuentoPorcentaje: parsedDiscount ? parsedDiscount.percentage : null,
      descuentoAplicado: parsedDiscount ? {
        name: parsedDiscount.name,
        percentage: parsedDiscount.percentage,
        amount: Math.round((packageData.price * (parsedDiscount.percentage / 100)) * 100) / 100
      } : null,
      precioFinal: finalPrice,
      precioTotal: finalPrice, // Alias para precioFinal
      montoPagado: 0, // Por defecto, los paquetes NO están pagados al asignarlos (pendiente de pago)
      tipoUsuario: packageData.userType || packageData.tipoUsuario || '',
      numeroServicios: packageData.sessions || packageData.numeroServicios || 0,
      sessionsTaken: [], // Array para rastrear sesiones tomadas
      discounts: packageData.discounts || [],
      fechaAsignacion: fechaAsignacion,
      sucursalId: finalSucursalId, // Guardar la sucursal de asignación
      status: 'active',
      activo: true,
      transactionExternalId: transactionExternalId // Guardar el ID para poder eliminar después
    };

    await setDoc(assignmentRef, assignmentData);

    // Crear ingreso en Science Chago (no bloquear el flujo principal si falla)
    try {
      // Usar la fecha original del formulario (customFechaAsignacion viene como string YYYY-MM-DD)
      // Si no hay fecha personalizada, usar la fecha actual en formato local
      let transactionDate;
      if (customFechaAsignacion && typeof customFechaAsignacion === 'string') {
        // Usar directamente el string del formulario
        transactionDate = customFechaAsignacion.split('T')[0];
      } else {
        // Usar fecha actual local
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        transactionDate = `${year}-${month}-${day}`;
      }
      
      await createIngresoInScienceChago({
        externalId: transactionExternalId,
        sucursalId: finalSucursalId,
        clienteId: userId,
        amount: finalPrice,
        date: transactionDate,
        concepto: packageData.name,
        description: `Asignación de paquete: ${packageData.name}${parsedDiscount ? ` (Descuento: ${parsedDiscount.name} - ${parsedDiscount.percentage}%)` : ''}`
      });
    } catch (syncError) {
      console.error('Error syncing package assignment to Science Chago:', syncError);
      // No retornar error, la asignación local fue exitosa
    }

    return { success: true, assignmentId: assignmentRef.id };
  } catch (error) {
    console.error('Error assigning package:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener paquetes asignados a un usuario (nueva estructura con subcolecciones)
 */
export const getUserPackages = async (userId) => {
  try {
    // Determinar el tipo de usuario
    const userType = await getUserType(userId);
    if (!userType) {
      return { success: false, error: 'Usuario no encontrado', packages: [] };
    }

    // Obtener paquetes de la subcolección correspondiente
    const userCollection = userType === 'cliente' ? 'clientes' : 'atletas';
    const q = query(
      collection(db, userCollection, userId, 'paquetesAsignados'),
      orderBy('fechaAsignacion', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const packages = [];

    querySnapshot.forEach((doc) => {
      packages.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return { success: true, packages };
  } catch (error) {
    console.error('Error getting user packages:', error);
    return { success: false, error: error.message, packages: [] };
  }
};

/**
 * Obtener paquetes compatibles de un usuario para una clase específica
 * Filtra por tipo de paquete compatible y verifica sesiones disponibles
 */
export const getUserCompatiblePackages = async (userId, classType) => {
  try {
    console.log('[getUserCompatiblePackages] userId:', userId, 'classType:', classType);

    // Determinar el tipo de usuario
    const userType = await getUserType(userId);
    if (!userType) {
      console.log('[getUserCompatiblePackages] Usuario no encontrado');
      return { success: false, error: 'Usuario no encontrado', packages: [] };
    }

    console.log('[getUserCompatiblePackages] userType:', userType);

    // Obtener paquetes de la subcolección correspondiente
    const userCollection = userType === 'cliente' ? 'clientes' : 'atletas';
    const q = query(
      collection(db, userCollection, userId, 'paquetesAsignados'),
      where('activo', '==', true),
      orderBy('fechaAsignacion', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const packages = [];

    querySnapshot.forEach((doc) => {
      const packageData = doc.data();
      packages.push({
        id: doc.id,
        ...packageData
      });
    });

    console.log('[getUserCompatiblePackages] Total packages found:', packages.length);
    console.log('[getUserCompatiblePackages] Packages:', packages.map(p => ({
      id: p.id,
      nombre: p.nombre,
      tipo: p.tipo,
      idPaquete: p.idPaquete
    })));

    // Si algún paquete no tiene el campo tipo, obtenerlo del documento original
    await Promise.all(packages.map(async (pkg) => {
      if (!pkg.tipo && pkg.idPaquete) {
        console.log('[getUserCompatiblePackages] Fetching tipo for package:', pkg.idPaquete);
        const pkgDoc = await getDoc(doc(db, 'packages', pkg.idPaquete));
        if (pkgDoc.exists()) {
          pkg.tipo = pkgDoc.data().tipo;
          console.log('[getUserCompatiblePackages] Tipo found:', pkg.tipo);
        }
      }
    }));

    // Filtrar paquetes compatibles con el tipo de clase
    const compatiblePackages = packages.filter(pkg => {
      const isCompatible = pkg.tipo === classType;
      console.log('[getUserCompatiblePackages] Package', pkg.nombre, 'tipo:', pkg.tipo, 'compatible with', classType, '?', isCompatible);
      return isCompatible;
    });

    console.log('[getUserCompatiblePackages] Compatible packages:', compatiblePackages.length);

    // Calcular sesiones disponibles para cada paquete
    const packagesWithAvailability = compatiblePackages.map(pkg => {
      const totalSessions = pkg.numeroServicios || 0;
      const sessionsTaken = pkg.sessionsTaken ? pkg.sessionsTaken.length : 0;
      const availableSessions = totalSessions - sessionsTaken;

      return {
        ...pkg,
        totalSessions,
        sessionsTaken: sessionsTaken,
        availableSessions,
        hasAvailableSessions: availableSessions > 0
      };
    });

    return { success: true, packages: packagesWithAvailability };
  } catch (error) {
    console.error('Error getting compatible packages:', error);
    return { success: false, error: error.message, packages: [] };
  }
};

/**
 * Registrar una sesión tomada en un paquete asignado
 */
export const recordPackageSession = async (userId, packageAssignmentId, classId, sessionDate) => {
  try {
    // Determinar el tipo de usuario
    const userType = await getUserType(userId);
    if (!userType) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    const userCollection = userType === 'cliente' ? 'clientes' : 'atletas';
    const packageRef = doc(db, userCollection, userId, 'paquetesAsignados', packageAssignmentId);

    // Obtener el paquete actual
    const packageDoc = await getDoc(packageRef);
    if (!packageDoc.exists()) {
      return { success: false, error: 'Paquete no encontrado' };
    }

    const packageData = packageDoc.data();
    const currentSessions = packageData.sessionsTaken || [];
    const totalSessions = packageData.numeroServicios || 0;

    // Verificar que haya sesiones disponibles
    if (currentSessions.length >= totalSessions) {
      return { success: false, error: 'No hay sesiones disponibles en este paquete' };
    }

    // Agregar la nueva sesión
    // Nota: No podemos usar serverTimestamp() dentro de arrays en Firestore
    // Usamos la fecha actual en formato ISO string
    const newSession = {
      classId,
      date: sessionDate,
      recordedAt: new Date().toISOString()
    };

    await updateDoc(packageRef, {
      sessionsTaken: [...currentSessions, newSession],
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      remainingSessions: totalSessions - (currentSessions.length + 1)
    };
  } catch (error) {
    console.error('Error recording package session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener todos los usuarios (clientes y atletas) para selección
 */
export const getAllUsers = async () => {
  try {
    // Obtener clientes
    const clientesSnapshot = await getDocs(collection(db, 'clientes'));
    const clientes = clientesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      type: 'cliente'
    }));

    // Obtener atletas
    const atletasSnapshot = await getDocs(collection(db, 'atletas'));
    const atletas = atletasSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      type: 'atleta'
    }));

    // Combinar y ordenar
    const allUsers = [...clientes, ...atletas].sort((a, b) => {
      const nameA = `${a.nombre} ${a.apellidos}`.toLowerCase();
      const nameB = `${b.nombre} ${b.apellidos}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return { success: true, users: allUsers };
  } catch (error) {
    console.error('Error getting users:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Cancelar asignación de paquete
 */
export const cancelUserPackage = async (assignmentId) => {
  try {
    const assignmentRef = doc(db, 'userPackages', assignmentId);
    await updateDoc(assignmentRef, {
      status: 'cancelled',
      cancelledAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error cancelling package assignment:', error);
    return { success: false, error: error.message };
  }
};

// ====== FUNCIONES AUXILIARES ======

/**
 * Helper para parsear cualquier formato de descuento (objeto, JSON, número o string de nombre)
 */
export const parseDiscountInput = (discountInput, packageData = null) => {
  if (!discountInput && discountInput !== 0) return null;

  let parsed = null;

  if (typeof discountInput === 'object' && discountInput !== null) {
    parsed = { ...discountInput };
  } else if (typeof discountInput === 'number') {
    parsed = { name: `${discountInput}%`, percentage: discountInput };
  } else if (typeof discountInput === 'string') {
    const trimmed = discountInput.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        parsed = JSON.parse(trimmed);
      } catch (e) {
        parsed = null;
      }
    }

    // Si no fue JSON, ver si es un número string ("4.76", "10")
    if (!parsed && !isNaN(Number(trimmed)) && trimmed !== '') {
      parsed = { name: `${trimmed}%`, percentage: Number(trimmed) };
    }

    // Si es un nombre ("Promoción"), buscar en packageData.discounts
    if (!parsed) {
      if (packageData && Array.isArray(packageData.discounts)) {
        const found = packageData.discounts.find(d => d.name === trimmed);
        if (found) {
          parsed = { name: found.name, percentage: Number(found.percentage) };
        } else {
          parsed = { name: trimmed, percentage: 0 };
        }
      } else {
        parsed = { name: trimmed, percentage: 0 };
      }
    }
  }

  if (parsed && typeof parsed.percentage !== 'undefined') {
    parsed.percentage = Number(parsed.percentage);
    if (isNaN(parsed.percentage)) parsed.percentage = 0;
    parsed.name = parsed.name || `${parsed.percentage}%`;
    return parsed;
  }

  return null;
};

/**
 * Calcular precio con descuento
 */
export const calculateDiscountedPrice = (packageData, discountInput) => {
  if (!packageData?.price) return 0;
  if (!discountInput && discountInput !== 0) {
    return packageData.price;
  }

  const discount = parseDiscountInput(discountInput, packageData);
  if (!discount || !discount.percentage || discount.percentage <= 0) {
    return packageData.price;
  }

  const discountAmount = (packageData.price * discount.percentage) / 100;
  return Math.round((packageData.price - discountAmount) * 100) / 100;
};

/**
 * Formatear precio para mostrar
 */
export const formatPrice = (price) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(price);
};

/**
 * Validar datos de paquete
 */
export const validatePackageData = (packageData) => {
  const errors = [];

  if (!packageData.name?.trim()) {
    errors.push('El nombre del paquete es requerido');
  }

  if (!packageData.targetAudience) {
    errors.push('El público objetivo es requerido');
  }

  if (!packageData.paymentType) {
    errors.push('El tipo de pago es requerido');
  }

  if (!packageData.price || packageData.price <= 0) {
    errors.push('El precio debe ser mayor a 0');
  }

  if (!packageData.description?.trim()) {
    errors.push('La descripción es requerida');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Remover paquete de un usuario (nueva estructura con subcolecciones)
 */
export const removePackageFromUser = async (userId, assignmentId) => {
  try {
    // Determinar el tipo de usuario
    const userType = await getUserType(userId);
    if (!userType) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    // Obtener la asignación antes de eliminar para extraer el transactionExternalId
    const userCollection = userType === 'cliente' ? 'clientes' : 'atletas';
    const assignmentRef = doc(db, userCollection, userId, 'paquetesAsignados', assignmentId);
    const assignmentDoc = await getDoc(assignmentRef);
    const assignmentData = assignmentDoc.exists() ? assignmentDoc.data() : null;

    // Eliminar de la subcolección correspondiente
    await deleteDoc(assignmentRef);

    // Eliminar transacción en Science Chago si existe el externalId
    if (assignmentData?.transactionExternalId) {
      try {
        await deleteTransactionInScienceChago(
          assignmentData.transactionExternalId,
          `Paquete desasignado: ${assignmentData.nombre || 'Sin nombre'}`
        );
      } catch (syncError) {
        console.error('Error deleting transaction in Science Chago:', syncError);
        // No retornar error, la eliminación local fue exitosa
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error removing package from user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener estadísticas de asignaciones de paquetes
 */
export const getPackageAssignmentStats = async () => {
  try {
    // Obtener todas las asignaciones usando collectionGroup
    const assignmentsQuery = collectionGroup(db, 'paquetesAsignados');
    const querySnapshot = await getDocs(assignmentsQuery);

    const stats = {
      totalAssignments: querySnapshot.size,
      activeAssignments: 0,
      packageCounts: {}
    };

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Contar asignaciones activas
      if (data.status === 'active') {
        stats.activeAssignments++;
      }

      // Contar por paquete
      const packageName = data.nombre || 'Sin nombre';
      stats.packageCounts[packageName] = (stats.packageCounts[packageName] || 0) + 1;
    });

    return { success: true, stats };
  } catch (error) {
    console.error('Error getting assignment stats:', error);
    return { success: false, error: error.message, stats: null };
  }
};

/**
 * Obtener conteos de usuarios asignados por paquete
 */
export const getPackageAssignmentCounts = async () => {
  try {
    const assignmentsQuery = collectionGroup(db, 'paquetesAsignados');
    const querySnapshot = await getDocs(assignmentsQuery);

    const counts = {};
    let totalActive = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const packageId = data.idPaquete;

      if (packageId) {
        counts[packageId] = (counts[packageId] || 0) + 1;
        if (data.status === 'active' || !data.status) {
          totalActive++;
        }
      }
    });

    return { success: true, counts, totalActive };
  } catch (error) {
    console.error('Error getting package assignment counts:', error);
    return { success: false, error: error.message, counts: {}, totalActive: 0 };
  }
};

/**
 * Obtener usuarios asignados a un paquete específico
 */
export const getPackageAssignedUsers = async (packageId) => {
  try {
    const assignmentsQuery = query(
      collectionGroup(db, 'paquetesAsignados'),
      where('idPaquete', '==', packageId)
    );

    const querySnapshot = await getDocs(assignmentsQuery);
    const users = [];

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
            type: userType === 'clientes' ? 'Cliente' : 'Atleta',
            assignedAt: assignmentData.fechaAsignacion,
            discount: assignmentData.descuento,
            finalPrice: assignmentData.precioFinal,
            assignmentId: assignmentDoc.id
          });
        }
      }
    }

    return { success: true, users };
  } catch (error) {
    console.error('Error getting package assigned users:', error);
    return { success: false, error: error.message, users: [] };
  }
};

/**
 * Eliminar un usuario de un paquete
 */
export const removeUserFromPackage = async (packageId, assignmentId) => {
  try {
    console.log('Eliminando asignación:', { packageId, assignmentId });

    // Buscar la asignación en todas las subcolecciones de paquetesAsignados
    const assignmentsQuery = query(
      collectionGroup(db, 'paquetesAsignados'),
      where('idPaquete', '==', packageId)
    );

    const querySnapshot = await getDocs(assignmentsQuery);
    let assignmentRef = null;
    let assignmentData = null;

    for (const assignmentDoc of querySnapshot.docs) {
      if (assignmentDoc.id === assignmentId) {
        assignmentRef = assignmentDoc.ref;
        assignmentData = assignmentDoc.data();
        console.log('Asignación encontrada en:', assignmentRef.path);
        break;
      }
    }

    if (!assignmentRef) {
      return { success: false, error: 'Asignación no encontrada' };
    }

    // Eliminar la asignación
    await deleteDoc(assignmentRef);

    // Eliminar transacción en Science Chago si existe el externalId
    if (assignmentData?.transactionExternalId) {
      try {
        await deleteTransactionInScienceChago(
          assignmentData.transactionExternalId,
          `Usuario removido del paquete: ${assignmentData.nombre || 'Sin nombre'}`
        );
      } catch (syncError) {
        console.error('Error deleting transaction in Science Chago:', syncError);
        // No retornar error, la eliminación local fue exitosa
      }
    }

    console.log('Asignación eliminada exitosamente:', assignmentId);
    return { success: true, message: 'Usuario eliminado del paquete exitosamente' };

  } catch (error) {
    console.error('Error removing user from package:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Actualizar un paquete asignado (fecha de asignación, descuento, etc.)
 * @param {string} userId - ID del usuario
 * @param {string} assignmentId - ID de la asignación
 * @param {Object} updateData - Datos a actualizar (fechaAsignacion, descuento, etc.)
 */
export const updateAssignedPackage = async (userId, assignmentId, updateData) => {
  try {
    console.log('Actualizando paquete asignado:', { userId, assignmentId, updateData });

    // Determinar el tipo de usuario
    const userType = await getUserType(userId);
    if (!userType) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    const userCollection = userType === 'cliente' ? 'clientes' : 'atletas';
    const assignmentRef = doc(db, userCollection, userId, 'paquetesAsignados', assignmentId);

    // Obtener el documento actual
    const assignmentDoc = await getDoc(assignmentRef);
    if (!assignmentDoc.exists()) {
      return { success: false, error: 'Paquete asignado no encontrado' };
    }

    const currentData = assignmentDoc.data();

    // Preparar datos de actualización
    const updates = {
      updatedAt: serverTimestamp()
    };

    // Si se actualiza la fecha de asignación
    if (updateData.fechaAsignacion) {
      if (typeof updateData.fechaAsignacion === 'string') {
        // Convertir string YYYY-MM-DD a Date usando hora local (no UTC)
        const [year, month, day] = updateData.fechaAsignacion.split('-').map(Number);
        updates.fechaAsignacion = new Date(year, month - 1, day, 12, 0, 0);
      } else if (updateData.fechaAsignacion instanceof Date) {
        updates.fechaAsignacion = updateData.fechaAsignacion;
      }
    }

    // Si se actualiza el descuento
    if (updateData.descuento !== undefined) {
      const parsedDiscount = parseDiscountInput(updateData.descuento, currentData);

      if (parsedDiscount && parsedDiscount.percentage > 0) {
        updates.descuento = parsedDiscount.name;
        updates.descuentoNombre = parsedDiscount.name;
        updates.descuentoPorcentaje = parsedDiscount.percentage;
        updates.descuentoAplicado = {
          name: parsedDiscount.name,
          percentage: parsedDiscount.percentage,
          amount: Math.round((currentData.precioOriginal * (parsedDiscount.percentage / 100)) * 100) / 100
        };

        const discountAmount = (currentData.precioOriginal * parsedDiscount.percentage) / 100;
        updates.precioFinal = Math.round((currentData.precioOriginal - discountAmount) * 100) / 100;
        updates.precioTotal = updates.precioFinal;
      } else {
        // Sin descuento
        updates.descuento = null;
        updates.descuentoNombre = null;
        updates.descuentoPorcentaje = null;
        updates.descuentoAplicado = null;
        updates.precioFinal = currentData.precioOriginal;
        updates.precioTotal = currentData.precioOriginal;
      }
    }

    // Actualizar el documento
    await updateDoc(assignmentRef, updates);

    console.log('Paquete asignado actualizado exitosamente:', assignmentId);
    return { success: true, message: 'Paquete actualizado exitosamente' };

  } catch (error) {
    console.error('Error updating assigned package:', error);
    return { success: false, error: error.message };
  }
};