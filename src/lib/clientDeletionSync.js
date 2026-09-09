import { db } from '../../lib/firebase';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';

const PENDING_DELETIONS_COLLECTION = 'cliente_sync_pending_deletions';

export async function queuePendingClienteDeletion(clienteData) {
  if (!clienteData?.id) {
    throw new Error('Cliente ID requerido para encolar baja pendiente');
  }

  const deletionRef = doc(db, PENDING_DELETIONS_COLLECTION, clienteData.id);

  await setDoc(deletionRef, {
    clienteId: clienteData.id,
    payload: clienteData,
    action: 'delete',
    synced: false,
    attempts: 0,
    lastError: null,
    queuedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }, { merge: true });
}

export async function markPendingClienteDeletionResult(clienteId, { success, error = null }) {
  if (!clienteId) {
    throw new Error('Cliente ID requerido para actualizar baja pendiente');
  }

  const deletionRef = doc(db, PENDING_DELETIONS_COLLECTION, clienteId);
  const snapshot = await getDoc(deletionRef);
  const currentAttempts = snapshot.exists() ? (snapshot.data().attempts || 0) : 0;

  await setDoc(deletionRef, {
    synced: !!success,
    syncedAt: success ? new Date().toISOString() : null,
    lastError: error,
    attempts: currentAttempts + 1,
    lastAttemptAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }, { merge: true });
}

export async function incrementPendingClienteDeletionAttempt(clienteId, error = null) {
  if (!clienteId) return;

  const deletionRef = doc(db, PENDING_DELETIONS_COLLECTION, clienteId);
  const snapshot = await getDoc(deletionRef);
  const currentAttempts = snapshot.exists() ? (snapshot.data().attempts || 0) : 0;

  await setDoc(deletionRef, {
    attempts: currentAttempts + 1,
    lastError: error,
    lastAttemptAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }, { merge: true });
}

export async function getPendingClienteDeletions() {
  const pendingQuery = query(
    collection(db, PENDING_DELETIONS_COLLECTION),
    where('action', '==', 'delete'),
    where('synced', '==', false)
  );

  const snapshot = await getDocs(pendingQuery);
  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data()
  }));
}
