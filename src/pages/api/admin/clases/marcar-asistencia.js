import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../../lib/firebase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Verificar auth admin
  const authToken = req.cookies['auth-token'];
  const authRole  = req.cookies['auth-role'];
  if (!authToken || !authRole) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { userId, assignmentId, status, collectionName = 'clientes' } = req.body;

  if (!userId || !assignmentId || !status) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos' });
  }

  try {
    const assignmentRef = doc(db, collectionName, userId, 'clasesAsignadas', assignmentId);
    
    await updateDoc(assignmentRef, {
      estado: status,
      asistenciaMarcadaAt: serverTimestamp(),
      asistenciaMarcadaPor: authRole,
      updatedAt: serverTimestamp()
    });

    return res.status(200).json({ ok: true, message: 'Asistencia actualizada correctamente' });
  } catch (error) {
    console.error('Error marcando asistencia:', error);
    return res.status(500).json({ error: 'Error al actualizar asistencia' });
  }
}
