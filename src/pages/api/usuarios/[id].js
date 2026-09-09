import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID de usuario requerido' });
  }

  // PATCH: Actualizar rol o estado de usuario
  if (req.method === 'PATCH') {
    try {
      const userRef = doc(db, 'users', id);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const updates = {};
      const { rol, activo } = req.body;

      if (rol !== undefined) {
        const rolesValidos = ['admin', 'coach', 'staff', 'medico', 'personal', 'asistente', 'invitado'];
        if (!rolesValidos.includes(rol)) {
          return res.status(400).json({ error: `Rol inválido: ${rol}` });
        }
        updates.rol = rol;
        updates.role = rol === 'admin' ? 'administrativo' : (['coach', 'staff', 'medico'].includes(rol) ? 'operativo' : 'personal');
        updates.sistemas = rol === 'admin' ? ['eliseos_core', 'eliseos_financiero'] : ['eliseos_core'];
      }

      if (activo !== undefined) {
        updates.activo = Boolean(activo);
      }

      updates.actualizadoEl = new Date().toISOString();

      await updateDoc(userRef, updates);

      return res.status(200).json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        updates,
      });
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      return res.status(500).json({ error: error.message || 'Error interno al actualizar usuario' });
    }
  }

  // DELETE: Eliminar usuario de Firestore y Firebase Auth
  if (req.method === 'DELETE') {
    try {
      const userRef = doc(db, 'users', id);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Si existen credenciales de Admin SDK, eliminar de Firebase Auth también
      if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        try {
          const admin = (await import('firebase-admin')).default;
          if (!admin.apps.length) {
            admin.initializeApp({
              credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
              }),
            });
          }
          await admin.auth().deleteUser(id);
          console.log(`Usuario ${id} eliminado de Firebase Auth`);
        } catch (authErr) {
          console.warn('Advertencia al eliminar de Firebase Auth:', authErr.message);
        }
      }

      await deleteDoc(userRef);

      return res.status(200).json({
        success: true,
        message: 'Usuario eliminado exitosamente',
      });
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      return res.status(500).json({ error: error.message || 'Error interno al eliminar usuario' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
