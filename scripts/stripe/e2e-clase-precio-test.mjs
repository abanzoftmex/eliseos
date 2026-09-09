/**
 * Prueba del fix "$0 al pagar clase": cuando la asignación NO guarda precio,
 * el marcado de pago debe tomar el precio del documento de la clase (no $0).
 *
 *   npm run dev
 *   node scripts/stripe/e2e-clase-precio-test.mjs
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
const USER = 'zzz_stripe_e2e_precio';
const CLASE_ID = `zzz_clase_precio_${Date.now()}`;
const ASSIGN_ID = `e2e_assign_${Date.now()}`;
const PRECIO_CLASE = 300;
let exitCode = 0;
const check = (l, p) => { console.log(`${p ? G : R} ${l}`); if (!p) exitCode = 1; };

async function main() {
  try {
    console.log(`${I} Sembrando clase (precio ${PRECIO_CLASE}) y asignación SIN precio...`);
    await setDoc(doc(db, 'clases', CLASE_ID), { nombre: 'Clase precio E2E', precio: PRECIO_CLASE, _stripeTest: true });
    await setDoc(doc(db, 'clientes', USER), { nombre: 'E2E', apellidoPaterno: 'Precio', email: 'e2e-precio@test.com', _stripeTest: true });
    // Asignación SIN campo precio (replica el caso real de registrar-clase)
    await setDoc(doc(db, 'clientes', USER, 'clasesAsignadas', ASSIGN_ID), {
      idClase: CLASE_ID, nombre: 'Clase precio E2E', isPaid: false, paymentPendingValidation: false, totalValidado: 0, _stripeTest: true,
    });

    const sessionId = `cs_test_precio_${Date.now()}`;
    const event = {
      id: `evt_precio_${Date.now()}`, object: 'event', type: 'checkout.session.completed',
      data: { object: {
        id: sessionId, object: 'checkout.session', payment_status: 'paid',
        amount_total: PRECIO_CLASE * 100, currency: 'mxn', customer_email: 'e2e@test',
        metadata: { userId: USER, userType: 'cliente', userCollection: 'clientes', itemIds: ASSIGN_ID, itemTypes: 'clase', clienteName: 'E2E Precio' },
      } },
    };
    const payload = JSON.stringify(event);
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });

    console.log(`${I} Disparando webhook firmado...`);
    const res = await fetch(`${BASE_URL}/api/stripe/webhook`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'stripe-signature': header }, body: payload,
    });
    check(`Webhook → HTTP ${res.status} (200)`, res.status === 200);

    await new Promise(r => setTimeout(r, 1500));
    const snap = await getDoc(doc(db, 'clientes', USER, 'clasesAsignadas', ASSIGN_ID));
    const d = snap.data() || {};
    console.log(`${I} Tras el pago: isPaid=${d.isPaid}, totalValidado=${d.totalValidado}, abono=${(d.abonosReportados||[])[0]?.monto}`);
    check('isPaid === true', d.isPaid === true);
    check(`totalValidado === ${PRECIO_CLASE} (tomado de la clase, NO $0)`, Number(d.totalValidado) === PRECIO_CLASE);
    check(`abono registrado por ${PRECIO_CLASE} (no $0)`, (d.abonosReportados || []).some(a => Number(a.monto) === PRECIO_CLASE));
  } catch (err) {
    console.log(`${R} Error: ${err.message}`); exitCode = 1;
  } finally {
    try {
      await deleteDoc(doc(db, 'clientes', USER, 'clasesAsignadas', ASSIGN_ID));
      await deleteDoc(doc(db, 'clientes', USER));
      await deleteDoc(doc(db, 'clases', CLASE_ID));
      console.log(`${I} Limpieza lista.`);
    } catch (e) { console.log(`${R} No se pudo limpiar: ${e.message}`); }
  }
  console.log(exitCode === 0 ? `\n${G} Fix OK: al pagar una clase sin precio en la asignación, toma el precio de la clase.` : `\n${R} Falló (ver arriba).`);
  process.exit(exitCode);
}
main();
