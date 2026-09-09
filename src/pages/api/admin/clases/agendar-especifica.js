import { ActivityService } from '../../../../../lib/domain/activity/service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { userId, userType, sessionData } = req.body;
    
    if (!userId || !userType || !sessionData) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos' });
    }

    const result = await ActivityService.scheduleSession(userId, userType, sessionData);

    return res.status(200).json(result);
  } catch (error) {
    console.error('API Error [agendar-especifica]:', error);
    return res.status(500).json({ error: error.message || 'Error al agendar la sesión' });
  }
}
