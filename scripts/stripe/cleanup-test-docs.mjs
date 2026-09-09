/** Limpia docs de prueba (_stripeTest==true con id zzz_) que pudieron quedar. */
import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});
const db = getFirestore(app);

let n = 0;
// Clases de prueba
const clasesSnap = await getDocs(query(collection(db, 'clases'), where('_stripeTest', '==', true)));
for (const d of clasesSnap.docs) { await deleteDoc(d.ref); n++; console.log('borrada clase', d.id); }

// Clientes de prueba (+ sus clasesAsignadas)
const clientesSnap = await getDocs(query(collection(db, 'clientes'), where('_stripeTest', '==', true)));
for (const c of clientesSnap.docs) {
  const sub = await getDocs(collection(db, 'clientes', c.id, 'clasesAsignadas'));
  for (const a of sub.docs) { await deleteDoc(a.ref); }
  const ck = await getDocs(collection(db, 'clientes', c.id, 'stripeCheckouts')).catch(() => ({ docs: [] }));
  for (const a of ck.docs) { await deleteDoc(a.ref); }
  await deleteDoc(c.ref); n++; console.log('borrado cliente', c.id);
}
console.log(`\nTotal docs raíz borrados: ${n}`);
process.exit(0);
