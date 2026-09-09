import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { getSessionFromRequest } from '../../../../lib/portalAuth';
import { PaymentService } from '../../../../lib/domain/payment/service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return res.status(401).json({ error: 'Sesión no válida' });
    }

    const { assignmentId, activityId } = req.body;
    const targetId = assignmentId || activityId;

    if (!targetId) {
      return res.status(400).json({ error: 'ID de actividad no proporcionado' });
    }

    // --- BÚSQUEDA INTELIGENTE ---
    // En lugar de adivinar la ruta, vamos a buscar en las dos colecciones posibles
    const collections = ['clientes', 'atletas'];
    let foundRef = null;
    let foundUserType = null;

    for (const col of collections) {
      // 1. Intentar acceso directo por ID de documento (Rápido)
      const directRef = doc(db, col, session.userId, 'clasesAsignadas', targetId);
      const directSnap = await getDoc(directRef);
      
      if (directSnap.exists()) {
        foundRef = directRef;
        foundUserType = col === 'clientes' ? 'cliente' : 'atleta';
        break;
      }

      // 2. Si no funciona, buscar en el listado de ese usuario (Infalible)
      const listRef = collection(db, col, session.userId, 'clasesAsignadas');
      const listSnap = await getDocs(listRef);
      const docMatch = listSnap.docs.find(d => d.id === targetId || d.data().idClase === targetId);
      
      if (docMatch) {
        foundRef = docMatch.ref;
        foundUserType = col === 'clientes' ? 'cliente' : 'atleta';
        break;
      }
    }

    if (!foundRef) {
      console.error(`[ReportarPago] No se encontró la actividad ${targetId} para el usuario ${session.userId}`);
      return res.status(404).json({ error: 'No pudimos localizar la actividad. Por favor, refresca el listado de deudas e intenta de nuevo.' });
    }

    // Ejecutar el servicio de pago con la referencia encontrada
    const result = await PaymentService.reportActivityPayment(session.userId, foundUserType, {
      ...req.body,
      assignmentId: foundRef.id // Usamos el ID real del documento encontrado
    });
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('API Error [reportar-pago]:', error);
    return res.status(500).json({ error: error.message || 'Error al procesar el pago' });
  }
}
