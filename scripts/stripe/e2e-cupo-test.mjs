/**
 * Prueba FUNCIONAL del bug de cupos reportado por Juan:
 * "creo clase con 20 cupos, me registro a una, se cierra".
 *
 * Reproduce el escenario real contra Firestore + el endpoint registrar-clase:
 *  - Clase con cupo 20: la 2ª inscripción (otro usuario, misma fecha) DEBE pasar (no se cierra tras 1).
 *  - Clase con cupo 1:  la 2ª inscripción DEBE rechazarse con "llena" (el límite sí se respeta).
 *
 *   npm run dev
 *   node scripts/stripe/e2e-cupo-test.mjs
 */
import 'dotenv/config';
import { randomBytes, createHash } from 'node:crypto';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, deleteDoc, collection } from 'firebase/firestore';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
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
const stamp = Date.now();
const CLASE_20 = `zzz_clase_cupo20_${stamp}`;
const CLASE_1 = `zzz_clase_cupo1_${stamp}`;
const U1 = `zzz_cupo_u1_${stamp}`;
const U2 = `zzz_cupo_u2_${stamp}`;
const FECHA = '2099-01-15';
let exitCode = 0;
const created = []; // {user, assignId} para limpiar
const check = (l, p) => { console.log(`${p ? G : R} ${l}`); if (!p) exitCode = 1; };

async function mkUser(uid) {
  await setDoc(doc(db, 'clientes', uid), { nombre: 'Cupo', apellidoPaterno: 'Test', email: `${uid}@test.com`, _stripeTest: true });
  const token = randomBytes(24).toString('hex');
  const ref = doc(collection(db, 'portalUserSessions'));
  await setDoc(ref, { userId: uid, tokenHash: createHash('sha256').update(token).digest('hex'), active: true, expiresAt: new Date(Date.now() + 864e5), createdAt: new Date(), lastSeenAt: new Date() });
  return { cookie: `portal-user-session=${token}`, sessionRef: ref };
}

async function registrar(cookie, classId) {
  const res = await fetch(`${BASE_URL}/api/portal-usuarios/registrar-clase`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ classId, targetDate: FECHA }),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

let s1, s2;
async function main() {
  try {
    console.log(`${I} Sembrando 2 clases (cupo 20 y cupo 1) y 2 usuarios...`);
    await setDoc(doc(db, 'clases', CLASE_20), { nombre: 'Cupo20', tipo: 'grupal', maxParticipantes: 20, participantesActuales: 0, status: 'programada', _stripeTest: true });
    await setDoc(doc(db, 'clases', CLASE_1), { nombre: 'Cupo1', tipo: 'sesion', maxParticipantes: 1, participantesActuales: 0, status: 'programada', _stripeTest: true });
    s1 = await mkUser(U1);
    s2 = await mkUser(U2);

    console.log(`\n${I} CLASE CON 20 CUPOS — escenario de Juan:`);
    const r1 = await registrar(s1.cookie, CLASE_20);
    check(`1ª inscripción (U1) → HTTP ${r1.status} (200)`, r1.status === 200);
    if (r1.json.assignmentId) created.push({ user: U1, assignId: r1.json.assignmentId });

    const r2 = await registrar(s2.cookie, CLASE_20);
    check(`2ª inscripción (U2, mismo día) → HTTP ${r2.status} (200) — NO se cierra tras 1`, r2.status === 200);
    if (r2.json.assignmentId) created.push({ user: U2, assignId: r2.json.assignmentId });
    if (r2.status !== 200) console.log(`   respuesta: ${JSON.stringify(r2.json)}`);

    console.log(`\n${I} CLASE CON 1 CUPO — el límite SÍ debe respetarse:`);
    const r3 = await registrar(s1.cookie, CLASE_1);
    check(`1ª inscripción (U1) → HTTP ${r3.status} (200)`, r3.status === 200);
    if (r3.json.assignmentId) created.push({ user: U1, assignId: r3.json.assignmentId });

    const r4 = await registrar(s2.cookie, CLASE_1);
    check(`2ª inscripción (U2) → HTTP ${r4.status} (400 "llena") — el cupo 1 se respeta`, r4.status === 400);
    if (r4.status === 400) console.log(`   mensaje: "${r4.json.error}"`);
    if (r4.json.assignmentId) created.push({ user: U2, assignId: r4.json.assignmentId });
  } catch (err) {
    console.log(`${R} Error: ${err.message}`); exitCode = 1;
  } finally {
    try {
      for (const c of created) await deleteDoc(doc(db, 'clientes', c.user, 'clasesAsignadas', c.assignId));
      if (s1?.sessionRef) await deleteDoc(s1.sessionRef);
      if (s2?.sessionRef) await deleteDoc(s2.sessionRef);
      await deleteDoc(doc(db, 'clientes', U1));
      await deleteDoc(doc(db, 'clientes', U2));
      await deleteDoc(doc(db, 'clases', CLASE_20));
      await deleteDoc(doc(db, 'clases', CLASE_1));
      console.log(`\n${I} Limpieza lista.`);
    } catch (e) { console.log(`${R} No se pudo limpiar del todo: ${e.message}`); }
  }
  console.log(exitCode === 0 ? `\n${G} CUPOS OK: clase de 20 acepta varias inscripciones; clase de 1 se respeta.` : `\n${R} Falló (ver arriba).`);
  process.exit(exitCode);
}
main();
