import { 
  getClasses,
  createClass,
  uploadClassImage
} from '../../../../lib/firebase/classesService';

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      return handleGetClasses(req, res);
    case 'POST':
      return handleCreateClass(req, res);
    default:
      return res.status(405).json({ error: 'Método no permitido' });
  }
}

async function handleGetClasses(req, res) {
  try {
    const { 
      tipo,
      status,
      fecha,
      instructor,
      limit
    } = req.query;

    const filters = {};
    
    if (tipo) filters.tipo = tipo;
    if (status) filters.status = status;
    if (fecha) filters.fecha = fecha;
    if (instructor) filters.instructor = instructor;
    if (limit) filters.limit = parseInt(limit);

    const result = await getClasses(filters);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.classes
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in handleGetClasses:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

async function handleCreateClass(req, res) {
  try {
    const classData = req.body;

    // Validaciones básicas
    if (!classData.nombre || !classData.nombre.trim()) {
      return res.status(400).json({
        success: false,
        error: 'El nombre de la clase es requerido'
      });
    }

    if (!classData.instructor || !classData.instructor.trim()) {
      return res.status(400).json({
        success: false,
        error: 'El instructor es requerido'
      });
    }

    if (!classData.fechaHora) {
      return res.status(400).json({
        success: false,
        error: 'La fecha y hora son requeridas'
      });
    }

    const result = await createClass(classData);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        data: {
          classId: result.classId,
          class: result.classData
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in handleCreateClass:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}