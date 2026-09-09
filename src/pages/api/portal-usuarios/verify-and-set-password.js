import {
  buildSessionCookie,
  createPortalSession,
  findPortalUserByEmail,
  normalizeEmail,
  upsertPortalCredentials,
  validateOtpForUser
} from '../../../../lib/portalAuth';

function validatePassword(password) {
  if (!password || password.length < 8) {
    return 'La contrasena debe tener al menos 8 caracteres';
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  try {
    const email = normalizeEmail(req.body?.email);
    const code = String(req.body?.code || '').trim();
    const password = String(req.body?.password || '');

    if (!email || !code || !password) {
      return res.status(400).json({ error: 'Correo, codigo y contrasena son requeridos' });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const userRecord = await findPortalUserByEmail(email);

    if (!userRecord) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const otpValidation = await validateOtpForUser({
      userId: userRecord.userId,
      email,
      code
    });

    if (!otpValidation.valid) {
      return res.status(401).json({ error: otpValidation.reason || 'Codigo invalido' });
    }

    await upsertPortalCredentials({
      userId: userRecord.userId,
      email,
      password
    });

    const session = await createPortalSession(userRecord.userId);
    res.setHeader('Set-Cookie', buildSessionCookie(session.token));

    return res.status(200).json({
      success: true,
      userName: userRecord.fullName
    });
  } catch (error) {
    console.error('Error en verify-and-set-password:', error);
    return res.status(500).json({ error: 'Error interno al verificar codigo' });
  }
}
