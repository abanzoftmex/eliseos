import { db } from '../../../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export default async function handler(req, res) {
  // Solo permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Si existen credenciales de Admin SDK, intentar usarlas
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
        const adminDb = admin.firestore();
        const usersSnapshot = await adminDb.collection('users')
          .orderBy('fechaCreacion', 'desc')
          .get();

        const usuarios = [];
        usersSnapshot.forEach(doc => {
          usuarios.push({
            id: doc.id,
            ...doc.data()
          });
        });

        return res.status(200).json({
          success: true,
          usuarios,
          total: usuarios.length
        });
      } catch (adminError) {
        console.warn('Admin SDK failed in obtener-usuarios, falling back to Web SDK:', adminError);
      }
    }

    // Modo Web SDK estándar
    const usersRef = collection(db, 'users');
    let q;
    try {
      q = query(usersRef, orderBy('fechaCreacion', 'desc'));
    } catch {
      q = query(usersRef);
    }
    const querySnapshot = await getDocs(q);

    const usuarios = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.status(200).json({
      success: true,
      usuarios,
      total: usuarios.length
    });

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return res.status(500).json({ 
      error: 'Error al obtener usuarios',
      details: error.message 
    });
  }
}
