import { 
  getClassById,
  getClassAssignedUsers,
  assignUserToClass
} from '../../../../../lib/firebase/classesService';
import { recordPackageSession } from '../../../../../lib/firebase/packagesService';

export default async function handler(req, res) {
  const { id: classId } = req.query;

  // Manejar POST: Agregar participantes
  if (req.method === 'POST') {
    return handleAddParticipants(req, res, classId);
  }

  // Manejar GET: Obtener lista de participantes
  if (req.method === 'GET') {
    return handleGetParticipants(req, res, classId);
  }

  // Método no permitido
  return res.status(405).json({ error: 'Método no permitido' });
}

/**
 * Agregar participantes a una clase
 */
async function handleAddParticipants(req, res, classId) {
  try {
    const { usuarios, fechaAsignacion, notas } = req.body;

    if (!classId) {
      return res.status(400).json({ error: 'ID de clase requerido' });
    }

    if (!usuarios || !Array.isArray(usuarios) || usuarios.length === 0) {
      return res.status(400).json({ error: 'Debe proporcionar al menos un usuario' });
    }

    // Verificar que la clase existe
    const classResult = await getClassById(classId);
    if (!classResult.success) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }

    const classData = classResult.class;

    // Verificar límite de participantes si aplica
    const currentUsers = await getClassAssignedUsers(classId);
    const currentCount = currentUsers.success ? currentUsers.users.length : 0;
    const maxParticipants = classData.maxParticipantes || 0;

    if (maxParticipants > 0 && (currentCount + usuarios.length) > maxParticipants) {
      return res.status(400).json({ 
        error: `Esta clase tiene un límite de ${maxParticipants} participantes. Actualmente hay ${currentCount} y estás intentando agregar ${usuarios.length} más.` 
      });
    }

    // Asignar cada usuario a la clase
    const results = [];
    const errors = [];

    for (const usuario of usuarios) {
      try {
        const { userId, userType, packageAssignmentId } = usuario;
        
        if (!userId || !userType) {
          errors.push({ userId, error: 'Datos de usuario incompletos' });
          continue;
        }

        // Validar que el paquete tenga sesiones disponibles si se proporciona
        if (packageAssignmentId) {
          const sessionResult = await recordPackageSession(
            userId, 
            packageAssignmentId, 
            classId, 
            fechaAsignacion || new Date().toISOString()
          );
          
          if (!sessionResult.success) {
            errors.push({ 
              userId, 
              error: `Error al registrar sesión del paquete: ${sessionResult.error}` 
            });
            continue;
          }
        }

        const assignmentData = {
          notas: notas || '',
          packageAssignmentId: packageAssignmentId || null
        };

        // Si se proporciona fecha de asignación, usarla
        if (fechaAsignacion) {
          assignmentData.fechaEspecifica = fechaAsignacion;
        }

        const result = await assignUserToClass(classId, userId, userType, assignmentData);
        
        if (result.success) {
          results.push({ 
            userId, 
            assignmentId: result.assignmentId,
            success: true 
          });
        } else {
          errors.push({ userId, error: result.error });
        }
      } catch (error) {
        console.error(`Error assigning user ${usuario.userId}:`, error);
        errors.push({ userId: usuario.userId, error: error.message });
      }
    }

    // Responder con resultados
    const successCount = results.length;
    const errorCount = errors.length;

    if (successCount === 0) {
      return res.status(500).json({
        success: false,
        error: 'No se pudo agregar ningún participante',
        details: errors
      });
    }

    return res.status(200).json({
      success: true,
      message: `Se agregaron ${successCount} participante(s) exitosamente${errorCount > 0 ? ` (${errorCount} fallaron)` : ''}`,
      data: {
        added: results,
        errors: errors,
        totalAdded: successCount,
        totalErrors: errorCount
      }
    });

  } catch (error) {
    console.error('Error adding participants:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
}

/**
 * Obtener participantes de una clase
 */
async function handleGetParticipants(req, res, classId) {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '',
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    if (!classId) {
      return res.status(400).json({ error: 'ID de clase requerido' });
    }

    console.log('Buscando clase con ID:', classId);

    // Verificar que la clase existe
    const classResult = await getClassById(classId);
    
    if (!classResult.success) {
      console.log('Clase no encontrada para ID:', classId);
      return res.status(404).json({ 
        error: 'Clase no encontrada',
        classId: classId,
        timestamp: new Date().toISOString()
      });
    }

    console.log('Clase encontrada:', classResult.class);

    // Obtener usuarios asignados a la clase
    const usersResult = await getClassAssignedUsers(classId);
    
    // Si hay error al obtener usuarios, continuar con array vacío
    // pero siempre retornar la información de la clase
    let allUsers = [];
    if (!usersResult.success) {
      console.error('Error getting assigned users:', usersResult.error);
      console.log('Continuando con lista de usuarios vacía');
    } else {
      allUsers = usersResult.users;
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
        case 'estado':
          aValue = a.estado.toLowerCase();
          bValue = b.estado.toLowerCase();
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
      return {
        ...user,
        assignedAt: user.assignedAt?.toDate?.() ? user.assignedAt.toDate() : null
      };
    });

    res.status(200).json({
      success: true,
      data: {
        users: cleanedUsers,
        class: classResult.class,
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
    console.error('Error getting class assigned users:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
}
