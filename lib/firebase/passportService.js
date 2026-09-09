// lib/firebase/passportService.js
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  PASSPORT_DEFAULT_YEAR,
  PASSPORT_MONTHS,
  PASSPORT_QUARTERS,
  CONSTANCY_STAMP_TYPES,
  EXPERIENCE_STAMP_TYPES,
  MONTHLY_REWARDS_BY_QUARTER,
  QUARTERLY_REWARDS,
  BODY_COMPOSITION_PERIODS,
  MAX_ANNUAL_STAMPS
} from '../domain/passportConstants';

export function getPassportId(userId, year = PASSPORT_DEFAULT_YEAR) {
  return `${userId}_${year}`;
}

/**
 * Obtener o inicializar el documento de Pasaporte de un alumno
 */
export async function getOrCreatePassport(userId, year = PASSPORT_DEFAULT_YEAR, userInfo = {}) {
  const passportId = getPassportId(userId, year);
  const passportRef = doc(db, 'pasaportes', passportId);
  const passportSnap = await getDoc(passportRef);

  let passportData = null;

  if (!passportSnap.exists()) {
    passportData = {
      id: passportId,
      userId,
      userType: userInfo.userType || 'cliente',
      userName: userInfo.userName || 'Atleta',
      year: Number(year),
      status: 'activo',
      fechaInicio: `${year}-01-01`,
      fotoInicioUrl: userInfo.foto || null,
      fechaFin: null,
      fotoFinUrl: null,
      totalSellos: 0,
      sellosConstancia: 0,
      sellosExperiencia: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(passportRef, passportData);
  } else {
    passportData = passportSnap.data();
  }

  // Cargar subcolecciones
  const [sellosSnap, recompensasSnap, composicionSnap] = await Promise.all([
    getDocs(collection(db, 'pasaportes', passportId, 'sellos')),
    getDocs(collection(db, 'pasaportes', passportId, 'recompensas')),
    getDocs(collection(db, 'pasaportes', passportId, 'composicionCorporal'))
  ]);

  const sellosMap = {};
  let countConstancia = 0;
  let countExperiencia = 0;

  sellosSnap.forEach(docSnap => {
    const data = docSnap.data();
    sellosMap[docSnap.id] = { id: docSnap.id, ...data };
    if (data.categoria === 'constancia') countConstancia++;
    if (data.categoria === 'experiencia') countExperiencia++;
  });

  const totalSellos = countConstancia + countExperiencia;

  // Si hay discrepancia en contadores almacenados, actualizar
  if (passportData.totalSellos !== totalSellos || 
      passportData.sellosConstancia !== countConstancia || 
      passportData.sellosExperiencia !== countExperiencia) {
    passportData.totalSellos = totalSellos;
    passportData.sellosConstancia = countConstancia;
    passportData.sellosExperiencia = countExperiencia;
    await updateDoc(passportRef, {
      totalSellos,
      sellosConstancia: countConstancia,
      sellosExperiencia: countExperiencia,
      updatedAt: serverTimestamp()
    });
  }

  const recompensasMap = {};
  recompensasSnap.forEach(docSnap => {
    recompensasMap[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
  });

  const composicionMap = {};
  composicionSnap.forEach(docSnap => {
    composicionMap[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
  });

  // Estructurar estado completo por mes y trimestre
  const mesesEstado = PASSPORT_MONTHS.map(m => {
    const stamps = {};
    let sellosMesCount = 0;

    Object.keys(CONSTANCY_STAMP_TYPES).forEach(k => {
      const stampType = CONSTANCY_STAMP_TYPES[k].id;
      const stampDocId = `${m.id}_${stampType}`;
      const obtenido = !!sellosMap[stampDocId]?.obtenido;
      stamps[stampType] = {
        ...CONSTANCY_STAMP_TYPES[k],
        docId: stampDocId,
        obtenido,
        detalles: sellosMap[stampDocId] || null
      };
      if (obtenido) sellosMesCount++;
    });

    const mesCompleto = sellosMesCount === 4;
    const recompensaId = `mensual_${m.id}`;
    const recompensaData = recompensasMap[recompensaId] || null;

    return {
      ...m,
      sellos: stamps,
      sellosObtenidosCount: sellosMesCount,
      mesCompleto,
      recompensaMensual: {
        docId: recompensaId,
        desbloqueada: mesCompleto,
        opciones: MONTHLY_REWARDS_BY_QUARTER[m.trimestre] || [],
        seleccionada: recompensaData
      },
      composicionCorporal: composicionMap[m.id] || null
    };
  });

  const trimestresEstado = PASSPORT_QUARTERS.map(q => {
    const expStamps = {};
    let expCount = 0;

    Object.keys(EXPERIENCE_STAMP_TYPES).forEach(k => {
      const stampType = EXPERIENCE_STAMP_TYPES[k].id;
      const stampDocId = `${q.id}_${stampType}`;
      const obtenido = !!sellosMap[stampDocId]?.obtenido;
      expStamps[stampType] = {
        ...EXPERIENCE_STAMP_TYPES[k],
        docId: stampDocId,
        obtenido,
        detalles: sellosMap[stampDocId] || null
      };
      if (obtenido) expCount++;
    });

    const recompensaData = recompensasMap[`trimestral_${q.id}`] || null;
    const metaAlcanzada = totalSellos >= q.metaAcumulada;

    return {
      ...q,
      sellosExperiencia: expStamps,
      sellosExperienciaCount: expCount,
      metaAlcanzada,
      recompensaTrimestral: {
        docId: `trimestral_${q.id}`,
        desbloqueada: metaAlcanzada,
        metaSellos: q.metaAcumulada,
        opciones: QUARTERLY_REWARDS[q.id]?.opciones || [],
        seleccionada: recompensaData
      }
    };
  });

  // Próxima recompensa
  let proximaRecompensa = null;
  for (const q of PASSPORT_QUARTERS) {
    if (totalSellos < q.metaAcumulada) {
      proximaRecompensa = {
        trimestre: q.id,
        nombre: q.nombre,
        metaSellos: q.metaAcumulada,
        sellosFaltantes: q.metaAcumulada - totalSellos
      };
      break;
    }
  }

  return {
    passport: {
      ...passportData,
      porcentajeProgreso: Math.min(100, Math.round((totalSellos / MAX_ANNUAL_STAMPS) * 100)),
      proximaRecompensa
    },
    meses: mesesEstado,
    trimestres: trimestresEstado,
    composiciones: composicionMap,
    sellosRaw: sellosMap,
    recompensasRaw: recompensasMap
  };
}

/**
 * Asignar un sello de forma segura
 */
export async function assignStamp(userId, year = PASSPORT_DEFAULT_YEAR, stampPayload = {}, adminInfo = {}) {
  const { categoria, tipo, periodo, trimestre, evidencia = '', origen = 'manual' } = stampPayload;

  if (!categoria || !tipo || !periodo || !trimestre) {
    throw new Error('Faltan campos requeridos para asignar el sello (categoría, tipo, periodo, trimestre).');
  }

  // Validar periodo
  const stampDocId = `${periodo}_${tipo}`;
  const passportId = getPassportId(userId, year);

  // Asegurar que el pasaporte exista
  await getOrCreatePassport(userId, year);

  const stampRef = doc(db, 'pasaportes', passportId, 'sellos', stampDocId);
  const stampSnap = await getDoc(stampRef);

  if (stampSnap.exists() && stampSnap.data()?.obtenido) {
    throw new Error(`El sello ${tipo} para el periodo ${periodo} ya ha sido otorgado previamente.`);
  }

  const stampDocData = {
    id: stampDocId,
    categoria,
    tipo,
    periodo,
    trimestre,
    obtenido: true,
    fechaAsignacion: new Date().toISOString(),
    asignadoPorId: adminInfo.id || 'admin',
    asignadoPorNombre: adminInfo.name || adminInfo.email || 'Administrador',
    asignadoPorRol: adminInfo.role || 'admin',
    origen,
    evidencia: evidencia || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(stampRef, stampDocData);

  // Recalcular
  const updatedPassport = await getOrCreatePassport(userId, year);
  return { success: true, stamp: stampDocData, passportSummary: updatedPassport.passport };
}

/**
 * Revocar / Eliminar un sello asignado por error
 */
export async function revokeStamp(userId, year = PASSPORT_DEFAULT_YEAR, stampDocId) {
  if (!stampDocId) throw new Error('Identificador de sello requerido.');

  const passportId = getPassportId(userId, year);
  const stampRef = doc(db, 'pasaportes', passportId, 'sellos', stampDocId);
  const stampSnap = await getDoc(stampRef);

  if (!stampSnap.exists()) {
    throw new Error('El sello no existe.');
  }

  await deleteDoc(stampRef);

  // Recalcular
  const updatedPassport = await getOrCreatePassport(userId, year);
  return { success: true, message: 'Sello revocado exitosamente', passportSummary: updatedPassport.passport };
}

/**
 * Registrar o actualizar medición de composición corporal (InBody)
 */
export async function recordBodyComposition(userId, year = PASSPORT_DEFAULT_YEAR, period, biometrics = {}, adminInfo = {}) {
  if (!BODY_COMPOSITION_PERIODS.includes(period)) {
    throw new Error(`El periodo ${period} no es válido para composición corporal. Periodos válidos: ${BODY_COMPOSITION_PERIODS.join(', ')}.`);
  }

  const passportId = getPassportId(userId, year);
  await getOrCreatePassport(userId, year);

  const compRef = doc(db, 'pasaportes', passportId, 'composicionCorporal', period);

  const peso = Number(biometrics.peso) || null;
  const altura = Number(biometrics.altura) || null;
  let imc = Number(biometrics.imc) || null;

  if (!imc && peso && altura && altura > 0) {
    const alturaM = altura > 3 ? altura / 100 : altura;
    imc = Number((peso / (alturaM * alturaM)).toFixed(1));
  }

  const compData = {
    id: period,
    periodo: period,
    fechaMedicion: biometrics.fechaMedicion || new Date().toISOString().slice(0, 10),
    registradoPorId: adminInfo.id || 'admin',
    registradoPorNombre: adminInfo.name || adminInfo.email || 'Coach',
    registradoPorRol: adminInfo.role || 'coach',
    peso,
    imc,
    grasaCorporal: Number(biometrics.grasaCorporal) || null,
    musculoEsqueletico: Number(biometrics.musculoEsqueletico) || null,
    grasaVisceral: Number(biometrics.grasaVisceral) || null,
    metabolismoBasal: Number(biometrics.metabolismoBasal) || null,
    edadCorporal: Number(biometrics.edadCorporal) || null,
    notas: biometrics.notas || '',
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  };

  await setDoc(compRef, compData, { merge: true });
  return { success: true, data: compData };
}

/**
 * Elegir / Solicitar una recompensa (Alumno)
 */
export async function selectReward(userId, year = PASSPORT_DEFAULT_YEAR, { tipo, periodo, opcionId, opcionTitulo }) {
  if (!tipo || !periodo || !opcionId) {
    throw new Error('Faltan parámetros requeridos para elegir la recompensa.');
  }

  const passportState = await getOrCreatePassport(userId, year);
  const passportId = getPassportId(userId, year);
  const rewardDocId = `${tipo}_${periodo}`;

  // Validar elegibilidad
  if (tipo === 'mensual') {
    const mesObj = passportState.meses.find(m => m.id === periodo);
    if (!mesObj) throw new Error('Mes inválido.');
    if (!mesObj.mesCompleto) {
      throw new Error(`Aún no has completado los 4 sellos requeridos para ${mesObj.nombre}.`);
    }
  } else if (tipo === 'trimestral') {
    const triObj = passportState.trimestres.find(t => t.id === periodo);
    if (!triObj) throw new Error('Trimestre inválido.');
    if (!triObj.metaAlcanzada) {
      throw new Error(`Aún no alcanzas la meta de ${triObj.metaAcumulada} sellos para este trimestre.`);
    }
  } else {
    throw new Error('Tipo de recompensa no reconocido.');
  }

  const rewardRef = doc(db, 'pasaportes', passportId, 'recompensas', rewardDocId);
  const currentSnap = await getDoc(rewardRef);

  if (currentSnap.exists() && currentSnap.data()?.estado === 'entregada') {
    throw new Error('Esta recompensa ya fue entregada y no puede ser modificada.');
  }

  const rewardData = {
    id: rewardDocId,
    tipo,
    periodo,
    opcionElegida: opcionId,
    opcionTitulo: opcionTitulo || opcionId,
    fechaEleccion: new Date().toISOString(),
    estado: 'solicitada', // "solicitada" -> el staff la entrega en sede
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  };

  await setDoc(rewardRef, rewardData, { merge: true });
  return { success: true, reward: rewardData };
}

/**
 * Marcar una recompensa como entregada (Admin / Recepción)
 */
export async function markRewardDelivered(userId, year = PASSPORT_DEFAULT_YEAR, rewardDocId, deliveryInfo = {}, adminInfo = {}) {
  const passportId = getPassportId(userId, year);
  const rewardRef = doc(db, 'pasaportes', passportId, 'recompensas', rewardDocId);
  const currentSnap = await getDoc(rewardRef);

  if (!currentSnap.exists()) {
    throw new Error('El registro de recompensa no existe.');
  }

  const updateData = {
    estado: 'entregada',
    entregadaPorId: adminInfo.id || 'admin',
    entregadaPorNombre: adminInfo.name || adminInfo.email || 'Staff',
    fechaEntrega: new Date().toISOString(),
    notasEntrega: deliveryInfo.notas || '',
    updatedAt: serverTimestamp()
  };

  await updateDoc(rewardRef, updateData);
  return { success: true, rewardId: rewardDocId };
}

/**
 * Actualizar imágenes de inicio y cierre de año
 */
export async function updatePassportPhotos(userId, year = PASSPORT_DEFAULT_YEAR, photoPayload = {}) {
  const passportId = getPassportId(userId, year);
  const passportRef = doc(db, 'pasaportes', passportId);

  const toUpdate = {
    updatedAt: serverTimestamp()
  };

  if (photoPayload.fotoInicioUrl !== undefined) toUpdate.fotoInicioUrl = photoPayload.fotoInicioUrl;
  if (photoPayload.fechaInicio !== undefined) toUpdate.fechaInicio = photoPayload.fechaInicio;
  if (photoPayload.fotoFinUrl !== undefined) toUpdate.fotoFinUrl = photoPayload.fotoFinUrl;
  if (photoPayload.fechaFin !== undefined) toUpdate.fechaFin = photoPayload.fechaFin;

  await updateDoc(passportRef, toUpdate);
  return { success: true };
}

/**
 * Cálculo inteligente de entrenamientos/asistencias del mes para asistir al Admin
 */
export async function calculateMonthlyAttendanceCandidate(userId, year = PASSPORT_DEFAULT_YEAR, monthNumber = 1) {
  try {
    const monthIndex = Number(monthNumber) - 1;
    const startOfMonth = new Date(year, monthIndex, 1, 0, 0, 0);
    const endOfMonth = new Date(year, monthIndex + 1, 0, 23, 59, 59);

    const startStr = `${year}-${String(monthNumber).padStart(2, '0')}-01`;
    const endStr = `${year}-${String(monthNumber).padStart(2, '0')}-${String(endOfMonth.getDate()).padStart(2, '0')}`;

    // 1. Buscar en clases asignadas del cliente
    let asistenciasClases = 0;
    for (const col of ['clientes', 'atletas']) {
      try {
        const clasesRef = collection(db, col, userId, 'clasesAsignadas');
        const q = query(clasesRef, where('estado', '==', 'asistida'));
        const snap = await getDocs(q);
        snap.forEach(d => {
          const data = d.data();
          const f = data.fechaAsignacionString || data.fechaEspecifica;
          if (f && f >= startStr && f <= endStr) {
            asistenciasClases++;
          }
        });
      } catch {}
    }

    // 2. Buscar en accesos físicos
    let accesosCount = 0;
    try {
      const accesosRef = collection(db, 'accesos');
      const q = query(accesosRef, where('userId', '==', userId));
      const snap = await getDocs(q);
      snap.forEach(d => {
        const data = d.data();
        const ts = data.timestamp?.toDate ? data.timestamp.toDate() : (data.timestamp ? new Date(data.timestamp) : null);
        if (ts && ts >= startOfMonth && ts <= endOfMonth) {
          accesosCount++;
        }
      });
    } catch {}

    const totalAsistencias = Math.max(asistenciasClases, accesosCount);
    const target = 12;

    return {
      monthNumber,
      asistenciasClases,
      accesosCount,
      totalCalculado: totalAsistencias,
      metaRequerida: target,
      cumpleRequisito: totalAsistencias >= target
    };
  } catch (error) {
    console.error('Error calculando asistencias:', error);
    return { totalCalculado: 0, metaRequerida: 12, cumpleRequisito: false };
  }
}
