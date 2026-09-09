import { validarCargoAbono } from '../../../../../lib/firebase/cargosService';
import { createIngresoInScienceChago, generateTransactionExternalId } from '../../../../../lib/scienceChago';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../../lib/firebase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { userId, userType, cargoId, abonoId, action, reason } = req.body;

  if (!userId || !userType || !cargoId || !abonoId || !action) {
    return res.status(400).json({ error: 'Faltan campos obligatorios: userId, userType, cargoId, abonoId, action' });
  }

  if (!['validate', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Acción no válida. Usa: validate | reject' });
  }

  try {
    const result = await validarCargoAbono(userId, userType, cargoId, abonoId, action, reason);

    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Error al procesar el abono' });
    }

    // Si el cargo quedó totalmente pagado, sincronizar con Science Chago
    if (action === 'validate' && result.isPaid) {
      try {
        const userCollection = userType === 'atleta' ? 'atletas' : 'clientes';
        const cargoRef = doc(db, userCollection, userId, 'cargos', cargoId);
        const cargoSnap = await getDoc(cargoRef);

        if (cargoSnap.exists()) {
          const cargo = cargoSnap.data();
          const now = new Date();
          const transactionDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

          await createIngresoInScienceChago({
            externalId: generateTransactionExternalId(),
            sucursalId: cargo.sucursalId || '',
            clienteId: userId,
            amount: Number(cargo.monto || 0),
            date: transactionDate,
            concepto: cargo.descripcion || 'Venta POS - Pago diferido',
            description: `Pago confirmado de cargo POS - ${cargo.descripcion || 'Venta tienda'}`,
          });
        }
      } catch (syncError) {
        // No bloquear el flujo principal si Science Chago falla
        console.warn('Science Chago sync error for cargo payment:', syncError.message);
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in admin/cargos/validar-abono:', error);
    return res.status(500).json({ error: error.message || 'Error interno' });
  }
}
