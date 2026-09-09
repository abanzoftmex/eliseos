import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, ArrowLeft, Loader2, CreditCard } from 'lucide-react';
import PortalLayout from '@/components/portal/PortalLayout';

function formatMoney(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format((n || 0) / 100);
}

function PaymentSuccessContent() {
  const router = useRouter();
  const { session_id } = router.query;

  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'pending' | 'error'
  const [detail, setDetail] = useState(null);
  const [retries, setRetries] = useState(0);

  useEffect(() => {
    if (!router.isReady || !session_id) return;
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, session_id]);

  async function verify() {
    try {
      const res = await fetch(`/api/stripe/verify-session?session_id=${session_id}`);
      const json = await res.json();

      if (!res.ok) {
        setStatus('error');
        setDetail({ message: json.error || 'No se pudo verificar el pago.' });
        return;
      }

      if (json.isPaid) {
        setStatus('success');
        setDetail(json);
      } else {
        // Stripe confirmed the session exists but payment_status !== 'paid'
        // Could be processing — retry up to 3 times with 3s delay
        if (retries < 3) {
          setTimeout(() => {
            setRetries((r) => r + 1);
            verify();
          }, 3000);
        } else {
          setStatus('pending');
          setDetail(json);
        }
      }
    } catch (err) {
      setStatus('error');
      setDetail({ message: 'Error de conexión al verificar el pago.' });
    }
  }

  return (
    <div className="max-w-xl mx-auto pb-20 pt-10 px-4">
      {/* Back link */}
      <Link
        href="/portal/estado-de-cuenta"
        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-science-400 hover:text-primary transition-colors mb-10"
      >
        <ArrowLeft size={14} /> Volver al Estado de Cuenta
      </Link>

      <div className="bg-white rounded-[2.5rem] border border-science-100 shadow-sm overflow-hidden">
        {/* Header strip */}
        <div className={`h-2 w-full ${status === 'success' ? 'bg-emerald-500' : status === 'error' ? 'bg-red-500' : 'bg-primary'}`} />

        <div className="p-10 md:p-14 flex flex-col items-center text-center gap-6">
          {/* Icon */}
          {status === 'loading' && (
            <div className="w-20 h-20 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center">
              <Loader2 size={36} className="text-primary animate-spin" />
            </div>
          )}
          {status === 'success' && (
            <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
          )}
          {status === 'pending' && (
            <div className="w-20 h-20 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
              <CreditCard size={36} className="text-amber-500" />
            </div>
          )}
          {status === 'error' && (
            <div className="w-20 h-20 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
              <AlertCircle size={36} className="text-red-500" />
            </div>
          )}

          {/* Title */}
          {status === 'loading' && (
            <>
              <h1 className="text-3xl font-black text-science-900 tracking-tight">Verificando pago…</h1>
              <p className="text-science-400 font-medium text-sm leading-relaxed">
                Estamos confirmando tu pago con Stripe. Esto solo tardará un momento.
              </p>
            </>
          )}
          {status === 'success' && (
            <>
              <h1 className="text-3xl font-black text-science-900 tracking-tight">¡Pago exitoso!</h1>
              <p className="text-science-400 font-medium text-sm leading-relaxed">
                Tu pago ha sido procesado y confirmado. Tus cargos han sido saldados.
              </p>
              {detail?.amountTotal && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-8 py-5 flex flex-col items-center gap-1">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total pagado</p>
                  <p className="text-4xl font-black text-emerald-700 tracking-tighter">{formatMoney(detail.amountTotal)}</p>
                  {detail.itemCount > 1 && (
                    <p className="text-[11px] text-emerald-600 font-bold">{detail.itemCount} cargos saldados</p>
                  )}
                </div>
              )}
            </>
          )}
          {status === 'pending' && (
            <>
              <h1 className="text-3xl font-black text-science-900 tracking-tight">Pago en proceso</h1>
              <p className="text-science-400 font-medium text-sm leading-relaxed">
                Tu pago fue recibido y está siendo procesado. Tu estado de cuenta se actualizará en unos
                minutos automáticamente.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-8 py-4 text-center">
                <p className="text-[11px] font-black text-amber-600 uppercase tracking-widest">
                  No es necesario repetir el pago
                </p>
              </div>
            </>
          )}
          {status === 'error' && (
            <>
              <h1 className="text-3xl font-black text-science-900 tracking-tight">Error al verificar</h1>
              <p className="text-science-400 font-medium text-sm leading-relaxed">
                {detail?.message || 'No pudimos verificar tu pago. Si ya fue cobrado, aparecerá en tu estado de cuenta en breve.'}
              </p>
            </>
          )}

          {/* CTA */}
          <Link
            href="/portal/estado-de-cuenta"
            className="mt-2 inline-flex items-center gap-2 px-8 py-4 bg-science-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-science-900/10"
          >
            <ArrowLeft size={14} />
            {status === 'success' ? 'Ver mi estado de cuenta' : 'Volver al portal'}
          </Link>

          {/* Retry button for error cases */}
          {(status === 'error' || status === 'pending') && (
            <button
              onClick={() => { setStatus('loading'); setRetries(0); verify(); }}
              className="text-[10px] font-black text-science-400 hover:text-primary uppercase tracking-widest transition-colors underline underline-offset-4"
            >
              Verificar de nuevo
            </button>
          )}
        </div>
      </div>

      {/* Reassurance */}
      <p className="mt-8 text-center text-[11px] text-science-400 font-medium leading-relaxed">
        Si tienes dudas sobre tu pago escríbenos directamente.<br />
        <span className="font-black text-science-500">Elíseos Box & Fitness</span>
      </p>
    </div>
  );
}

export default function PagoExitosoPage() {
  return (
    <PortalLayout>
      <PaymentSuccessContent />
    </PortalLayout>
  );
}
