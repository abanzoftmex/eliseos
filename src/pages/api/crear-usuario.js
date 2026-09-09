import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getSecondaryFirebaseApp() {
  const appName = 'user-creator-app';
  const existingApp = getApps().find((app) => app.name === appName);
  if (existingApp) {
    return existingApp;
  }
  return initializeApp(firebaseConfig, appName);
}

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { nombre, email, password, rol } = req.body;

    // Validar campos requeridos
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos: nombre, email, password, rol' 
      });
    }

    // Validar rol válido
    const rolesValidos = ['admin', 'coach', 'staff', 'medico', 'personal', 'asistente', 'invitado'];
    if (!rolesValidos.includes(rol)) {
      return res.status(400).json({ 
        error: `Rol inválido. Los roles válidos son: ${rolesValidos.join(', ')}` 
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    // Comprobar si existen credenciales completas de Firebase Admin
    if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
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
      const adminAuth = admin.auth();
      const adminDb = admin.firestore();

      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: nombre,
        emailVerified: false,
      });

      const financialRole = rol === 'admin' ? 'administrativo' : (['coach', 'staff', 'medico'].includes(rol) ? 'operativo' : 'personal');
      const isSuperAdmin = rol === 'admin';

      const userData = {
        uid: userRecord.uid,
        nombre,
        email,
        rol,
        role: financialRole,
        sistema: 'eliseos_core',
        sistemas: isSuperAdmin ? ['eliseos_core', 'eliseos_financiero'] : ['eliseos_core'],
        fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
        activo: true,
        creadoPor: req.body.adminEmail || 'admin',
      };

      await adminDb.collection('users').doc(userRecord.uid).set(userData);

      return res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        usuario: {
          uid: userRecord.uid,
          nombre,
          email,
          rol,
        },
      });
    }

    // Modo cliente secundario seguro (no requiere service account JSON)
    const secondaryApp = getSecondaryFirebaseApp();
    const secondaryAuth = getAuth(secondaryApp);
    const secondaryDb = getFirestore(secondaryApp);

    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const createdUser = userCredential.user;

    await updateProfile(createdUser, { displayName: nombre });

    const financialRole = rol === 'admin' ? 'administrativo' : (['coach', 'staff', 'medico'].includes(rol) ? 'operativo' : 'personal');
    const isSuperAdmin = rol === 'admin';

    const userData = {
      uid: createdUser.uid,
      nombre,
      email,
      rol,
      role: financialRole,
      sistema: 'eliseos_core',
      sistemas: isSuperAdmin ? ['eliseos_core', 'eliseos_financiero'] : ['eliseos_core'],
      fechaCreacion: new Date().toISOString(),
      activo: true,
      creadoPor: req.body.adminEmail || 'admin',
    };

    await setDoc(doc(secondaryDb, 'users', createdUser.uid), userData);

    // Cerrar sesión en la instancia secundaria para mantener aislamiento
    await signOut(secondaryAuth);

    return res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      usuario: {
        uid: createdUser.uid,
        nombre,
        email,
        rol,
      },
    });

  } catch (error) {
    console.error('Error al crear usuario:', error);

    // Manejar errores específicos de Firebase
    if (error.code === 'auth/email-already-in-use' || error.code === 'auth/email-already-exists') {
      // Comprobar si el usuario existe en Firestore
      try {
        const secondaryApp = getSecondaryFirebaseApp();
        const secondaryDb = getFirestore(secondaryApp);
        const { getDocs, query, collection, where } = await import('firebase/firestore');
        const usersSnap = await getDocs(query(collection(secondaryDb, 'users'), where('email', '==', email)));

        if (usersSnap.empty) {
          // El usuario existe en Auth pero quedó huérfano en Firestore (se eliminó previamente)
          try {
            const secondaryAuth = getAuth(secondaryApp);
            const cred = await signInWithEmailAndPassword(secondaryAuth, email, password);
            const user = cred.user;
            await updateProfile(user, { displayName: nombre });

            const financialRole = rol === 'admin' ? 'administrativo' : (['coach', 'staff', 'medico'].includes(rol) ? 'operativo' : 'personal');
            const isSuperAdmin = rol === 'admin';

            const userData = {
              uid: user.uid,
              nombre,
              email,
              rol,
              role: financialRole,
              sistema: 'eliseos_core',
              sistemas: isSuperAdmin ? ['eliseos_core', 'eliseos_financiero'] : ['eliseos_core'],
              fechaCreacion: new Date().toISOString(),
              activo: true,
              creadoPor: req.body.adminEmail || 'admin',
            };

            await setDoc(doc(secondaryDb, 'users', user.uid), userData);
            await signOut(secondaryAuth);

            return res.status(201).json({
              success: true,
              message: 'Usuario reactivado y registrado exitosamente',
              usuario: {
                uid: user.uid,
                nombre,
                email,
                rol,
              },
            });
          } catch (loginErr) {
            console.warn('Usuario huérfano con contraseña diferente:', loginErr.message);
          }
        }
      } catch (checkErr) {
        console.warn('Error al verificar usuario huérfano:', checkErr);
      }

      return res.status(409).json({ 
        error: 'Ya existe un usuario con este email' 
      });
    }

    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ 
        error: 'El formato del email es inválido' 
      });
    }

    if (error.code === 'auth/weak-password' || error.code === 'auth/invalid-password') {
      return res.status(400).json({ 
        error: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    return res.status(500).json({ 
      error: error.message || 'Error interno del servidor al crear usuario' 
    });
  }
}
