// src/pages/api/admin/pasaporte/[userId]/index.js
import { getOrCreatePassport, calculateMonthlyAttendanceCandidate } from '@/lib/firebase/passportService';
import { getUserType } from '@/lib/firebase/packagesService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PASSPORT_DEFAULT_YEAR, PASSPORT_MONTHS } from '@/lib/domain/passportConstants';

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

  const { userId, year = PASSPORT_DEFAULT_YEAR } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'ID de usuario requerido' });
  }

  try {
    const userType = await getUserType(userId);
    let userData = null;
    let userName = 'Atleta';
    let userFoto = null;

    if (userType) {
      const uSnap = await getDoc(doc(db, userType === 'cliente' ? 'clientes' : 'atletas', userId));
      if (uSnap.exists()) {
        userData = uSnap.data();
        userName = `${userData.nombre || ''} ${userData.apellidoPaterno || ''} ${userData.apellidoMaterno || ''}`.trim() || userData.nombre;
        userFoto = userData.foto || null;
      }
    }

    const passportData = await getOrCreatePassport(userId, Number(year), {
      userType: userType || 'cliente',
      userName,
      foto: userFoto
    });

    // Calcular candidatos de asistencia para el mes actual y verificar si ya fue sellado
    const currentMonthNum = new Date().getMonth() + 1;
    const currentMonthObj = PASSPORT_MONTHS.find(m => m.numero === currentMonthNum);
    const currentMonthData = passportData.meses?.find(m => m.id === currentMonthObj?.id);
    const asistenciaYaOtorgada = Boolean(currentMonthData?.sellos?.asistencia?.obtenido);

    const asistenciaActual = await calculateMonthlyAttendanceCandidate(userId, Number(year), currentMonthNum);
    asistenciaActual.yaOtorgado = asistenciaYaOtorgada;

    return res.status(200).json({
      success: true,
      user: {
        id: userId,
        name: userName,
        type: userType,
        foto: userFoto,
        email: userData?.email || null,
        telefono: userData?.telefono || userData?.telefonoContacto || null
      },
      sugerencias: {
        mesActual: currentMonthNum,
        asistencia: asistenciaActual
      },
      ...passportData
    });
  } catch (error) {
    console.error('Error al cargar pasaporte admin:', error);
    return res.status(500).json({ error: error.message || 'Error al cargar pasaporte' });
  }
}
