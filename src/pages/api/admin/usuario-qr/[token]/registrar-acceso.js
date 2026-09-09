import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../../../lib/firebase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Verificar auth admin
  const authToken = req.cookies['auth-token'];
  const authRole  = req.cookies['auth-role'];
  if (!authToken || !authRole) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { token } = req.query;
  const { registradoPor = 'Administrador', sucursal = null, sucursalNombre = null } = req.body || {};

  if (!token) return res.status(400).json({ error: 'Token requerido' });

  try {
    // Resolver userId y nombre desde el qrToken
    const [clientesSnap, atletasSnap] = await Promise.all([
      getDocs(query(collection(db, 'clientes'), where('qrToken', '==', token))),
      getDocs(query(collection(db, 'atletas'),  where('qrToken', '==', token))),
    ]);

    let userId = null, userType = null, userName = null;

    if (!clientesSnap.empty) {
      const d = clientesSnap.docs[0];
      userId   = d.id;
      userType = 'cliente';
      const ud = d.data();
      userName = `${ud.nombre || ''} ${ud.apellidoPaterno || ''} ${ud.apellidoMaterno || ''}`.trim();
    } else if (!atletasSnap.empty) {
      const d = atletasSnap.docs[0];
      userId   = d.id;
      userType = 'atleta';
      const ud = d.data();
      userName = `${ud.nombre || ''} ${ud.apellidoPaterno || ''} ${ud.apellidoMaterno || ''}`.trim();
    }

    if (!userId) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const acceso = await addDoc(collection(db, 'accesos'), {
      userId,
      userType,
      userName,
      qrToken:           token,
      registradoPor,
      registradoPorRole: authRole,
      sucursal:          sucursal     || null,
      sucursalNombre:    sucursalNombre || null,
      timestamp:         serverTimestamp(),
    });

    return res.status(201).json({ ok: true, accesoId: acceso.id });
  } catch (error) {
    console.error('Error registrando acceso:', error);
    return res.status(500).json({ error: 'Error al registrar acceso' });
  }
}
