import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Science in Motion <noreply@scienceinmotion.com.mx>";

/**
 * Send a plan expiration alert email to a client.
 *
 * @param {object} clienteData - { nombre, apellido?, email }
 * @param {object} planData    - { nombre, fechaExpiracion (Date|string), diasRestantes }
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function sendPlanExpirationEmail(clienteData, planData) {
  if (!clienteData?.email) {
    return { success: false, error: "Email del cliente no disponible" };
  }

  const clienteNombre = [clienteData.nombre, clienteData.apellido]
    .filter(Boolean)
    .join(" ")
    .trim() || "Cliente";

  const planNombre = planData.nombre || "Tu plan";
  const diasRestantes = planData.diasRestantes ?? 0;
  const fechaExp = planData.fechaExpiracion
    ? new Date(planData.fechaExpiracion).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "próximamente";

  const isExpired = diasRestantes <= 0;
  const subject = isExpired
    ? `⚠️ Tu plan ha vencido — Science in Motion`
    : `⏰ Tu plan vence en ${diasRestantes} día${diasRestantes !== 1 ? "s" : ""} — Science in Motion`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:#0ea5e9;padding:40px 48px;text-align:center;">
              <h1 style="color:#ffffff;font-size:28px;font-weight:900;letter-spacing:-0.5px;margin:0;">
                Science in Motion
              </h1>
              <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0;">
                Centro de Alto Rendimiento
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:48px;">
              <p style="font-size:16px;color:#64748b;margin:0 0 8px;">Hola, <strong style="color:#0f172a;">${clienteNombre}</strong></p>
              ${isExpired
    ? `<h2 style="font-size:22px;font-weight:900;color:#ef4444;margin:16px 0;">Tu plan ha vencido</h2>
                 <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 24px;">
                   Tu plan <strong>${planNombre}</strong> venció el <strong>${fechaExp}</strong>.
                   Para continuar disfrutando de todos los beneficios, renueva hoy.
                 </p>`
    : `<h2 style="font-size:22px;font-weight:900;color:#f59e0b;margin:16px 0;">Tu plan está por vencer</h2>
                 <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 24px;">
                   Tu plan <strong>${planNombre}</strong> vence el <strong>${fechaExp}</strong>
                   — en <strong>${diasRestantes} día${diasRestantes !== 1 ? "s" : ""}</strong>.
                   Te recomendamos renovar antes de esa fecha para no perder tu continuidad.
                 </p>`}
              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 40px;">
                <tr>
                  <td style="background:#0ea5e9;border-radius:12px;padding:14px 32px;text-align:center;">
                    <a href="https://scienceinmotion.com.mx" style="color:#ffffff;font-size:14px;font-weight:900;text-decoration:none;letter-spacing:0.5px;text-transform:uppercase;">
                      Renovar mi plan →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size:13px;color:#94a3b8;line-height:1.7;margin:0;">
                Si ya realizaste tu renovación, ignora este mensaje.<br/>
                Ante cualquier duda contáctanos directamente en nuestras instalaciones.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:24px 48px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="font-size:12px;color:#94a3b8;margin:0;">
                © ${new Date().getFullYear()} Science in Motion · Todos los derechos reservados
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [clienteData.email],
      subject,
      html,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
