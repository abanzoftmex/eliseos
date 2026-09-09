import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShield, faArrowRight, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const FONT_URL = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap';

export default function PortalOtpPage() {
  const router = useRouter();

  const [email, setEmail]                     = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword]           = useState('');
  const [confirmPassword, setConfirmPassword]   = useState('');
  const [statusMessage, setStatusMessage]       = useState('');
  const [errorMessage, setErrorMessage]         = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('portal_email');
    if (!stored) { router.replace('/portal/login'); return; }
    setEmail(stored);
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage('');
    setStatusMessage('');

    if (newPassword.length < 8) {
      setErrorMessage('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden');
      return;
    }

    try {
      const res = await fetch('/api/portal-usuarios/verify-and-set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode, password: newPassword }),
      });
      const result = await res.json();
      if (!res.ok) {
        setErrorMessage(result.error || 'No se pudo completar el primer acceso');
        return;
      }
      sessionStorage.removeItem('portal_email');
      router.replace('/portal/dashboard');
    } catch {
      setErrorMessage('No se pudo validar el código en este momento');
    }
  }

  if (!email) return null;

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={FONT_URL} rel="stylesheet" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; background: #f2f0eb; -webkit-font-smoothing: antialiased; }

          @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
          .otp-f1 { animation: fadeUp .45s .05s both ease; }
          .otp-f2 { animation: fadeUp .45s .12s both ease; }
          .otp-f3 { animation: fadeUp .45s .19s both ease; }

          .otp-input {
            width: 100%; background: #fff;
            border: 1.5px solid rgba(0,0,0,.12);
            border-radius: 10px; font-size: 14px;
            font-family: 'Plus Jakarta Sans', sans-serif;
            color: rgba(0,0,0,.82);
            padding: 13px 14px; outline: none;
            transition: border-color .18s, box-shadow .18s;
          }
          .otp-input:focus {
            border-color: #00754A;
            box-shadow: 0 0 0 3px rgba(0,117,74,.12);
          }
          .otp-input::placeholder { color: rgba(0,0,0,.28); }
          .otp-input--code {
            text-align: center; letter-spacing: .3em;
            font-size: 22px; font-weight: 700; padding: 14px;
          }

          .otp-btn-primary {
            width: 100%; background: #00754A; color: #fff;
            font-weight: 700; font-size: 14px; letter-spacing: -.01em;
            font-family: 'Plus Jakarta Sans', sans-serif;
            border: none; border-radius: 50px;
            padding: 14px 24px; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            transition: background .18s, box-shadow .18s, transform .15s;
          }
          .otp-btn-primary:hover { background: #006241; box-shadow: 0 4px 18px rgba(0,117,74,.28); transform: translateY(-1px); }
          .otp-btn-primary:active { transform: scale(.97); }

          .otp-btn-ghost {
            width: 100%; background: transparent; color: rgba(0,0,0,.55);
            font-weight: 600; font-size: 14px; letter-spacing: -.01em;
            font-family: 'Plus Jakarta Sans', sans-serif;
            border: 1.5px solid rgba(0,0,0,.12); border-radius: 50px;
            padding: 13px 24px; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            transition: background .18s, border-color .18s;
          }
          .otp-btn-ghost:hover { background: rgba(0,0,0,.04); border-color: rgba(0,0,0,.2); }
        `}</style>
      </Head>

      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: '#f2f0eb' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>

          {/* Card */}
          <div className="otp-f1" style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 32px rgba(0,0,0,.08), 0 1px 4px rgba(0,0,0,.04)' }}>

            {/* Header band */}
            <div style={{ background: '#1E3932', padding: '22px 28px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FontAwesomeIcon icon={faShield} style={{ color: '#fff', fontSize: 16 }} />
              </div>
              <div>
                <h2 style={{ color: '#fff', fontSize: 17, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1.2 }}>Primer ingreso</h2>
                <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 13, marginTop: 2 }}>
                  Ingresa el código enviado y crea tu contraseña
                </p>
              </div>
            </div>

            {/* Form body */}
            <form onSubmit={handleSubmit} style={{ padding: '28px 28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }} className="otp-f2">

              {/* Alerts */}
              {statusMessage && (
                <div style={{ padding: '12px 16px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: 13, fontWeight: 500 }}>
                  {statusMessage}
                </div>
              )}
              {errorMessage && (
                <div style={{ padding: '12px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, fontWeight: 500 }}>
                  {errorMessage}
                </div>
              )}

              {/* Email display */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,.4)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Correo electrónico
                </label>
                <p style={{ padding: '12px 14px', borderRadius: 10, background: '#f2f0eb', border: '1px solid rgba(0,0,0,.07)', fontSize: 14, color: 'rgba(0,0,0,.6)', letterSpacing: '-.01em' }}>
                  {email}
                </p>
              </div>

              {/* Verification code */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,.4)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Código de verificación
                </label>
                <input
                  type="text"
                  required
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="otp-input otp-input--code"
                  placeholder="000000"
                  maxLength={6}
                />
                <p style={{ fontSize: 11, color: 'rgba(0,0,0,.35)', marginTop: 6 }}>
                  Revisa tu bandeja de entrada o spam
                </p>
              </div>

              {/* New password */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,.4)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="otp-input"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              {/* Confirm password */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,.4)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="otp-input"
                  placeholder="Repite tu contraseña"
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
                <button type="submit" className="otp-btn-primary">
                  Verificar y entrar
                  <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 12 }} />
                </button>
                <button type="button" className="otp-btn-ghost" onClick={() => router.push('/portal/login')}>
                  <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: 12 }} />
                  Volver al inicio
                </button>
              </div>

            </form>
          </div>

          <p className="otp-f3" style={{ textAlign: 'center', marginTop: 20, color: 'rgba(0,0,0,.3)', fontSize: 11, letterSpacing: '.05em' }}>
            Acceso exclusivo para usuarios registrados
          </p>
        </div>
      </div>
    </>
  );
}
