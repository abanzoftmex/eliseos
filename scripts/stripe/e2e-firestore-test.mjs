/**
 * Prueba E2E del webhook → Firestore (modo TEST).
 *
 * Siembra un doc de cargo de prueba en Firestore, le dispara un evento
 * checkout.session.completed FIRMADO al webhook local, verifica que quedó
 * marcado como pagado, y limpia los docs de prueba al final.
 *
 *   npm run dev      # en otra terminal
 *   node scripts/stripe/e2e-firestore-test.mjs
 */
import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import Stripe from 'stripe';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});
const db = getFirestore(app);

const G = '\x1b[32m✔\x1b[0m', R = '\x1b[31m✘\x1b[0m', I = '\x1b[36mℹ\x1b[0m';
const USER = 'zzz_stripe_e2e_test';
const CLASE_ID = `e2e_clase_${Date.now()}`;
const PRECIO = 250;

function fireWebhook(metadata, sessionId) {
  const event = {
    id: `evt_e2e_${Date.now()}`, object: 'event', type: 'checkout.session.completed',
    data: { object: {
      id: sessionId, object: 'checkout.session', payment_status: 'paid',
      amount_total: PRECIO * 100, currency: 'mxn', customer_email: 'e2e@test', metadata,
    } },
  };
  const payload = JSON.stringify(event);
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });
  return fetch(`${BASE_URL}/api/stripe/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'stripe-signature': header },
    body: payload,
  });
}

async function main() {
  let exitCode = 0;
  try {
    console.log(`${I} Sembrando cliente y clase de prueba en Firestore...`);
    await setDoc(doc(db, 'clientes', USER), { nombre: 'E2E', apellidoPaterno: 'Test', email: 'e2e@test', _stripeTest: true });
    await setDoc(doc(db, 'clientes', USER, 'clasesAsignadas', CLASE_ID), {
      nombre: 'Clase E2E de prueba', precio: PRECIO, isPaid: false, paymentPendingValidation: false, totalValidado: 0, _stripeTest: true,
    });
    console.log(`${G} Sembrado: clientes/${USER}/clasesAsignadas/${CLASE_ID} (precio ${PRECIO}, isPaid:false)`);

    const sessionId = `cs_test_e2e_${Date.now()}`;
    const metadata = { userId: USER, userType: 'cliente', userCollection: 'clientes', itemIds: CLASE_ID, itemTypes: 'clase', clienteName: 'E2E Test' };

    console.log(`${I} Disparando webhook firmado (checkout.session.completed, paid)...`);
    const res = await fireWebhook(metadata, sessionId);
    console.log(`${res.status === 200 ? G : R} Webhook respondió HTTP ${res.status} (esperado 200)`);
    if (res.status !== 200) exitCode = 1;

    // Pequeña espera por si la escritura tarda
    await new Promise((r) => setTimeout(r, 1500));

    const snap = await getDoc(doc(db, 'clientes', USER, 'clasesAsignadas', CLASE_ID));
    const d = snap.data() || {};
    console.log(`${I} Estado tras el webhook: isPaid=${d.isPaid}, totalValidado=${d.totalValidado}, abonos=${(d.abonosReportados || []).length}, stripeSessionId=${d.stripeSessionId || '—'}`);

    const checks = [
      ['isPaid === true', d.isPaid === true],
      ['totalValidado === precio', Number(d.totalValidado) === PRECIO],
      ['paymentPendingValidation === false', d.paymentPendingValidation === false],
      ['tiene 1 abono reportado (stripe)', (d.abonosReportados || []).some((a) => a.metodo === 'stripe' && Number(a.monto) === PRECIO)],
      ['stripeSessionId guardado', d.stripeSessionId === sessionId],
    ];
    for (const [label, pass] of checks) { console.log(`${pass ? G : R} ${label}`); if (!pass) exitCode = 1; }

    // Idempotencia: reenviar no debe duplicar abonos
    console.log(`${I} Reenviando el mismo evento (idempotencia)...`);
    await fireWebhook(metadata, sessionId);
    await new Promise((r) => setTimeout(r, 1200));
    const snap2 = await getDoc(doc(db, 'clientes', USER, 'clasesAsignadas', CLASE_ID));
    const abonos2 = (snap2.data()?.abonosReportados || []).length;
    const idem = abonos2 === (d.abonosReportados || []).length;
    console.log(`${idem ? G : R} Idempotencia: abonos siguen en ${abonos2} (no se duplicaron)`);
    if (!idem) exitCode = 1;
  } catch (err) {
    console.log(`${R} Error en la prueba: ${err.message}`);
    exitCode = 1;
  } finally {
    // Limpieza
    try {
      await deleteDoc(doc(db, 'clientes', USER, 'clasesAsignadas', CLASE_ID));
      await deleteDoc(doc(db, 'clientes', USER));
      console.log(`${I} Limpieza: docs de prueba eliminados.`);
    } catch (e) { console.log(`${R} No se pudo limpiar: ${e.message}`); }
  }
  console.log(exitCode === 0 ? `\n${G} E2E OK: el webhook marca el pago en Firestore y es idempotente.` : `\n${R} E2E con fallos (ver arriba).`);
  process.exit(exitCode);
}
main();
