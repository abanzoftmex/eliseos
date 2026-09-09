import { db } from '../../firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  arrayUnion 
} from 'firebase/firestore';
import { PaymentEvidence } from './entity';

/**
 * Payment Application Service
 */
export const PaymentService = {
  /**
   * Use Case: Report a payment (or abono) for a specific activity
   */
  async reportActivityPayment(userId, userType, paymentData) {
    const evidence = new PaymentEvidence(paymentData);
    
    if (!evidence.isValid()) {
      throw new Error('Información de pago inválida');
    }

    const userCollection = userType === 'cliente' ? 'clientes' : 'atletas';
    const assignmentRef = doc(db, userCollection, userId, 'clasesAsignadas', evidence.activityId);

    // Verify activity exists
    const assignmentSnap = await getDoc(assignmentRef);
    if (!assignmentSnap.exists()) {
      throw new Error(`La actividad con ID ${evidence.activityId} no existe para este usuario.`);
    }

    const assignmentData = assignmentSnap.data();
    
    // Create the payment object for the history
    const nuevoAbono = {
      id: Date.now().toString(),
      monto: evidence.amount,
      evidenciaUrl: evidence.evidenceUrl,
      notas: evidence.notes || 'Abono reportado desde portal',
      fechaReporte: new Date().toISOString(),
      estado: 'pendiente' // pendiente, validado, rechazado
    };

    // Update the document
    await updateDoc(assignmentRef, {
      // Marcamos que hay validación pendiente
      paymentPendingValidation: true,
      
      // Mantenemos compatibilidad con campos anteriores (último abono)
      paymentAmountReported: evidence.amount,
      paymentEvidenceUrl: evidence.evidenceUrl,
      paymentNotes: evidence.notes,
      paymentReportedAt: serverTimestamp(),
      
      // Agregamos al historial de abonos
      abonosReportados: arrayUnion(nuevoAbono),
      
      // Sumamos al total reportado históricamente en este documento
      totalReportado: (assignmentData.totalReportado || 0) + evidence.amount,
      
      updatedAt: serverTimestamp()
    });

    return { 
      success: true, 
      message: 'Abono registrado correctamente',
      totalReportado: (assignmentData.totalReportado || 0) + evidence.amount 
    };
  },

  /**
   * Use Case: Validate an abono reported by a user
   */
  async validateAbono(userId, userType, assignmentId, abonoId) {
    const userCollection = userType === 'cliente' ? 'clientes' : 'atletas';
    const assignmentRef = doc(db, userCollection, userId, 'clasesAsignadas', assignmentId);
    
    const snap = await getDoc(assignmentRef);
    if (!snap.exists()) throw new Error('Actividad no encontrada');
    
    const data = snap.data();
    const abonos = data.abonosReportados || [];
    
    let totalValidado = data.totalValidado || 0;
    const nuevosAbonos = abonos.map(a => {
      if (a.id === abonoId && a.estado === 'pendiente') {
        totalValidado += a.monto;
        return { ...a, estado: 'validado', fechaValidacion: new Date().toISOString() };
      }
      return a;
    });

    // Check if fully paid. El precio puede no estar en la asignación; si falta, lo
    // tomamos de la clase. Si aun así no hay precio, NO marcamos pagado (evita
    // marcar isPaid=true con un cargo de $0).
    let precio = Number(data.precio || data.price || 0);
    if (precio <= 0 && data.idClase) {
      const cDoc = await getDoc(doc(db, 'clases', data.idClase));
      if (cDoc.exists()) precio = Number(cDoc.data().precio || 0);
    }
    const isPaid = precio > 0 ? totalValidado >= precio : false;

    await updateDoc(assignmentRef, {
      abonosReportados: nuevosAbonos,
      totalValidado,
      isPaid,
      paymentPendingValidation: nuevosAbonos.some(a => a.estado === 'pendiente'),
      updatedAt: serverTimestamp()
    });

    return { success: true, isPaid, totalValidado };
  },

  /**
   * Use Case: Reject an abono
   */
  async rejectAbono(userId, userType, assignmentId, abonoId, reason = '') {
    const userCollection = userType === 'cliente' ? 'clientes' : 'atletas';
    const assignmentRef = doc(db, userCollection, userId, 'clasesAsignadas', assignmentId);
    
    const snap = await getDoc(assignmentRef);
    if (!snap.exists()) throw new Error('Actividad no encontrada');
    
    const data = snap.data();
    const abonos = data.abonosReportados || [];
    
    const nuevosAbonos = abonos.map(a => {
      if (a.id === abonoId) {
        return { ...a, estado: 'rechazado', motivoRechazo: reason, fechaRechazo: new Date().toISOString() };
      }
      return a;
    });

    await updateDoc(assignmentRef, {
      abonosReportados: nuevosAbonos,
      paymentPendingValidation: nuevosAbonos.some(a => a.estado === 'pendiente'),
      updatedAt: serverTimestamp()
    });

    return { success: true };
  }
};
