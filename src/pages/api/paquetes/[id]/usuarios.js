import { 
  collection,
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  collectionGroup 
} from 'firebase/firestore';
import { db } from '../../../../../lib/firebase';

export default async function handler(req, res) {
  // Solo permitir métodos GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { id: packageId } = req.query;
    const { 
      page = 1, 
      limit = 10, 
      search = '',
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    if (!packageId) {
      return res.status(400).json({ error: 'ID de paquete requerido' });
    }

    // Verificar que el paquete existe
    console.log('Buscando paquete con ID:', packageId);
    const packageRef = doc(db, 'packages', packageId);
    const packageDoc = await getDoc(packageRef);
    
    if (!packageDoc.exists()) {
      console.log('Paquete no encontrado para ID:', packageId);
      return res.status(404).json({ 
        error: 'Paquete no encontrado',
        packageId: packageId,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('Paquete encontrado:', packageDoc.data());

    const packageData = {
      id: packageDoc.id,
      ...packageDoc.data()
    };

    // Obtener todas las asignaciones del paquete
    const assignmentsQuery = query(
      collectionGroup(db, 'paquetesAsignados'),
      where('idPaquete', '==', packageId)
    );
    
    const querySnapshot = await getDocs(assignmentsQuery);
    const allUsers = [];
    
    // Obtener información de usuarios para cada asignación
    for (const assignmentDoc of querySnapshot.docs) {
      const assignmentData = assignmentDoc.data();
      const userPath = assignmentDoc.ref.parent.parent;
      
      if (userPath) {
        const userDoc = await getDoc(userPath);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userType = userPath.parent.id; // 'clientes' o 'atletas'
          
          allUsers.push({
            id: userDoc.id,
            name: `${userData.nombre} ${userData.apellidoPaterno} ${userData.apellidoMaterno || ''}`.trim(),
            email: userData.email || 'Sin email',
            type: userType === 'clientes' ? 'Cliente' : 'Atleta',
            assignedAt: assignmentData.fechaAsignacion,
            discount: assignmentData.descuento,
            discountPorcentaje: assignmentData.descuentoPorcentaje,
            originalPrice: assignmentData.precioOriginal,
            finalPrice: assignmentData.precioFinal,
            assignmentId: assignmentDoc.id,
            // Campos adicionales para facilitar búsqueda y ordenamiento
            rawUserData: userData
          });
        }
      }
    }

    // Filtrar por término de búsqueda si se proporciona
    let filteredUsers = allUsers;
    if (search.trim()) {
      const lowerSearchTerm = search.toLowerCase();
      
      filteredUsers = allUsers.filter(user => {
        return (
          user.name.toLowerCase().includes(lowerSearchTerm) ||
          user.email.toLowerCase().includes(lowerSearchTerm) ||
          user.type.toLowerCase().includes(lowerSearchTerm)
        );
      });
    }

    // Ordenar los resultados
    filteredUsers.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'type':
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        case 'assignedAt':
          aValue = a.assignedAt?.toDate?.() || new Date(0);
          bValue = b.assignedAt?.toDate?.() || new Date(0);
          break;
        case 'finalPrice':
          aValue = a.finalPrice || 0;
          bValue = b.finalPrice || 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    // Calcular paginación
    const totalUsers = filteredUsers.length;
    const itemsPerPage = Math.max(1, parseInt(limit));
    const currentPage = Math.max(1, parseInt(page));
    const totalPages = Math.ceil(totalUsers / itemsPerPage);
    
    // Obtener usuarios para la página actual
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    // Limpiar datos sensibles y formatear fechas para la respuesta
    const cleanedUsers = paginatedUsers.map(user => {
      const { rawUserData, ...cleanUser } = user;
      return {
        ...cleanUser,
        assignedAt: user.assignedAt?.toDate?.() || null
      };
    });

    res.status(200).json({
      success: true,
      data: {
        users: cleanedUsers,
        package: packageData,
        pagination: {
          currentPage: currentPage,
          totalPages: totalPages,
          totalItems: totalUsers,
          itemsPerPage: itemsPerPage,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1
        },
        filters: {
          search: search,
          sortBy: sortBy,
          sortOrder: sortOrder
        }
      }
    });

  } catch (error) {
    console.error('Error getting paginated assigned users:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
}