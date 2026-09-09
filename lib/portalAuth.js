import crypto from 'node:crypto';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from './firebase';

const OTP_EXPIRY_MINUTES = 15;
const SESSION_EXPIRY_DAYS = 30;

const COLLECTIONS = {
  OTP: 'portalUserOtp',
  CREDENTIALS: 'portalUserCredentials',
  SESSIONS: 'portalUserSessions',
  CLIENTES: 'clientes',
  ATLETAS: 'atletas',
  CLASES: 'clases',
  SUCURSALES: 'sucursales'
};

export const PORTAL_COOKIE_NAME = 'portal-user-session';

export function normalizeEmail(email = '') {
  return String(email || '').trim().toLowerCase();
}

function nowPlusDays(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function nowPlusMinutes(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function timestampToISO(timestamp) {
  if (!timestamp) return null;
  if (typeof timestamp === 'string') return timestamp;
  if (timestamp?.toDate) return timestamp.toDate().toISOString();
  if (timestamp instanceof Date) return timestamp.toISOString();
  return null;
}

export function createOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function hashOtp(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

export function createSalt() {
  return crypto.randomBytes(16).toString('hex');
}

export function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function verifyPassword(password, salt, passwordHash) {
  const computed = hashPassword(password, salt);
  const a = Buffer.from(computed, 'hex');
  const b = Buffer.from(passwordHash, 'hex');

  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function createSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashSessionToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function buildSessionCookie(token, maxAgeSeconds = 60 * 60 * 24 * SESSION_EXPIRY_DAYS) {
  const isProd = process.env.NODE_ENV === 'production';
  return `${PORTAL_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${isProd ? '; Secure' : ''}`;
}

export function buildClearSessionCookie() {
  const isProd = process.env.NODE_ENV === 'production';
  return `${PORTAL_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isProd ? '; Secure' : ''}`;
}

export function getCookieValue(req, cookieName) {
  const rawCookie = req.headers.cookie || '';
  const chunks = rawCookie.split(';').map((chunk) => chunk.trim());

  for (const chunk of chunks) {
    if (!chunk) continue;
    const [name, ...rest] = chunk.split('=');
    if (name === cookieName) return decodeURIComponent(rest.join('='));
  }

  return null;
}

export async function findPortalUserByEmail(emailInput) {
  const normalizedEmail = normalizeEmail(emailInput);
  if (!normalizedEmail) return null;

  const collectionsToSearch = [COLLECTIONS.CLIENTES, COLLECTIONS.ATLETAS];

  for (const collectionName of collectionsToSearch) {
    const emailQueries = [normalizedEmail];
    if (emailInput && emailInput !== normalizedEmail) {
      emailQueries.push(String(emailInput).trim());
    }

    for (const emailToQuery of emailQueries) {
      const ref = collection(db, collectionName);
      const q = query(ref, where('email', '==', emailToQuery), limit(1));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        const data = userDoc.data() || {};
        const fullName = `${data.nombre || ''} ${data.apellidoPaterno || ''} ${data.apellidoMaterno || ''}`.trim();

        return {
          userId: userDoc.id,
          userType: collectionName === COLLECTIONS.CLIENTES ? 'cliente' : 'atleta',
          collectionName,
          data,
          normalizedEmail,
          fullName: fullName || data.nombre || 'Usuario'
        };
      }
    }
  }

  return null;
}

export async function getPortalCredentials(userId) {
  const ref = doc(db, COLLECTIONS.CREDENTIALS, userId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return snapshot.data();
}

export async function saveOtpForUser({ userId, email, code }) {
  const otpRef = doc(db, COLLECTIONS.OTP, userId);

  await setDoc(otpRef, {
    userId,
    email: normalizeEmail(email),
    codeHash: hashOtp(code),
    expiresAt: nowPlusMinutes(OTP_EXPIRY_MINUTES),
    attempts: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function validateOtpForUser({ userId, email, code }) {
  const otpRef = doc(db, COLLECTIONS.OTP, userId);
  const snapshot = await getDoc(otpRef);

  if (!snapshot.exists()) {
    return { valid: false, reason: 'Código no encontrado o expirado' };
  }

  const otpData = snapshot.data();
  const expired = otpData.expiresAt?.toDate ? otpData.expiresAt.toDate() < new Date() : true;
  const emailMatches = otpData.email === normalizeEmail(email);

  if (expired) {
    return { valid: false, reason: 'Código expirado' };
  }

  if (!emailMatches) {
    return { valid: false, reason: 'Correo no coincide con el código' };
  }

  const expectedHash = otpData.codeHash;
  const currentHash = hashOtp(code);
  const a = Buffer.from(expectedHash, 'hex');
  const b = Buffer.from(currentHash, 'hex');
  const hashMatch = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!hashMatch) {
    await updateDoc(otpRef, {
      attempts: (otpData.attempts || 0) + 1,
      updatedAt: serverTimestamp()
    });
    return { valid: false, reason: 'Código inválido' };
  }

  await updateDoc(otpRef, {
    consumedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return { valid: true };
}

export async function upsertPortalCredentials({ userId, email, password }) {
  const salt = createSalt();
  const passwordHash = hashPassword(password, salt);
  const ref = doc(db, COLLECTIONS.CREDENTIALS, userId);

  await setDoc(ref, {
    email: normalizeEmail(email),
    salt,
    passwordHash,
    active: true,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  }, { merge: true });
}

export async function createPortalSession(userId) {
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = nowPlusDays(SESSION_EXPIRY_DAYS);
  const sessionRef = doc(collection(db, COLLECTIONS.SESSIONS));

  await setDoc(sessionRef, {
    userId,
    tokenHash,
    createdAt: serverTimestamp(),
    expiresAt,
    active: true,
    lastSeenAt: serverTimestamp()
  });

  return {
    token,
    expiresAt
  };
}

export async function getSessionFromRequest(req) {
  const token = getCookieValue(req, PORTAL_COOKIE_NAME);
  if (!token) return null;

  const tokenHash = hashSessionToken(token);
  const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
  const q = query(sessionsRef, where('tokenHash', '==', tokenHash), where('active', '==', true), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const sessionDoc = snapshot.docs[0];
  const sessionData = sessionDoc.data();
  const expiresAt = sessionData.expiresAt?.toDate ? sessionData.expiresAt.toDate() : null;

  if (!expiresAt || expiresAt < new Date()) {
    await updateDoc(sessionDoc.ref, { active: false, updatedAt: serverTimestamp() });
    return null;
  }

  await updateDoc(sessionDoc.ref, { lastSeenAt: serverTimestamp() });

  return {
    id: sessionDoc.id,
    ...sessionData
  };
}

export async function closeSessionFromRequest(req) {
  const token = getCookieValue(req, PORTAL_COOKIE_NAME);
  if (!token) return;

  const tokenHash = hashSessionToken(token);
  const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
  const q = query(sessionsRef, where('tokenHash', '==', tokenHash), where('active', '==', true), limit(1));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    await updateDoc(snapshot.docs[0].ref, {
      active: false,
      closedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
}

async function getUserById(userId) {
  const clienteDoc = await getDoc(doc(db, COLLECTIONS.CLIENTES, userId));
  if (clienteDoc.exists()) {
    return {
      collectionName: COLLECTIONS.CLIENTES,
      userType: 'cliente',
      id: userId,
      data: clienteDoc.data()
    };
  }

  const atletaDoc = await getDoc(doc(db, COLLECTIONS.ATLETAS, userId));
  if (atletaDoc.exists()) {
    return {
      collectionName: COLLECTIONS.ATLETAS,
      userType: 'atleta',
      id: userId,
      data: atletaDoc.data()
    };
  }

  return null;
}

async function getSucursalNames(userData) {
  const sucursalesIds = Array.isArray(userData?.sucursales)
    ? userData.sucursales
    : userData?.sucursal
      ? [userData.sucursal]
      : [];

  if (sucursalesIds.length === 0) return [];

  const names = await Promise.all(
    sucursalesIds.map(async (sucursalId) => {
      if (typeof sucursalId === 'string' && sucursalId.length > 25) return sucursalId;
      const sucursalDoc = await getDoc(doc(db, COLLECTIONS.SUCURSALES, String(sucursalId)));
      if (sucursalDoc.exists()) {
        const data = sucursalDoc.data();
        return data.name || data.nombre || String(sucursalId);
      }
      return String(sucursalId);
    })
  );

  return names;
}

async function getUserPackagesData(userId, collectionName) {
  const ref = collection(db, collectionName, userId, 'paquetesAsignados');
  const q = query(ref, orderBy('fechaAsignacion', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((packageDoc) => {
    const pkg = packageDoc.data() || {};
    return {
      id: packageDoc.id,
      idPaquete: pkg.idPaquete || null,
      nombre: pkg.nombre || 'Paquete',
      descripcion: pkg.descripcion || '',
      tipo: pkg.tipo || null,
      precioFinal: pkg.precioFinal || null,
      precioOriginal: pkg.precioOriginal || null,
      descuento: pkg.descuento || null,
      status: pkg.status || null,
      activo: pkg.activo ?? null,
      numeroServicios: pkg.numeroServicios || 0,
      sessionsTaken: pkg.sessionsTaken ? pkg.sessionsTaken.length : 0,
      fechaAsignacion: timestampToISO(pkg.fechaAsignacion),
      sucursalId: pkg.sucursalId || null,
    };
  });
}

async function getUserActivitiesData(userId, collectionName) {
  const ref = collection(db, collectionName, userId, 'clasesAsignadas');
  let snapshot;

  try {
    const q = query(ref, orderBy('fechaAsignacion', 'desc'), limit(20));
    snapshot = await getDocs(q);
  } catch {
    // Fallback without orderBy if index doesn't exist
    try {
      snapshot = await getDocs(ref);
    } catch {
      return [];
    }
  }

  const activities = await Promise.all(
    snapshot.docs.map(async (activityDoc) => {
      const activity = activityDoc.data() || {};
      let classData = null;

      if (activity.idClase) {
        try {
          const classDoc = await getDoc(doc(db, COLLECTIONS.CLASES, activity.idClase));
          if (classDoc.exists()) {
            const data = classDoc.data() || {};
            classData = {
              nombre: data.nombre || 'Actividad',
              tipo: data.tipo || null,
              instructor: data.instructor || null,
              modoProgramacion: data.modoProgramacion || 'recurrente',
              diasSemana: Array.isArray(data.diasSemana) ? data.diasSemana : [],
              horaInicio: data.horaInicio || null,
              fechaEspecifica: data.fechaEspecifica || null,
              horaEspecifica: data.horaEspecifica || null,
              fechasEspecificas: Array.isArray(data.fechasEspecificas) ? data.fechasEspecificas : [],
              ubicacion: data.ubicacion || null,
            };
          }
        } catch {
          // Class doc fetch failed, skip
        }
      }

      return {
        id: activityDoc.id,
        idClase: activity.idClase || null,
        nombre: activity.nombre || null,
        estado: activity.estado || null,
        origenRegistro: activity.origenRegistro || null,
        fechaAsignacion: timestampToISO(activity.fechaAsignacion),
        fechaAsignacionString: activity.fechaAsignacionString || null,
        fechaEvaluacion: activity.fechaEvaluacion || null,
        classData
      };
    })
  );

  // Sort by date descending (needed if fallback query was used without orderBy)
  const filtered = activities.filter((activity) => Boolean(activity.classData));
  filtered.sort((a, b) => (b.fechaAsignacion || '').localeCompare(a.fechaAsignacion || ''));
  return filtered;
}

export async function getPortalDashboardData(userId) {
  const user = await getUserById(userId);
  if (!user) return null;

  const userData = user.data || {};
  const fullName = `${userData.nombre || ''} ${userData.apellidoPaterno || ''} ${userData.apellidoMaterno || ''}`.trim();

  const [sucursales, packages, activities] = await Promise.all([
    getSucursalNames(userData),
    getUserPackagesData(userId, user.collectionName),
    getUserActivitiesData(userId, user.collectionName)
  ]);

  return {
    user: {
      id: userId,
      type: user.userType,
      name: fullName || userData.nombre || 'Usuario',
      ocupacion: userData.ocupacion || userData.deporte || 'Sin especificar',
      status: userData.status || 'active',
      foto: userData.foto || null,
      email: userData.email || 'Sin email',
      telefonoContacto: userData.telefonoContacto || userData.telefono || 'Sin telefono',
      telefonoEmergencia: userData.telefonoEmergencia || 'Sin telefono',
      nombreContactoEmergencia: userData.nombreContactoEmergencia || null,
      fechaNacimiento: userData.fechaNacimiento || null,
      edad: userData.edad || null,
      genero: userData.genero || null,
      ladoDominante: userData.ladoDominante || null,
      responsable: userData.responsable || null,
      sucursales,
      deporte: userData.deporte || null,
      categoria: userData.categoria || null,
      plataformaFitness: userData.plataformaFitness || null
    },
    packages,
    activities
  };
}
