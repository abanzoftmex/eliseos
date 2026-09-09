// Core Firebase Admin SDK Adapter
import admin from 'firebase-admin';

let adminApp;

function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (projectId && clientEmail && privateKey) {
    try {
      return admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (err) {
      console.error('Error initializing Firebase Admin SDK with cert:', err);
    }
  }

  try {
    return admin.initializeApp();
  } catch (err) {
    console.error('Error fallback initializing Firebase Admin SDK:', err);
  }

  return admin;
}

adminApp = getFirebaseAdmin();
const adminDb = admin.apps.length ? admin.firestore() : null;
const adminAuth = admin.apps.length ? admin.auth() : null;

export { admin, adminDb, adminAuth };
export default adminApp;
