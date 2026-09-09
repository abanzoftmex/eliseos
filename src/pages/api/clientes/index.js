import { db } from '../../../../lib/firebase';
import { addDoc, collection, getDocs, query, where, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { syncClienteToScienceChago } from '../../../lib/scienceChago';

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const clientData = {
        ...req.body,
        tipo: req.body?.tipo || 'cliente',
        status: req.body?.status || 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'clientes'), clientData);

      let syncWarning = null;

      try {
        const syncResult = await syncClienteToScienceChago({ id: docRef.id, ...clientData });

        if (!syncResult?.success) {
          syncWarning = syncResult?.error || 'No se pudo sincronizar con Science Chago';
        }
      } catch (syncError) {
        console.error('Error syncing new cliente to Science Chago:', syncError);
        syncWarning = syncError.message;
      }

      return res.status(201).json({
        success: true,
        id: docRef.id,
        message: 'Cliente creado exitosamente',
        warning: syncWarning
      });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    const { search = '', page = '1', pageSize = '12', sucursal = '', tipo = '', sortBy = 'nombre', simple = 'false' } = req.query;
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);

    // MODO SIMPLE: Retornar lista completa ligera (ideal para selectores/buscadores)
    if (simple === 'true') {
      try {
        const clientesRef = collection(db, 'clientes');
        // No usar orderBy para evitar problemas con índices de Firestore
        const q = query(clientesRef);
        const querySnapshot = await getDocs(q);

        let clientes = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            nombre: data.nombre,
            apellidoPaterno: data.apellidoPaterno,
            apellidoMaterno: data.apellidoMaterno,
            email: data.email,
            telefono: data.telefonoContacto || data.telefono || '',
            sucursales: data.sucursales || [],
            esAtleta: data.esAtleta,
            deporte: data.deporte
          };
        });

        // Ordenar en memoria por nombre
        clientes.sort((a, b) => {
          const nombreA = (a.nombre || '').toLowerCase();
          const nombreB = (b.nombre || '').toLowerCase();
          return nombreA.localeCompare(nombreB);
        });

        console.log(`📊 Total clientes en modo simple: ${clientes.length}`);

        return res.status(200).json({
          success: true,
          data: clientes,
          count: clientes.length
        });
      } catch (error) {
        console.error('Error en modo simple:', error);
        return res.status(500).json({ success: false, error: error.message });
      }
    }

    // Obtener todos los clientes para contar y filtrar (MODO NORMAL)
    const clientesRef = collection(db, 'clientes');
    let clientesQuery = query(clientesRef, orderBy('nombre', 'asc'));

    const clientesSnapshot = await getDocs(clientesQuery);
    let clientesData = clientesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Obtener la última consulta (completada o draft) para cada cliente
    const consultasRef = collection(db, 'consultas');
    const clientesConConsultas = await Promise.all(
      clientesData.map(async (cliente) => {
        try {
          // Buscar la última consulta (completada o draft) del cliente
          const consultaQuery = query(
            consultasRef,
            where('clienteId', '==', cliente.id),
            orderBy('updatedAt', 'desc'),
            firestoreLimit(1)
          );

          const consultaSnapshot = await getDocs(consultaQuery);

          if (!consultaSnapshot.empty) {
            const consultaData = consultaSnapshot.docs[0].data();
            const answers = consultaData.answers || {};
            const diagnostico = answers.diagnosticoFisioterapeutico || answers.diagnosticoMedico || answers.diagnosticoMedicoEspecialista || '';
            const objetivo = answers.objetivoPaciente || answers.objetivoPersonal || '';
            const numeroExpediente = answers.numeroExpediente || '';

            const status = consultaData.status || 'completed'; // Default to 'completed' if status is missing

            console.log(`${status === 'completed' ? '✅' : '🔍'} Consulta encontrada para cliente:`, cliente.id);
            console.log('📋 Status:', status);
            console.log('📋 Número de expediente:', numeroExpediente || 'Sin número');

            // Siempre agregar ultimaConsulta si existe una consulta completada
            return {
              ...cliente,
              numeroExpediente, // Add at root level for easier access
              ultimaConsulta: {
                diagnostico,
                objetivo,
                numeroExpediente,
                tipo: consultaData.type || 'normal',
                status: status
              }
            };
          }

          console.log('⚠️ No se encontró consulta con datos para cliente:', cliente.id);
          return cliente;
        } catch (error) {
          console.error(`Error fetching consulta for cliente ${cliente.id}:`, error);
          return cliente;
        }
      })
    );

    // Aplicar filtros en el servidor
    let resultData = clientesConConsultas;

    // Filtro por búsqueda
    if (search.trim()) {
      const normalize = (text) =>
        (text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

      const searchNorm = normalize(search.trim());
      // Dividir en palabras para buscar cada una de forma independiente en el nombre
      const searchWords = searchNorm.split(/\s+/).filter(Boolean);

      resultData = resultData.filter(cliente => {
        const nombreCompleto = normalize(`${cliente.nombre || ''} ${cliente.apellidoPaterno || ''} ${cliente.apellidoMaterno || ''}`);
        const email = normalize(cliente.email);
        const ocupacion = normalize(cliente.ocupacion);
        const numeroExpediente = normalize(cliente.numeroExpediente);
        const tipoUsuario = cliente.esAtleta || cliente.deporte ? 'atleta' : 'cliente';

        // Para el nombre: todas las palabras buscadas deben aparecer en cualquier parte del nombre completo
        const allWordsInName = searchWords.every(word => nombreCompleto.includes(word));

        return allWordsInName ||
          email.includes(searchNorm) ||
          ocupacion.includes(searchNorm) ||
          numeroExpediente.includes(searchNorm) ||
          tipoUsuario.includes(searchNorm);
      });
    }

    // Filtro por sucursal
    if (sucursal && sucursal !== 'todas') {
      resultData = resultData.filter(cliente => {
        const sucursalesArray = Array.isArray(cliente.sucursales)
          ? cliente.sucursales
          : (cliente.sucursal ? [cliente.sucursal] : []);

        if (sucursal === 'sin-sucursal') {
          return sucursalesArray.length === 0;
        }

        return sucursalesArray.includes(sucursal);
      });
    }

    // Filtro por tipo de cliente
    if (tipo && tipo !== 'todos') {
      resultData = resultData.filter(cliente => {
        const isAtleta = cliente.esAtleta || cliente.deporte;
        return tipo === 'atleta' ? isAtleta : !isAtleta;
      });
    }

    // Filtro por clientes con consultas (pacientes/atletas)
    const { hasConsulta } = req.query;
    if (hasConsulta === 'true') {
      resultData = resultData.filter(cliente => {
        // Un cliente es paciente/atleta si tiene al menos una consulta completada
        return cliente.ultimaConsulta !== undefined;
      });
    } else if (hasConsulta === 'false') {
      resultData = resultData.filter(cliente => {
        // Un cliente puro es aquel que NO tiene consultas
        return cliente.ultimaConsulta === undefined;
      });
    }

    // Ordenamiento
    if (sortBy === 'numeroExpediente') {
      resultData.sort((a, b) => {
        const numA = a.numeroExpediente || '';
        const numB = b.numeroExpediente || '';

        // Clientes sin número de expediente van al final
        if (!numA && !numB) return 0;
        if (!numA) return 1;
        if (!numB) return -1;

        // Ordenar numéricamente si ambos son números, alfabéticamente si no
        const isNumA = !isNaN(numA);
        const isNumB = !isNaN(numB);

        if (isNumA && isNumB) {
          return parseInt(numB) - parseInt(numA); // Descendente: más alto primero
        }

        return numB.toString().localeCompare(numA.toString()); // Descendente alfabético
      });
    } else {
      // Ordenamiento por nombre (default)
      resultData.sort((a, b) => {
        const nombreA = `${a.nombre || ''} ${a.apellidoPaterno || ''}`.toLowerCase();
        const nombreB = `${b.nombre || ''} ${b.apellidoPaterno || ''}`.toLowerCase();
        return nombreA.localeCompare(nombreB);
      });
    }

    // Calcular totales
    const totalCount = resultData.length;
    const totalPages = Math.ceil(totalCount / pageSizeNum);

    // Aplicar paginación
    const startIndex = (pageNum - 1) * pageSizeNum;
    const endIndex = startIndex + pageSizeNum;
    const paginatedData = resultData.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: paginatedData,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        totalItems: totalCount,
        totalPages: totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Error fetching clientes:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener clientes',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
