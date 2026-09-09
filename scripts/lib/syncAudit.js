/**
 * Lógica compartida entre check-sync-status.js y backfill-sync.js:
 * inicializa acceso admin a los dos proyectos Firebase (science-in-motion y
 * chago-science-motion) y calcula qué paquetes/ventas del rango dado no
 * tienen una transacción sincronizada en chago.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const admin = require('firebase-admin');

function initApps({ chagoRepoPath }) {
  if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error(
      'Faltan FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY en .env.local (credenciales de servicio de science-in-motion-7bd27).'
    );
  }

  if (!admin.apps.find((a) => a.name === 'source')) {
    admin.initializeApp(
      {
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      },
      'source'
    );
  }

  if (!admin.apps.find((a) => a.name === 'dest')) {
    const chagoEnvPath = path.join(chagoRepoPath, '.env.local');
    if (!fs.existsSync(chagoEnvPath)) {
      throw new Error(`No se encontró ${chagoEnvPath}. Ajusta CHAGO_REPO_PATH.`);
    }
    const chagoEnv = dotenv.parse(fs.readFileSync(chagoEnvPath));
    if (!chagoEnv.FIREBASE_CLIENT_EMAIL || !chagoEnv.FIREBASE_PRIVATE_KEY) {
      throw new Error('El .env.local de Chago Science Motion no tiene FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY.');
    }
    admin.initializeApp(
      {
        credential: admin.credential.cert({
          projectId: chagoEnv.FIREBASE_PROJECT_ID,
          clientEmail: chagoEnv.FIREBASE_CLIENT_EMAIL,
          privateKey: chagoEnv.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      },
      'dest'
    );
  }

  return {
    sourceDb: admin.app('source').firestore(),
    destDb: admin.app('dest').firestore(),
  };
}

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  return new Date(value);
}

function fmtDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function getSyncedExternalIds(destDb) {
  const snap = await destDb.collection('transactions').where('source', '==', 'external').get();
  const ids = new Set();
  snap.forEach((doc) => {
    const data = doc.data();
    if (data.externalId) ids.add(data.externalId);
  });
  return ids;
}

async function getPaquetesAsignados(sourceDb, inRange) {
  const snap = await sourceDb.collectionGroup('paquetesAsignados').get();
  const records = [];
  snap.forEach((doc) => {
    const data = doc.data();
    const fecha = toDate(data.fechaAsignacion);
    if (!inRange(fecha)) return;
    const clienteId = doc.ref.parent.parent ? doc.ref.parent.parent.id : null;
    records.push({
      tipo: 'Paquete',
      externalId: data.transactionExternalId || null,
      nombre: data.nombre || '(sin nombre)',
      monto: Number(data.precioFinal ?? data.precioTotal ?? 0),
      fecha,
      sucursalId: data.sucursalId || 'valquirico',
      clienteId,
      descripcion: `Asignación de paquete: ${data.nombre || ''}${data.descuento ? ` (Descuento: ${data.descuento})` : ''}`,
      docRef: doc.ref,
      ruta: doc.ref.path,
    });
  });
  return records;
}

async function getVentas(sourceDb, inRange) {
  const snap = await sourceDb.collection('ventas').get();
  const records = [];
  snap.forEach((doc) => {
    const data = doc.data();
    const fecha = toDate(data.date);
    if (!inRange(fecha)) return;
    const items = Array.isArray(data.items) ? data.items : [];
    records.push({
      tipo: 'Venta POS',
      externalId: data.transactionExternalId || null,
      nombre: items.map((i) => i.name).join(', ') || '(venta)',
      monto: Number(data.total ?? 0),
      fecha,
      sucursalId: data.sucursalId || 'valquirico',
      clienteId: data.client?.id || 'venta-mostrador',
      descripcion: `Venta POS - ${items.map((i) => `${i.name} x${i.quantity}`).join(', ')}${data.client ? ` - Cliente: ${data.client.nombre}` : ''}`,
      docRef: doc.ref,
      ruta: `ventas/${doc.id}`,
    });
  });
  return records;
}

async function getSyncStatus({ desde, hasta, chagoRepoPath }) {
  const { sourceDb, destDb } = initApps({ chagoRepoPath });

  const inRange = (date) => date instanceof Date && !isNaN(date) && date >= desde && date <= hasta;

  const [syncedIds, paquetes, ventas] = await Promise.all([
    getSyncedExternalIds(destDb),
    getPaquetesAsignados(sourceDb, inRange),
    getVentas(sourceDb, inRange),
  ]);

  const todos = [...paquetes, ...ventas].sort((a, b) => a.fecha - b.fecha);
  const faltantes = todos.filter((r) => !r.externalId || !syncedIds.has(r.externalId));

  return { todos, faltantes, syncedCount: syncedIds.size };
}

module.exports = { getSyncStatus, fmtDate };
