import { getSessionFromRequest } from '../../../../../lib/portalAuth';
import { db } from '../../../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

function toISO(ts) {
  if (!ts) return null;
  if (typeof ts === 'string') return ts;
  if (ts?.toDate) return ts.toDate().toISOString();
  if (ts instanceof Date) return ts.toISOString();
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return res.status(401).json({ error: 'Sesión no válida' });
    }

    const { id, tipo } = req.query;
    if (!id) return res.status(400).json({ error: 'ID requerido' });

    const collection = tipo === 'rapida' ? 'consultasRapidas' : 'consultas';
    const docRef = doc(db, collection, id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    const data = snap.data();

    // Verificar que pertenece al usuario en sesión
    if (data.clienteId !== session.userId) {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }

    const record = {
      id: snap.id,
      tipo: tipo || (data.type === 'atleta' ? 'deportiva' : 'medica'),
      createdAt: toISO(data.createdAt),
      updatedAt: toISO(data.updatedAt),
      status: data.status || null,
    };

    if (tipo === 'rapida') {
      // Para consultasRapidas los campos están directamente en el doc
      Object.assign(record, {
        fechaEvaluacion: data.fechaEvaluacion || null,
        numeroExpediente: data.numeroExpediente || null,
        datosPersonales: data.datosPersonales || null,
        motivoConsulta: data.motivoConsulta || null,
        tipoPadecimiento: data.tipoPadecimiento || null,
        descripcion: data.descripcion || null,
        antecedentes: data.antecedentes || null,
        exploracionFisica: data.exploracionFisica || null,
        diagnosticoMedico: data.diagnosticoMedico || null,
      });
    } else {
      // Para consultas normales y atletas los datos están en answers
      record.answers = data.answers || {};
    }

    return res.status(200).json({ record });
  } catch (error) {
    console.error('Error en clinica/[id]:', error);
    return res.status(500).json({ error: 'Error interno al cargar el registro' });
  }
}
