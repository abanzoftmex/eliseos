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
  getDocsFromServer,
  getDocFromServer
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

// ====== FUNCIONES PARA PRODUCTOS ÚNICOS ======

/**
 * Crear un nuevo producto único
 */
export const createProducto = async (productoData) => {
  try {
    const productoRef = doc(collection(db, 'productos'));

    const productoWithMetadata = {
      ...productoData,
      id: productoRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true
    };

    await setDoc(productoRef, productoWithMetadata);
    return { success: true, productoId: productoRef.id };
  } catch (error) {
    console.error('Error creating producto:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener todos los productos
 * Usa getDocsFromServer para evitar caché y obtener datos frescos
 */
export const getProductos = async () => {
  try {
    console.log('Cargando productos desde la colección "productos" (sin caché)...');

    // Usar getDocsFromServer para forzar lectura desde el servidor
    const snapshot = await getDocsFromServer(collection(db, 'productos'));

    console.log('Documentos encontrados:', snapshot.size);

    const allProductos = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log('Producto encontrado:', doc.id, data);
      allProductos.push({
        id: doc.id,
        ...data
      });
    });

    console.log('Total de productos cargados:', allProductos.length);

    return { success: true, productos: allProductos };
  } catch (error) {
    console.error('Error getting productos:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener un producto por ID
 */
export const getProductoById = async (productoId) => {
  try {
    const productoDoc = await getDoc(doc(db, 'productos', productoId));

    if (!productoDoc.exists()) {
      return { success: false, error: 'Producto no encontrado' };
    }

    return {
      success: true,
      producto: { id: productoDoc.id, ...productoDoc.data() }
    };
  } catch (error) {
    console.error('Error getting producto:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Actualizar un producto
 */
export const updateProducto = async (productoId, updateData) => {
  try {
    const productoRef = doc(db, 'productos', productoId);
    const updateWithTimestamp = {
      ...updateData,
      updatedAt: serverTimestamp()
    };

    await updateDoc(productoRef, updateWithTimestamp);
    return { success: true };
  } catch (error) {
    console.error('Error updating producto:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Eliminar un producto y todas sus asignaciones
 */
export const deleteProducto = async (productoId) => {
  try {
    // Primero, buscar todas las asignaciones de este producto
    const assignmentsQuery = query(
      collectionGroup(db, 'productosAsignados'),
      where('idProducto', '==', productoId)
    );
    const assignmentsSnapshot = await getDocs(assignmentsQuery);

    const affectedUsers = [];
    const deletePromises = [];
    const userFetchPromises = [];

    // Recopilar información de usuarios afectados y preparar eliminación
    assignmentsSnapshot.forEach((assignmentDoc) => {
      const data = assignmentDoc.data();
      const userId = assignmentDoc.ref.parent.parent.id;
      const userCollection = assignmentDoc.ref.parent.parent.parent.id;

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
              productoName: data.nombre,
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
              productoName: data.nombre,
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
            productoName: data.nombre,
            status: data.status
          });
        });

      userFetchPromises.push(userPromise);

      // Agregar eliminación a las promesas
      deletePromises.push(deleteDoc(assignmentDoc.ref));
    });

    // Esperar a que se obtengan todos los datos de usuarios
    await Promise.all(userFetchPromises);

    // Eliminar todas las asignaciones
    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
    }

    // Eliminar el producto
    await deleteDoc(doc(db, 'productos', productoId));

    return {
      success: true,
      affectedUsers,
      message: affectedUsers.length > 0
        ? `Producto eliminado. ${affectedUsers.length} asignación(es) eliminada(s).`
        : 'Producto eliminado exitosamente.'
    };
  } catch (error) {
    console.error('Error deleting producto:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subir imagen del producto
 */
export const uploadProductoImage = async (file, productoId) => {
  try {
    const storageRef = ref(storage, `productos/${productoId}/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return { success: true, imageUrl: downloadURL };
  } catch (error) {
    console.error('Error uploading producto image:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener conteo de asignaciones de productos
 */
export const getProductoAssignmentCounts = async () => {
  try {
    const assignmentsSnapshot = await getDocs(collectionGroup(db, 'productosAsignados'));

    const counts = {};
    let totalActive = 0;

    assignmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      const productoId = data.idProducto;

      if (!counts[productoId]) {
        counts[productoId] = { total: 0, active: 0 };
      }

      counts[productoId].total++;

      if (data.status === 'activo') {
        counts[productoId].active++;
        totalActive++;
      }
    });

    return { success: true, counts, totalActive };
  } catch (error) {
    console.error('Error getting producto assignment counts:', error);
    return { success: false, error: error.message, counts: {}, totalActive: 0 };
  }
};

// ====== FUNCIONES PARA ASIGNACIÓN DE PRODUCTOS ======

/**
 * Asignar producto a un cliente o atleta
 */
export const assignProductoToUser = async (userId, userType, productoData) => {
  try {
    const userCollection = userType === 'atleta' ? 'atletas' : 'clientes';
    const assignmentRef = doc(collection(db, userCollection, userId, 'productosAsignados'));

    const assignmentData = {
      id: assignmentRef.id,
      idProducto: productoData.id,
      nombre: productoData.name,
      precio: productoData.price,
      descripcion: productoData.description || '',
      imageUrl: productoData.imageUrl || '',
      status: 'activo',
      fechaAsignacion: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(assignmentRef, assignmentData);
    return { success: true, assignmentId: assignmentRef.id };
  } catch (error) {
    console.error('Error assigning producto:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener productos asignados a un usuario
 */
export const getUserProductos = async (userId, userType) => {
  try {
    const userCollection = userType === 'atleta' ? 'atletas' : 'clientes';
    const productosRef = collection(db, userCollection, userId, 'productosAsignados');
    const snapshot = await getDocs(productosRef);

    const productos = [];
    snapshot.forEach((doc) => {
      productos.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return { success: true, productos };
  } catch (error) {
    console.error('Error getting user productos:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Actualizar producto asignado
 */
export const updateAssignedProducto = async (userId, userType, assignmentId, updateData) => {
  try {
    const userCollection = userType === 'atleta' ? 'atletas' : 'clientes';
    const assignmentRef = doc(db, userCollection, userId, 'productosAsignados', assignmentId);

    const updateWithTimestamp = {
      ...updateData,
      updatedAt: serverTimestamp()
    };

    await updateDoc(assignmentRef, updateWithTimestamp);
    return { success: true };
  } catch (error) {
    console.error('Error updating assigned producto:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Eliminar producto asignado
 */
export const deleteAssignedProducto = async (userId, userType, assignmentId) => {
  try {
    const userCollection = userType === 'atleta' ? 'atletas' : 'clientes';
    const assignmentRef = doc(db, userCollection, userId, 'productosAsignados', assignmentId);

    await deleteDoc(assignmentRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting assigned producto:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Formatear precio
 */
export const formatPrice = (price) => {
  if (typeof price !== 'number') {
    return '$0.00';
  }
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(price);
};

/**
 * Obtener inventario disponible de un producto
 * Calcula el inventario restante basado en las asignaciones realizadas
 */
export const getProductoInventario = async (productoId) => {
  try {
    // Obtener el producto para conocer el inventario inicial
    const productoResult = await getProductoById(productoId);
    if (!productoResult.success) {
      return { success: false, error: 'Producto no encontrado' };
    }

    const producto = productoResult.producto;
    const inventarioInicial = producto.inventarioInicial || 0;

    // Contar todas las asignaciones del producto
    const assignmentsQuery = query(
      collectionGroup(db, 'productosAsignados'),
      where('idProducto', '==', productoId)
    );
    
    const assignmentsSnapshot = await getDocs(assignmentsQuery);
    const totalAsignaciones = assignmentsSnapshot.size;

    // Calcular inventario disponible
    const inventarioDisponible = Math.max(0, inventarioInicial - totalAsignaciones);

    return {
      success: true,
      inventario: {
        inicial: inventarioInicial,
        asignado: totalAsignaciones,
        disponible: inventarioDisponible
      }
    };
  } catch (error) {
    console.error('Error getting producto inventario:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener inventario de todos los productos
 * Devuelve un objeto con el inventario de cada producto indexado por ID
 */
export const getAllProductosInventario = async () => {
  try {
    // Obtener todos los productos
    const productosResult = await getProductos();
    if (!productosResult.success) {
      return { success: false, error: 'Error al obtener productos' };
    }

    const inventarios = {};

    // Obtener todas las asignaciones de una vez
    const assignmentsSnapshot = await getDocs(collectionGroup(db, 'productosAsignados'));
    
    // Contar asignaciones por producto
    const asignacionesPorProducto = {};
    assignmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      const productoId = data.idProducto;
      asignacionesPorProducto[productoId] = (asignacionesPorProducto[productoId] || 0) + 1;
    });

    // Calcular inventario para cada producto
    productosResult.productos.forEach((producto) => {
      const inventarioInicial = producto.inventarioInicial || 0;
      const totalAsignaciones = asignacionesPorProducto[producto.id] || 0;
      const inventarioDisponible = Math.max(0, inventarioInicial - totalAsignaciones);

      inventarios[producto.id] = {
        inicial: inventarioInicial,
        asignado: totalAsignaciones,
        disponible: inventarioDisponible
      };
    });

    return {
      success: true,
      inventarios
    };
  } catch (error) {
    console.error('Error getting all productos inventario:', error);
    return { success: false, error: error.message };
  }
};
