import { buildClearSessionCookie, closeSessionFromRequest } from '../../../../lib/portalAuth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  try {
    await closeSessionFromRequest(req);
    res.setHeader('Set-Cookie', buildClearSessionCookie());
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error en logout portal usuarios:', error);
    return res.status(500).json({ error: 'Error interno al cerrar sesion' });
  }
}
