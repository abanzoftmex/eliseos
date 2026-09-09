import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { getSessionFromRequest } from '../../../../lib/portalAuth';

// Campos que el usuario puede editar desde el portal
const ALLOWED_FIELDS = [
  'telefonoContacto',
  'telefonoEmergencia',
  'nombreContactoEmergencia',
  'ocupacion',
  'genero',
  'ladoDominante',
];

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return res.status(401).json({ error: 'Sesion no valida' });
    }

    const updates = {};
    for (const field of ALLOWED_FIELDS) {
      if (field in req.body) {
        const value = req.body[field];
        updates[field] = typeof value === 'string' ? value.trim() : value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No hay campos validos para actualizar' });
    }

    // Intentar en clientes primero, luego atletas
    const { getDoc } = await import('firebase/firestore');
    const clienteRef = doc(db, 'clientes', session.userId);
    const atletaRef  = doc(db, 'atletas',  session.userId);

    const clienteSnap = await getDoc(clienteRef);
    const targetRef   = clienteSnap.exists() ? clienteRef : atletaRef;

    await updateDoc(targetRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error actualizando perfil portal:', error);
    return res.status(500).json({ error: 'Error al guardar los cambios' });
  }
}
