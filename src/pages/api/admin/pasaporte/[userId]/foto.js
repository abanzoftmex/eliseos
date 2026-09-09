// src/pages/api/admin/pasaporte/[userId]/foto.js
import { updatePassportPhotos } from '@/lib/firebase/passportService';
import { PASSPORT_DEFAULT_YEAR } from '@/lib/domain/passportConstants';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Verificar auth admin
  const authToken = req.cookies['auth-token'];
  const authRole = req.cookies['auth-role'];
  if (!authToken || !authRole) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'ID de usuario requerido' });
  }

  try {
    const {
      frenteUrl,
      ladoUrl,
      espaldaUrl,
      fotosPostura,
      fotoInicioUrl,
      fechaInicio,
      cierreFrenteUrl,
      cierreLadoUrl,
      cierreEspaldaUrl,
      fotosCierre,
      fotoFinUrl,
      fechaFin,
      year = PASSPORT_DEFAULT_YEAR
    } = req.body || {};

    const result = await updatePassportPhotos(userId, Number(year), {
      frenteUrl,
      ladoUrl,
      espaldaUrl,
      fotosPostura,
      fotoInicioUrl,
      fechaInicio,
      cierreFrenteUrl,
      cierreLadoUrl,
      cierreEspaldaUrl,
      fotosCierre,
      fotoFinUrl,
      fechaFin
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error al actualizar fotos de pasaporte:', error);
    return res.status(400).json({ error: error.message || 'Error al actualizar fotos' });
  }
}
