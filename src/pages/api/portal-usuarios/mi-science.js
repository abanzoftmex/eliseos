import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { getSessionFromRequest } from '../../../../lib/portalAuth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return res.status(401).json({ error: 'Sesión no válida' });
    }

    // Obtener sucursales del usuario
    const clienteRef = doc(db, 'clientes', session.userId);
    const clienteSnap = await getDoc(clienteRef);
    let userData = null;

    if (clienteSnap.exists()) {
      userData = clienteSnap.data();
    } else {
      const atletaSnap = await getDoc(doc(db, 'atletas', session.userId));
      if (atletaSnap.exists()) userData = atletaSnap.data();
    }

    if (!userData) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const sucursalIds = Array.isArray(userData.sucursales)
      ? userData.sucursales
      : userData.sucursal
        ? [userData.sucursal]
        : [];

    // Obtener todas las clases activas (no canceladas)
    let clases = [];
    try {
      const snap = await getDocs(
        query(collection(db, 'clases'), where('status', '!=', 'cancelada'))
      );
      clases = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch {
      const snap = await getDocs(collection(db, 'clases'));
      clases = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(c => c.status !== 'cancelada');
    }

    // Filtrar: 
    // 1. Clases grupales (maxParticipantes > 1) de sus sucursales
    // 2. O clases agendadas específicamente para este usuario (clienteAsignado == session.userId)
    const clasesFiltradas = clases.filter(c => {
      const isMySpecificClass = c.clienteAsignado === session.userId;
      const isGroupClass = (c.maxParticipantes ?? 0) > 1;
      
      if (isMySpecificClass) return true;
      if (isGroupClass) {
        if (sucursalIds.length > 0 && !sucursalIds.includes(c.sucursal)) return false;
        return true;
      }
      return false;
    });

    // Resolver nombres de sucursales
    const sucursalMap = {};
    const idsParaResolver = [...new Set(clasesFiltradas.map(c => c.sucursal).filter(Boolean))];

    await Promise.all(
      idsParaResolver.map(async (id) => {
        const snap = await getDoc(doc(db, 'sucursales', String(id)));
        sucursalMap[id] = snap.exists() ? snap.data().name : id;
      })
    );

    // Agrupar por sucursal
    const grouped = {};
    for (const clase of clasesFiltradas) {
      const sId = clase.sucursal || 'general';
      if (!grouped[sId]) {
        grouped[sId] = {
          id: sId,
          name: sId === 'general' ? 'Mis Sesiones Agendadas' : (sucursalMap[sId] || sId),
          clases: [],
        };
      }
      // Limpiar campos innecesarios / serializar timestamps
      grouped[sId].clases.push({
        id: clase.id,
        nombre: clase.nombre || '',
        descripcion: clase.descripcion || '',
        tipo: clase.tipo || 'grupal',
        instructor: clase.instructor || '',
        ubicacion: clase.ubicacion || '',
        sucursal: clase.sucursal || '',
        maxParticipantes: clase.maxParticipantes ?? null,
        participantesActuales: clase.participantesActuales ?? 0,
        duracion: clase.duracion ?? 60,
        precio: clase.precio ?? 0,
        modoProgramacion: clase.modoProgramacion || 'recurrente',
        diasSemana: clase.diasSemana || [],
        horaInicio: clase.horaInicio || '',
        fechaEspecifica: clase.fechaEspecifica || null,
        horaEspecifica: clase.horaEspecifica || null,
        fechasEspecificas: clase.fechasEspecificas || [],
        imageUrl: clase.imageUrl || null,
      });
    }

    // Ordenar clases por nombre dentro de cada sucursal
    for (const g of Object.values(grouped)) {
      g.clases.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    return res.status(200).json({
      ok: true,
      sucursales: Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name)),
    });
  } catch (error) {
    console.error('Error en mi-science:', error);
    return res.status(500).json({ error: 'Error al cargar las clases' });
  }
}
