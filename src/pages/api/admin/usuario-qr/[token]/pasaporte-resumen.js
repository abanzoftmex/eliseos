// src/pages/api/admin/usuario-qr/[token]/pasaporte-resumen.js
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getOrCreatePassport } from '@/lib/firebase/passportService';
import { PASSPORT_DEFAULT_YEAR } from '@/lib/domain/passportConstants';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Verificar auth admin
  const authToken = req.cookies['auth-token'];
  const authRole = req.cookies['auth-role'];
  if (!authToken || !authRole) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { token, year = PASSPORT_DEFAULT_YEAR } = req.query;
  if (!token) return res.status(400).json({ error: 'Token requerido' });

  try {
    const [clientesSnap, atletasSnap] = await Promise.all([
      getDocs(query(collection(db, 'clientes'), where('qrToken', '==', token))),
      getDocs(query(collection(db, 'atletas'), where('qrToken', '==', token)))
    ]);

    let userId = null;
    let userType = null;
    let userName = null;
    let userFoto = null;

    if (!clientesSnap.empty) {
      const d = clientesSnap.docs[0];
      userId = d.id;
      userType = 'cliente';
      const ud = d.data();
      userName = `${ud.nombre || ''} ${ud.apellidoPaterno || ''} ${ud.apellidoMaterno || ''}`.trim() || ud.nombre;
      userFoto = ud.foto || null;
    } else if (!atletasSnap.empty) {
      const d = atletasSnap.docs[0];
      userId = d.id;
      userType = 'atleta';
      const ud = d.data();
      userName = `${ud.nombre || ''} ${ud.apellidoPaterno || ''} ${ud.apellidoMaterno || ''}`.trim() || ud.nombre;
      userFoto = ud.foto || null;
    }

    if (!userId) {
      return res.status(404).json({ error: 'Usuario no encontrado para el código QR' });
    }

    const passportData = await getOrCreatePassport(userId, Number(year), {
      userType,
      userName,
      foto: userFoto
    });

    return res.status(200).json({
      success: true,
      userId,
      userType,
      userName,
      totalSellos: passportData.passport.totalSellos,
      sellosConstancia: passportData.passport.sellosConstancia,
      sellosExperiencia: passportData.passport.sellosExperiencia,
      porcentajeProgreso: passportData.passport.porcentajeProgreso,
      proximaRecompensa: passportData.passport.proximaRecompensa,
      meses: passportData.meses.map(m => ({
        id: m.id,
        nombre: m.nombre,
        sellosObtenidosCount: m.sellosObtenidosCount,
        mesCompleto: m.mesCompleto
      }))
    });
  } catch (error) {
    console.error('Error al obtener resumen de pasaporte por QR:', error);
    return res.status(500).json({ error: error.message || 'Error al obtener resumen' });
  }
}
