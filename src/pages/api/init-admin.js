import admin from 'firebase-admin';

// Inicializar Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Error inicializando Firebase Admin:', error);
  }
}

export default async function handler(req, res) {
  // Solo permitir GET o POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const email = 'admin@eliseos.mx';
    const password = 'Admin123456';
    const nombre = 'Administrador Principal';

    // Verificar si el usuario ya existe
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      
      // Usuario ya existe, verificar si está en Firestore
      const userDoc = await admin.firestore().collection('users').doc(userRecord.uid).get();
      
      if (userDoc.exists()) {
        return res.status(200).json({
          success: true,
          message: 'Usuario admin ya existe',
          usuario: {
            uid: userRecord.uid,
            email: email,
            rol: userDoc.data().rol
          }
        });
      }
      
      // Si existe en Auth pero no en Firestore, agregarlo
      await admin.firestore().collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        nombre,
        email,
        rol: 'admin',
        fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
        activo: true,
      });

      return res.status(200).json({
        success: true,
        message: 'Usuario admin sincronizado con Firestore',
        usuario: {
          uid: userRecord.uid,
          email: email,
          rol: 'admin'
        }
      });

    } catch (error) {
      // Usuario no existe, crearlo
      if (error.code === 'auth/user-not-found') {
        userRecord = await admin.auth().createUser({
          email,
          password,
          displayName: nombre,
          emailVerified: true,
        });

        // Guardar en Firestore
        await admin.firestore().collection('users').doc(userRecord.uid).set({
          uid: userRecord.uid,
          nombre,
          email,
          rol: 'admin',
          fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
          activo: true,
        });

        return res.status(201).json({
          success: true,
          message: 'Usuario admin creado exitosamente',
          usuario: {
            uid: userRecord.uid,
            email: email,
            password: password, // Solo para desarrollo
            rol: 'admin'
          },
          instrucciones: [
            '1. Usa estas credenciales para iniciar sesión:',
            `   Email: ${email}`,
            `   Password: ${password}`,
            '2. Ve a la pantalla de inicio de sesión de la plataforma',
            '3. Inicia sesión con las credenciales',
            '4. IMPORTANTE: Cambia la contraseña después del primer login',
            '5. ELIMINA este archivo /api/init-admin.js por seguridad'
          ]
        });
      }
      
      throw error;
    }

  } catch (error) {
    console.error('Error al inicializar admin:', error);
    return res.status(500).json({ 
      error: 'Error al crear/verificar usuario admin',
      details: error.message 
    });
  }
}
