import crypto from 'node:crypto';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { getSessionFromRequest } from '../../../../lib/portalAuth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return res.status(401).json({ error: 'Sesión no válida' });
    }

    // Determinar colección del usuario
    const clienteRef  = doc(db, 'clientes', session.userId);
    const clienteSnap = await getDoc(clienteRef);
    const userRef     = clienteSnap.exists() ? clienteRef : doc(db, 'atletas', session.userId);
    const userSnap    = clienteSnap.exists() ? clienteSnap : await getDoc(userRef);

    if (!userSnap.exists()) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const userData = userSnap.data();
    let qrToken = userData.qrToken || null;

    // Si no tiene token, generar y guardar
    if (!qrToken) {
      qrToken = crypto.randomUUID();
      await updateDoc(userRef, { qrToken });
    }

    return res.status(200).json({ ok: true, qrToken });
  } catch (error) {
    console.error('Error en mi-qr:', error);
    return res.status(500).json({ error: 'Error al obtener el QR' });
  }
}
