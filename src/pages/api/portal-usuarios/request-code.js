import {
  findPortalUserByEmail,
  getPortalCredentials,
  saveOtpForUser,
  createOtpCode,
  normalizeEmail
} from '../../../../lib/portalAuth';

async function sendVerificationEmail({ to, name, code }) {
  const apiKey = process.env.RESEND_API_KEY || process.env.NEXT_PUBLIC_RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'Elíseos Box & Fitness <noreply@email.jhernandez.mx>';

  if (!apiKey) {
    throw new Error('RESEND_API_KEY no esta configurada');
  }

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 20px;">
      <h2 style="color:#1c4040;">Acceso a tu portal Elíseos Box & Fitness</h2>
      <p>Hola ${name || 'miembro'},</p>
      <p>Este es tu código de verificación para entrar a tu cuenta:</p>
      <div style="margin: 24px 0; text-align:center;">
        <span style="display:inline-block; font-size:32px; letter-spacing:6px; font-weight:700; color:#1c4040; background:#f0f9cc; padding:12px 20px; border-radius:10px; border: 1px solid #c2ef03;">${code}</span>
      </div>
      <p>El código expira en 15 minutos.</p>
      <p>Si no solicitaste este acceso, puedes ignorar este correo.</p>
    </div>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Tu código de acceso - Elíseos Box & Fitness',
      html: emailHtml
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`No se pudo enviar correo con Resend: ${errorText}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  try {
    const email = normalizeEmail(req.body?.email);

    if (!email) {
      return res.status(400).json({ error: 'Correo requerido' });
    }

    const userRecord = await findPortalUserByEmail(email);

    if (!userRecord) {
      return res.status(404).json({ error: 'No encontramos un usuario con ese correo' });
    }

    const credentials = await getPortalCredentials(userRecord.userId);
    const hasPassword = Boolean(credentials?.passwordHash && credentials?.salt);

    if (hasPassword) {
      return res.status(200).json({
        firstTime: false,
        message: 'Usuario registrado, ingresa tu contrasena',
        userName: userRecord.fullName
      });
    }

    const otpCode = createOtpCode();

    await saveOtpForUser({
      userId: userRecord.userId,
      email,
      code: otpCode
    });

    await sendVerificationEmail({
      to: email,
      name: userRecord.fullName,
      code: otpCode
    });

    return res.status(200).json({
      firstTime: true,
      message: 'Te enviamos un codigo a tu correo para verificar tu acceso',
      userName: userRecord.fullName
    });
  } catch (error) {
    console.error('Error en request-code:', error);
    return res.status(500).json({ error: 'Error interno al solicitar codigo' });
  }
}
