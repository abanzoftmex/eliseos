import { db } from '../../../../lib/firebase';
import { collection, doc, setDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

/**
 * API para crear URLs cortas
 * POST /api/s/create
 * Body: { consultaId: string, type?: 'normal' | 'atleta' }
 * Returns: { shortCode: string, shortUrl: string }
 */

// Generar código aleatorio de 6 caracteres
function generateShortCode(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { consultaId, type } = req.body;

    if (!consultaId) {
      return res.status(400).json({ error: 'Se requiere consultaId' });
    }

    // Verificar si ya existe un código corto para esta consulta
    const shortUrlsRef = collection(db, 'shortUrls');
    const existingQuery = query(shortUrlsRef, where('consultaId', '==', consultaId));
    const existingDocs = await getDocs(existingQuery);

    if (!existingDocs.empty) {
      // Ya existe, devolver el código existente
      const existingDoc = existingDocs.docs[0];
      const existingData = existingDoc.data();
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.headers.origin || '';
      
      // Determinar la ruta correcta según el tipo
      const tipoConsulta = existingData.type || 'normal';
      const rutaTipo = tipoConsulta === 'atleta' ? 'citas-deportivas' : 'citas';
      
      return res.status(200).json({
        shortCode: existingDoc.id,
        shortUrl: `${baseUrl}/f/${rutaTipo}/${existingDoc.id}`,
        existing: true
      });
    }

    // Generar nuevo código único
    let shortCode = generateShortCode();
    let attempts = 0;
    const maxAttempts = 10;

    // Verificar que el código no exista
    while (attempts < maxAttempts) {
      const codeDoc = await getDocs(query(shortUrlsRef, where('__name__', '==', shortCode)));
      if (codeDoc.empty) {
        break;
      }
      shortCode = generateShortCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return res.status(500).json({ error: 'No se pudo generar un código único' });
    }

    // Guardar en Firebase
    const shortUrlData = {
      consultaId,
      type: type || 'normal',
      createdAt: serverTimestamp(),
      views: 0
    };

    await setDoc(doc(db, 'shortUrls', shortCode), shortUrlData);

    // Construir URL completa con la ruta correcta según el tipo
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.headers.origin || '';
    const rutaTipo = (type || 'normal') === 'atleta' ? 'citas-deportivas' : 'citas';
    const shortUrl = `${baseUrl}/f/${rutaTipo}/${shortCode}`;

    return res.status(200).json({
      shortCode,
      shortUrl,
      existing: false
    });

  } catch (error) {
    console.error('Error creando URL corta:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
