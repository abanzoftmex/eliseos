import {
  buildSessionCookie,
  createPortalSession,
  findPortalUserByEmail,
  getPortalCredentials,
  normalizeEmail,
  verifyPassword
} from '../../../../lib/portalAuth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contrasena son requeridos' });
    }

    const userRecord = await findPortalUserByEmail(email);

    if (!userRecord) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    const credentials = await getPortalCredentials(userRecord.userId);

    if (!credentials?.passwordHash || !credentials?.salt) {
      return res.status(400).json({
        error: 'Aun no tienes contrasena. Solicita codigo para tu primer acceso'
      });
    }

    const isValid = verifyPassword(password, credentials.salt, credentials.passwordHash);

    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    const session = await createPortalSession(userRecord.userId);
    res.setHeader('Set-Cookie', buildSessionCookie(session.token));

    return res.status(200).json({ success: true, userName: userRecord.fullName });
  } catch (error) {
    console.error('Error en login portal usuarios:', error);
    return res.status(500).json({ error: 'Error interno al iniciar sesion' });
  }
}
