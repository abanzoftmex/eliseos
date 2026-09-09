import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Crea un nuevo cargo en la subcollección del cliente/atleta.
 * Se usa principalmente desde el POS al registrar una venta con "Paga Después".
 */
export const createCargo = async (userId, userType, cargoData) => {
  try {
    const userCollection = userType === 'atleta' ? 'atletas' : 'clientes';
    const cargosRef = collection(db, userCollection, userId, 'cargos');

    const docRef = await addDoc(cargosRef, {
      tipo: cargoData.tipo || 'venta_pos',
      descripcion: cargoData.descripcion || '',
      items: cargoData.items || [],
      monto: Number(cargoData.monto || 0),
      montoPagado: 0,
      estatus: 'pendiente', // pendiente | parcial | pagado | cancelado
      ventaId: cargoData.ventaId || null,
      sucursalId: cargoData.sucursalId || null,
      isPaid: false,
      paymentPendingValidation: false,
      abonosReportados: [],
      totalReportado: 0,
      totalValidado: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true, cargoId: docRef.id };
  } catch (error) {
    console.error('Error creating cargo:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtiene los cargos de un usuario, opcionalmente filtrando por estatus.
 */
export const getCargosByUser = async (userId, userType, estatus = null) => {
  try {
    const userCollection = userType === 'atleta' ? 'atletas' : 'clientes';
    const cargosRef = collection(db, userCollection, userId, 'cargos');

    let constraints = [orderBy('createdAt', 'desc')];
    if (estatus) {
      constraints = [where('estatus', '==', estatus), orderBy('createdAt', 'desc')];
    }

    const snap = await getDocs(query(cargosRef, ...constraints));
    const cargos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return { success: true, cargos };
  } catch (error) {
    // Fallback sin orderBy si falta índice
    try {
      const userCollection = userType === 'atleta' ? 'atletas' : 'clientes';
      const cargosRef = collection(db, userCollection, userId, 'cargos');
      const constraints = estatus ? [where('estatus', '==', estatus)] : [];
      const snap = await getDocs(query(cargosRef, ...constraints));
      const cargos = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() || 0;
          const tb = b.createdAt?.toMillis?.() || 0;
          return tb - ta;
        });
      return { success: true, cargos };
    } catch (fallbackError) {
      console.error('Error fetching cargos:', fallbackError);
      return { success: false, error: fallbackError.message, cargos: [] };
    }
  }
};

/**
 * Reporta un abono (evidencia de pago) para un cargo.
 * Llamado desde el portal del usuario.
 */
export const reportCargoPago = async (userId, userType, cargoId, abonoData) => {
  try {
    const userCollection = userType === 'atleta' ? 'atletas' : 'clientes';
    const cargoRef = doc(db, userCollection, userId, 'cargos', cargoId);

    const snap = await getDoc(cargoRef);
    if (!snap.exists()) throw new Error('Cargo no encontrado');

    const data = snap.data();

    const nuevoAbono = {
      id: Date.now().toString(),
      monto: Number(abonoData.monto),
      evidenciaUrl: abonoData.evidenciaUrl || null,
      notas: abonoData.notas || 'Abono reportado desde portal',
      fechaReporte: new Date().toISOString(),
      estado: 'pendiente',
    };

    await updateDoc(cargoRef, {
      paymentPendingValidation: true,
      abonosReportados: arrayUnion(nuevoAbono),
      totalReportado: (data.totalReportado || 0) + Number(abonoData.monto),
      updatedAt: serverTimestamp(),
    });

    return { success: true, message: 'Abono registrado correctamente' };
  } catch (error) {
    console.error('Error reporting cargo pago:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Valida o rechaza un abono de un cargo.
 * Llamado desde el panel de administración.
 */
export const validarCargoAbono = async (userId, userType, cargoId, abonoId, action, reason = '') => {
  try {
    const userCollection = userType === 'atleta' ? 'atletas' : 'clientes';
    const cargoRef = doc(db, userCollection, userId, 'cargos', cargoId);

    const snap = await getDoc(cargoRef);
    if (!snap.exists()) throw new Error('Cargo no encontrado');

    const data = snap.data();
    const abonos = data.abonosReportados || [];

    let totalValidado = data.totalValidado || 0;

    const nuevosAbonos = abonos.map((a) => {
      if (a.id === abonoId && a.estado === 'pendiente') {
        if (action === 'validate') {
          totalValidado += Number(a.monto);
          return { ...a, estado: 'validado', fechaValidacion: new Date().toISOString() };
        } else if (action === 'reject') {
          return { ...a, estado: 'rechazado', razon: reason, fechaRechazo: new Date().toISOString() };
        }
      }
      return a;
    });

    const monto = Number(data.monto || 0);
    const isPaid = totalValidado >= monto;
    const hayPendientes = nuevosAbonos.some((a) => a.estado === 'pendiente');

    let estatus = 'pendiente';
    if (isPaid) estatus = 'pagado';
    else if (totalValidado > 0) estatus = 'parcial';

    const updates = {
      abonosReportados: nuevosAbonos,
      totalValidado,
      montoPagado: totalValidado,
      estatus,
      isPaid,
      paymentPendingValidation: hayPendientes,
      updatedAt: serverTimestamp(),
    };

    if (isPaid) {
      updates.fechaPago = serverTimestamp();
    }

    await updateDoc(cargoRef, updates);

    return { success: true, isPaid, totalValidado, estatus };
  } catch (error) {
    console.error('Error validating cargo abono:', error);
    return { success: false, error: error.message };
  }
};
