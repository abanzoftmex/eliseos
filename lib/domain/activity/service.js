import { db } from '../../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  getDoc 
} from 'firebase/firestore';
import { recordPackageSession } from '../../firebase/packagesService';

/**
 * Activity Application Service (Hexagonal - Application Layer)
 */
export const ActivityService = {
  /**
   * Use Case: Schedule a session for a specific user
   */
  async scheduleSession(userId, userType, sessionData) {
    try {
      const classRef = doc(collection(db, 'clases'));
      const classId = classRef.id;
      
      const payload = {
        ...sessionData,
        id: classId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'programada',
        participantesActuales: 1, // Auto-assigned
        maxParticipantes: 1,
      };

      // 1. Create the class entity
      await setDoc(classRef, payload);

      // 2. Create the assignment for the user
      const userCollection = userType === 'cliente' ? 'clientes' : 'atletas';
      const assignmentRef = doc(collection(db, userCollection, userId, 'clasesAsignadas'));
      
      const assignmentData = {
        idClase: classId,
        fechaAsignacion: serverTimestamp(),
        fechaAsignacionString: sessionData.fechaEspecifica, // Use string to avoid timezone bugs
        fechaEvaluacion: sessionData.fechaEspecifica,
        estado: 'activa',
        notas: sessionData.notas || '',
        paymentMode: sessionData.paymentMode || 'custom',
        packageId: sessionData.packageId || null,
        precio: sessionData.precio || 0,
        isPaid: sessionData.isPaid || false,
        source: 'manual_admin'
      };

      await setDoc(assignmentRef, assignmentData);

      // 3. Logic: If it's charged to a package, decrement session
      if (sessionData.paymentMode === 'package' && sessionData.packageId) {
        await recordPackageSession(userId, sessionData.packageId, classId, sessionData.fechaEspecifica);
      }

      return { success: true, classId, assignmentId: assignmentRef.id };
    } catch (error) {
      console.error('Domain Error [scheduleSession]:', error);
      throw error;
    }
  }
};
