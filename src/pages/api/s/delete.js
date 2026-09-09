import { db } from '../../../../lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

/**
 * API para eliminar URLs cortas
 * DELETE /api/s/delete
 * Body: { consultaId: string }
 * Returns: { success: boolean, message: string }
 */

export default async function handler(req, res) {
  // Solo permitir DELETE
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { consultaId } = req.body;

    if (!consultaId) {
      return res.status(400).json({ error: 'Se requiere consultaId' });
    }

    // Buscar el documento de shortUrl para esta consulta
    const shortUrlsRef = collection(db, 'shortUrls');
    const existingQuery = query(shortUrlsRef, where('consultaId', '==', consultaId));
    const existingDocs = await getDocs(existingQuery);

    if (existingDocs.empty) {
      return res.status(404).json({ error: 'No se encontró un link compartido para esta consulta' });
    }

    // Eliminar todos los documentos encontrados (normalmente solo hay uno)
    const deletePromises = existingDocs.docs.map(docSnapshot => 
      deleteDoc(doc(db, 'shortUrls', docSnapshot.id))
    );
    
    await Promise.all(deletePromises);

    return res.status(200).json({
      success: true,
      message: 'Link eliminado correctamente',
      deletedCount: existingDocs.docs.length
    });

  } catch (error) {
    console.error('Error eliminando URL corta:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
