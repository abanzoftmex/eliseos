import { db } from '../../../../lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { getSessionFromRequest } from '../../../../lib/portalAuth';
import { reportCargoPago } from '../../../../lib/firebase/cargosService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return res.status(401).json({ error: 'Sesión no válida' });
    }

    const { cargoId, monto, evidenciaUrl, notas } = req.body;

    if (!cargoId || !monto || !evidenciaUrl) {
      return res.status(400).json({ error: 'cargoId, monto y evidenciaUrl son obligatorios' });
    }

    // Determinar tipo de usuario
    let userType = 'cliente';
    const clienteSnap = await getDoc(doc(db, 'clientes', session.userId));
    if (!clienteSnap.exists()) {
      const atletaSnap = await getDoc(doc(db, 'atletas', session.userId));
      if (atletaSnap.exists()) userType = 'atleta';
    }

    // Verificar que el cargo le pertenece al usuario autenticado
    const userCollection = userType === 'cliente' ? 'clientes' : 'atletas';
    const cargoRef = doc(db, userCollection, session.userId, 'cargos', cargoId);
    const cargoSnap = await getDoc(cargoRef);

    if (!cargoSnap.exists()) {
      return res.status(404).json({ error: 'No se encontró el cargo para este usuario' });
    }

    const result = await reportCargoPago(session.userId, userType, cargoId, {
      monto: Number(monto),
      evidenciaUrl,
      notas: notas || 'Abono reportado desde portal',
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Error al registrar el abono' });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('API Error [reportar-cargo-pago]:', error);
    return res.status(500).json({ error: error.message || 'Error interno' });
  }
}
