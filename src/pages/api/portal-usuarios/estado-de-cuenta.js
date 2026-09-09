import { doc, getDoc, getDocs, collection, query, orderBy } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { getSessionFromRequest } from '../../../../lib/portalAuth';
import { Activity } from '../../../../lib/domain/activity/entity';
import { calcularDiasRestantes, calcularFechaExpiracion } from '../../../utils/packageUtils';

function toSerializable(val) {
  if (!val) return null;
  if (typeof val?.toDate === 'function') return val.toDate().toISOString();
  if (val instanceof Date) return val.toISOString();
  return val;
}

function calcularVigenciaPlan(plan) {
  const diasRestantes = calcularDiasRestantes(plan.fechaAsignacion);
  const fechaExpiracion = calcularFechaExpiracion(plan.fechaAsignacion);
  let statusVigencia = 'activo';
  if (diasRestantes <= 0) statusVigencia = 'expirado';
  else if (diasRestantes <= 7) statusVigencia = 'por_vencer';

  return {
    id: plan.id,
    nombre: plan.nombre || plan.name || 'Plan',
    tipo: plan.tipo || 'grupal',
    precioFinal: Number(plan.precioFinal || plan.precio || 0),
    montoPagado: Number(plan.montoPagado || 0),
    saldoPendiente: Math.max(0, Number(plan.precioFinal || plan.precio || 0) - Number(plan.montoPagado || 0)),
    diasRestantes,
    fechaExpiracion: fechaExpiracion ? fechaExpiracion.toISOString() : null,
    fechaAsignacion: toSerializable(plan.fechaAsignacion),
    statusVigencia,
    status: plan.status || 'active',
    tipoItem: 'plan',
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return res.status(401).json({ error: 'Sesión no válida' });
    }

    // Determinar tipo de usuario
    let userType = 'cliente';
    const clienteSnap = await getDoc(doc(db, 'clientes', session.userId));
    if (!clienteSnap.exists()) {
      const atletaSnap = await getDoc(doc(db, 'atletas', session.userId));
      if (atletaSnap.exists()) userType = 'atleta';
    }

    const userCollection = userType === 'cliente' ? 'clientes' : 'atletas';

    // ── Obtener las 3 fuentes en paralelo ──────────────────────────────────
    const [activitiesSnap, cargosSnap, paquetesSnap] = await Promise.all([
      getDocs(query(
        collection(db, userCollection, session.userId, 'clasesAsignadas'),
        orderBy('fechaAsignacion', 'desc')
      )).catch(() =>
        getDocs(collection(db, userCollection, session.userId, 'clasesAsignadas'))
      ),
      getDocs(query(
        collection(db, userCollection, session.userId, 'cargos'),
        orderBy('createdAt', 'desc')
      )).catch(() =>
        getDocs(collection(db, userCollection, session.userId, 'cargos'))
      ),
      getDocs(collection(db, userCollection, session.userId, 'paquetesAsignados')),
    ]);

    // ── Fuente 1: clases asignadas ─────────────────────────────────────────
    const allActivities = await Promise.all(
      activitiesSnap.docs.map(async (d) => {
        const data = d.data();
        let classData = {};
        if (data.idClase) {
          const cDoc = await getDoc(doc(db, 'clases', data.idClase));
          if (cDoc.exists()) classData = cDoc.data();
        }
        return new Activity({ id: d.id, ...classData, ...data });
      })
    );

    const clasesPendientes = allActivities.filter(
      (a) => a.requiresPayment() && !a.isPaid && !a.paymentPendingValidation
    );
    const clasesEnValidacion = allActivities.filter(
      (a) => a.requiresPayment() && !a.isPaid && a.paymentPendingValidation
    );
    const clasesPagadas = allActivities.filter(
      (a) => a.requiresPayment() && a.isPaid
    );

    const mapClase = (a) => ({
      id: a.id,
      nombre: a.name,
      // backward-compat aliases used by existing UI
      name: a.name,
      price: a.price,
      precio: a.price,
      fecha: a.getDisplayDate(),
      date: a.getDisplayDate(),
      hora: a.getDisplayTime(),
      time: a.getDisplayTime(),
      status: a.status,
      tipoItem: 'clase',
      isPaid: a.isPaid,
      paymentPendingValidation: a.paymentPendingValidation,
      montoReportado: a.paymentAmountReported || 0,
      reportedAmount: a.paymentAmountReported || 0,
      totalValidado: Number(a.totalValidado || 0),
      abonosReportados: a.abonosReportados || [],
    });

    // ── Fuente 2: cargos POS ───────────────────────────────────────────────
    const allCargos = cargosSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const cargosPendientes = allCargos.filter(
      (c) => !c.isPaid && !c.paymentPendingValidation && c.estatus !== 'cancelado'
    );
    const cargosEnValidacion = allCargos.filter(
      (c) => !c.isPaid && c.paymentPendingValidation && c.estatus !== 'cancelado'
    );
    const cargosPagados = allCargos.filter((c) => c.isPaid || c.estatus === 'pagado');

    const mapCargo = (c) => {
      const fechaStr = toSerializable(c.createdAt);
      const fechaDisplay = fechaStr
        ? new Date(fechaStr).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'N/A';
      return {
        id: c.id,
        nombre: c.descripcion || 'Compra en tienda',
        name: c.descripcion || 'Compra en tienda',
        price: Number(c.monto || 0),
        precio: Number(c.monto || 0),
        fecha: fechaDisplay,
        date: fechaDisplay,
        tipoItem: 'venta_pos',
        estatus: c.estatus,
        isPaid: c.isPaid,
        paymentPendingValidation: c.paymentPendingValidation,
        montoReportado: c.totalReportado || 0,
        reportedAmount: c.totalReportado || 0,
        totalValidado: Number(c.totalValidado || 0),
        abonosReportados: c.abonosReportados || [],
        items: c.items || [],
      };
    };

    // ── Fuente 3: paquetes / planes ────────────────────────────────────────
    const planesRaw = paquetesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const planes = planesRaw
      .filter((p) => p.status === 'active' || p.status === 'expired')
      .map(calcularVigenciaPlan);

    // ── Armar listas unificadas ────────────────────────────────────────────
    const pendingPayments = [
      ...clasesPendientes.map(mapClase),
      ...cargosPendientes.map(mapCargo),
    ];
    const pendingValidation = [
      ...clasesEnValidacion.map(mapClase),
      ...cargosEnValidacion.map(mapCargo),
    ];
    const paidHistory = [
      ...clasesPagadas.map(mapClase),
      ...cargosPagados.map(mapCargo),
    ];

    const totalPendiente =
      pendingPayments.reduce((acc, i) => acc + i.price, 0) +
      planes.filter((p) => p.saldoPendiente > 0).reduce((acc, p) => acc + p.saldoPendiente, 0);

    return res.status(200).json({
      ok: true,
      summary: {
        totalPendiente,
        totalPending: totalPendiente,
        countPending: pendingPayments.length,
        countValidation: pendingValidation.length,
        countPaid: paidHistory.length,
        planesActivos: planes.filter((p) => p.statusVigencia === 'activo').length,
        planesPorVencer: planes.filter((p) => p.statusVigencia === 'por_vencer').length,
        planesExpirados: planes.filter((p) => p.statusVigencia === 'expirado').length,
      },
      pendingPayments,
      pendingValidation,
      paidHistory,
      planes,
    });
  } catch (error) {
    console.error('Error en estado-de-cuenta API:', error);
    return res.status(500).json({ error: 'Error al procesar el estado de cuenta' });
  }
}
