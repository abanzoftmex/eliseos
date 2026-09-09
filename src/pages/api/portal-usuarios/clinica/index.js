import { getSessionFromRequest } from '../../../../../lib/portalAuth';
import { db } from '../../../../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

function toISO(ts) {
  if (!ts) return null;
  if (typeof ts === 'string') return ts;
  if (ts?.toDate) return ts.toDate().toISOString();
  if (ts instanceof Date) return ts.toISOString();
  return null;
}

function sortByDate(a, b) {
  return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
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

    const userId = session.userId;

    // Consultas (fichas médicas y deportivas)
    const consultasSnap = await getDocs(
      query(collection(db, 'consultas'), where('clienteId', '==', userId))
    );

    const fichasMedicas = [];
    const fichasDeportivas = [];

    consultasSnap.forEach((docSnap) => {
      const d = docSnap.data();
      const answers = d.answers || {};
      const base = {
        id: docSnap.id,
        createdAt: toISO(d.createdAt),
        updatedAt: toISO(d.updatedAt),
        status: d.status || null,
      };

      if (d.type === 'normal') {
        fichasMedicas.push({
          ...base,
          fechaEvaluacion: answers.fechaEvaluacion || null,
          numeroExpediente: answers.numeroExpediente || null,
          diagnosticoMedico: answers.diagnosticoMedico || null,
          recopilacionHechos: answers.recopilacionHechos || null,
          tipoPadecimiento: answers.tipoPadecimiento || null,
          descripcionPadecimiento: answers.descripcionPadecimiento || null,
          antecedentesHeredofamiliares: answers.antecedentesHeredofamiliares || null,
        });
      } else if (d.type === 'atleta') {
        fichasDeportivas.push({
          ...base,
          fechaEvaluacion: answers.fechaEvaluacion || null,
          numeroExpediente: answers.numeroExpediente || null,
          objetivoPersonal: answers.objetivoPersonal || null,
          altura: answers.altura || null,
          peso: answers.peso || null,
          imc: answers.imc || null,
          grasaCorporal: answers.grasaCorporal || null,
          musculoEsqueletico: answers.musculoEsqueletico || null,
          dolorMolestiaActual: answers.dolorMolestiaActual || null,
          alimentacion: answers.alimentacion || null,
          hidratacion: answers.hidratacion || null,
        });
      }
    });

    fichasMedicas.sort(sortByDate);
    fichasDeportivas.sort(sortByDate);

    // Consultas rápidas
    const rapidasSnap = await getDocs(
      query(collection(db, 'consultasRapidas'), where('clienteId', '==', userId))
    );

    const consultasRapidas = [];
    rapidasSnap.forEach((docSnap) => {
      const d = docSnap.data();
      consultasRapidas.push({
        id: docSnap.id,
        createdAt: toISO(d.createdAt),
        updatedAt: toISO(d.updatedAt),
        fechaEvaluacion: d.fechaEvaluacion || null,
        numeroExpediente: d.numeroExpediente || null,
        motivoConsulta: d.motivoConsulta || null,
        tipoPadecimiento: d.tipoPadecimiento || null,
        descripcion: d.descripcion || null,
        antecedentes: d.antecedentes || null,
        exploracionFisica: d.exploracionFisica || null,
        diagnosticoMedico: d.diagnosticoMedico || null,
      });
    });

    consultasRapidas.sort(sortByDate);

    // Notas Clínicas (ELISEOS Mi Salud)
    const notasClinicas = [];
    try {
      const [clienteNotasSnap, atletaNotasSnap] = await Promise.all([
        getDocs(collection(db, 'clientes', userId, 'notasClinicas')).catch(() => ({ docs: [] })),
        getDocs(collection(db, 'atletas', userId, 'notasClinicas')).catch(() => ({ docs: [] }))
      ]);

      const processNota = (docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          fecha: toISO(d.fecha),
          hora: d.hora || null,
          numeroSesion: d.numeroSesion || null,
          subjetivo: d.subjetivo || '',
          objetivo: d.objetivo || '',
          evaluacion: d.evaluacion || '',
          planTerapeutico: d.planTerapeutico || '',
          createdAt: toISO(d.createdAt),
          updatedAt: toISO(d.updatedAt)
        };
      };

      clienteNotasSnap.docs?.forEach(doc => notasClinicas.push(processNota(doc)));
      atletaNotasSnap.docs?.forEach(doc => notasClinicas.push(processNota(doc)));
      notasClinicas.sort((a, b) => new Date(b.fecha || b.createdAt || 0) - new Date(a.fecha || a.createdAt || 0));
    } catch (nErr) {
      console.error('Error fetching notasClinicas:', nErr);
    }

    return res.status(200).json({ notasClinicas, fichasMedicas, fichasDeportivas, consultasRapidas });
  } catch (error) {
    console.error('Error en clinica portal:', error);
    return res.status(500).json({ error: 'Error interno al cargar historial clínico' });
  }
}
