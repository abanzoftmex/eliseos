import { db } from '../../../../lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

/**
 * API para resolver URLs cortas
 * GET /api/s/[code]
 * Returns: { consultaId: string, type: string } o redirige a la página de la ficha
 */

export default async function handler(req, res) {
  // Solo permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Se requiere código' });
    }

    // Buscar en Firebase
    const shortUrlDoc = await getDoc(doc(db, 'shortUrls', code));

    if (!shortUrlDoc.exists()) {
      return res.status(404).json({ error: 'URL no encontrada' });
    }

    const data = shortUrlDoc.data();

    // Incrementar contador de vistas
    await updateDoc(doc(db, 'shortUrls', code), {
      views: increment(1)
    });

    // Devolver los datos para que el cliente pueda redirigir
    return res.status(200).json({
      consultaId: data.consultaId,
      type: data.type || 'normal',
      createdAt: data.createdAt,
      views: (data.views || 0) + 1
    });

  } catch (error) {
    console.error('Error resolviendo URL corta:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
