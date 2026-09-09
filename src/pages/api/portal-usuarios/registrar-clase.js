import { doc, getDoc, collection, query, where, getDocs, collectionGroup } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { getSessionFromRequest } from '../../../../lib/portalAuth';
import { getClassById, assignUserToClass } from '../../../../lib/firebase/classesService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return res.status(401).json({ error: 'Sesión no válida' });
    }

    const { classId, targetDate } = req.body;
    if (!classId || !targetDate) {
      return res.status(400).json({ error: 'ID de clase y fecha requeridos' });
    }

    // Verificar que la clase existe
    const classResult = await getClassById(classId);
    if (!classResult.success) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }

    const classData = classResult.class;

    // ── Verificar cupo para esta fecha específica ────────────────────────────
    if (classData.maxParticipantes && classData.maxParticipantes > 0) {
      let enrolledCount = 0;
      try {
        // Single-field collectionGroup query (Firestore auto-indexes single fields)
        const q = query(
          collectionGroup(db, 'clasesAsignadas'),
          where('fechaAsignacionString', '==', targetDate)
        );
        const snap = await getDocs(q);
        enrolledCount = snap.docs.filter(d => d.data().idClase === classId).length;
      } catch {
        // Fallback: scan collections directly
        const [clientesSnap, atletasSnap] = await Promise.all([
          getDocs(collection(db, 'clientes')),
          getDocs(collection(db, 'atletas')),
        ]);
        for (const userDoc of [...clientesSnap.docs, ...atletasSnap.docs]) {
          const colName = clientesSnap.docs.some(d => d.id === userDoc.id) ? 'clientes' : 'atletas';
          try {
            const s = await getDocs(
              query(
                collection(db, colName, userDoc.id, 'clasesAsignadas'),
                where('idClase', '==', classId),
                where('fechaAsignacionString', '==', targetDate)
              )
            );
            enrolledCount += s.size;
          } catch {
            // skip
          }
        }
      }

      if (enrolledCount >= classData.maxParticipantes) {
        return res.status(400).json({
          error: `Esta clase está llena para este día (${enrolledCount}/${classData.maxParticipantes} cupos ocupados)`,
        });
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    // Determinar tipo de usuario
    let userType = null;
    const clienteSnap = await getDoc(doc(db, 'clientes', session.userId));
    if (clienteSnap.exists()) {
      userType = 'cliente';
    } else {
      const atletaSnap = await getDoc(doc(db, 'atletas', session.userId));
      if (atletaSnap.exists()) {
        userType = 'atleta';
      }
    }

    if (!userType) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Verificar que no esté ya registrado PARA ESA FECHA
    const userCollection = userType === 'cliente' ? 'clientes' : 'atletas';
    const asignadasRef = collection(db, userCollection, session.userId, 'clasesAsignadas');
    
    // Buscamos registros de esta clase en esta fecha
    const existingQuery = query(
      asignadasRef, 
      where('idClase', '==', classId),
      where('fechaAsignacionString', '==', targetDate)
    );
    const existingSnap = await getDocs(existingQuery);

    if (!existingSnap.empty) {
      return res.status(400).json({ error: 'Ya estás registrado en esta clase para este día' });
    }

    // Registrar al usuario con la fecha específica
    const result = await assignUserToClass(classId, session.userId, userType, {
      notas: 'Registro desde portal (sesión específica)',
      origenRegistro: 'portal',
      fechaAsignacionString: targetDate, // Guardamos la fecha como string para fácil filtrado
      fechaEvaluacion: targetDate,       // Por compatibilidad con otros módulos
      tipoAsignacion: 'sesion_unica'
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Error al registrarte' });
    }

    return res.status(200).json({
      success: true,
      message: 'Te has registrado exitosamente',
      assignmentId: result.assignmentId,
    });
  } catch (error) {
    console.error('Error en registrar-clase:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
