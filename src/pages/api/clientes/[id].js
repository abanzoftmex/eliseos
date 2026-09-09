import { db } from '../../../../lib/firebase';
import { doc, getDoc, deleteDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { syncClienteToScienceChago } from '../../../lib/scienceChago';
import {
  incrementPendingClienteDeletionAttempt,
  markPendingClienteDeletionResult,
  queuePendingClienteDeletion
} from '../../../lib/clientDeletionSync';

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'ID del cliente es requerido'
    });
  }

  try {
    if (req.method === 'GET') {
      // Obtener cliente por ID
      const clienteRef = doc(db, 'clientes', id);
      const clienteDoc = await getDoc(clienteRef);

      if (!clienteDoc.exists()) {
        return res.status(404).json({
          success: false,
          error: 'Cliente no encontrado'
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: clienteDoc.id,
          ...clienteDoc.data()
        }
      });

    } else if (req.method === 'DELETE') {
      // Verificar que el cliente existe
      const clienteRef = doc(db, 'clientes', id);
      const clienteDoc = await getDoc(clienteRef);

      if (!clienteDoc.exists()) {
        return res.status(404).json({
          success: false,
          error: 'Cliente no encontrado'
        });
      }

      console.log(`🗑️ Iniciando eliminación en cascada para cliente: ${id}`);

      // ELIMINACIÓN EN CASCADA - Eliminar todos los datos relacionados
      const deletionPromises = [];

      try {
        // 1. Eliminar consultas del cliente
        const consultasRef = collection(db, 'consultas');
        const consultasQuery = query(consultasRef, where('clienteId', '==', id));
        const consultasSnapshot = await getDocs(consultasQuery);

        console.log(`📋 Encontradas ${consultasSnapshot.size} consultas para eliminar`);
        consultasSnapshot.forEach(consultaDoc => {
          deletionPromises.push(deleteDoc(consultaDoc.ref));
        });

        // 2. Eliminar consultas normales (drafts)
        const consultasNormalesRef = collection(db, 'consultasNormales');
        const consultasNormalesQuery = query(consultasNormalesRef, where('clienteId', '==', id));
        const consultasNormalesSnapshot = await getDocs(consultasNormalesQuery);

        console.log(`📝 Encontradas ${consultasNormalesSnapshot.size} consultas normales para eliminar`);
        consultasNormalesSnapshot.forEach(consultaDoc => {
          deletionPromises.push(deleteDoc(consultaDoc.ref));
        });

        // 3. Eliminar consultas deportivas (drafts)
        const consultasDeportivasRef = collection(db, 'consultasDeportivas');
        const consultasDeportivasQuery = query(consultasDeportivasRef, where('clienteId', '==', id));
        const consultasDeportivasSnapshot = await getDocs(consultasDeportivasQuery);

        console.log(`🏃‍♂️ Encontradas ${consultasDeportivasSnapshot.size} consultas deportivas para eliminar`);
        consultasDeportivasSnapshot.forEach(consultaDoc => {
          deletionPromises.push(deleteDoc(consultaDoc.ref));
        });

        // 4. Remover cliente de clases donde esté inscrito
        const clasesRef = collection(db, 'clases');
        const clasesQuery = query(clasesRef, where('participantes', 'array-contains', id));
        const clasesSnapshot = await getDocs(clasesQuery);

        console.log(`🎯 Encontradas ${clasesSnapshot.size} clases donde remover al cliente`);
        for (const claseDoc of clasesSnapshot.docs) {
          const claseData = claseDoc.data();
          const participantesActualizados = claseData.participantes.filter(participanteId => participanteId !== id);

          deletionPromises.push(
            updateDoc(claseDoc.ref, {
              participantes: participantesActualizados,
              updatedAt: new Date().toISOString()
            })
          );
        }

        // 5. Eliminar paquetes del cliente
        const paquetesRef = collection(db, 'paquetes');
        const paquetesQuery = query(paquetesRef, where('clienteId', '==', id));
        const paquetesSnapshot = await getDocs(paquetesQuery);

        console.log(`📦 Encontrados ${paquetesSnapshot.size} paquetes para eliminar`);
        paquetesSnapshot.forEach(paqueteDoc => {
          deletionPromises.push(deleteDoc(paqueteDoc.ref));
        });

        // 6. Eliminar citas/agendas del cliente
        const citasRef = collection(db, 'citas');
        const citasQuery = query(citasRef, where('clienteId', '==', id));
        const citasSnapshot = await getDocs(citasQuery);

        console.log(`📅 Encontradas ${citasSnapshot.size} citas para eliminar`);
        citasSnapshot.forEach(citaDoc => {
          deletionPromises.push(deleteDoc(citaDoc.ref));
        });

        // 7. Eliminar historial clínico
        const historialRef = collection(db, 'historialClinico');
        const historialQuery = query(historialRef, where('clienteId', '==', id));
        const historialSnapshot = await getDocs(historialQuery);

        console.log(`🏥 Encontrados ${historialSnapshot.size} registros de historial clínico para eliminar`);
        historialSnapshot.forEach(historialDoc => {
          deletionPromises.push(deleteDoc(historialDoc.ref));
        });

        // Ejecutar todas las eliminaciones en paralelo
        await Promise.all(deletionPromises);
        console.log(`✅ Eliminados ${deletionPromises.length} documentos relacionados`);

        // Finalmente, eliminar el cliente
        await deleteDoc(clienteRef);
        console.log(`✅ Cliente ${id} eliminado exitosamente`);

        const deletedClientePayload = { id, ...clienteDoc.data() };
        await queuePendingClienteDeletion(deletedClientePayload);

        // Sincronizar con Science Chago como desactivacion remota.
        // Science Chago contabiliza estas bajas dentro de "actualizados"
        // porque recibe activo=false sobre el mismo ID.
        let syncWarning = null;

        try {
          const syncResult = await syncClienteToScienceChago(deletedClientePayload, true);

          if (!syncResult?.success) {
            syncWarning = syncResult?.error || 'No se pudo sincronizar la baja con Science Chago';
            console.error('Error syncing deletion to Science Chago:', syncWarning);
            await incrementPendingClienteDeletionAttempt(id, syncWarning);
          } else {
            await markPendingClienteDeletionResult(id, { success: true });
          }
        } catch (syncError) {
          console.error('Error syncing deletion to Science Chago:', syncError);
          syncWarning = syncError.message;
          await incrementPendingClienteDeletionAttempt(id, syncWarning);
        }

        return res.status(200).json({
          success: true,
          message: `Cliente eliminado exitosamente junto con ${deletionPromises.length} registros relacionados`,
          warning: syncWarning
        });

      } catch (cascadeError) {
        console.error('❌ Error durante eliminación en cascada:', cascadeError);
        return res.status(500).json({
          success: false,
          error: `Error durante la eliminación: ${cascadeError.message}`
        });
      }

    } else if (req.method === 'PUT') {
      // Actualizar cliente
      const clienteRef = doc(db, 'clientes', id);
      const clienteDoc = await getDoc(clienteRef);

      if (!clienteDoc.exists()) {
        return res.status(404).json({
          success: false,
          error: 'Cliente no encontrado'
        });
      }

      const updateData = {
        ...req.body,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(clienteRef, updateData);

      // Obtener los datos completos del cliente después de actualizar
      const updatedClienteDoc = await getDoc(clienteRef);
      const clienteDataCompleto = updatedClienteDoc.data();

      // Sincronizar con Science Chago
      let syncWarning = null;

      try {
        const syncResult = await syncClienteToScienceChago({ id, ...clienteDataCompleto });

        if (!syncResult?.success) {
          syncWarning = syncResult?.error || 'No se pudo sincronizar con Science Chago';
        }
      } catch (syncError) {
        console.error('Error syncing to Science Chago:', syncError);
        syncWarning = syncError.message;
      }

      return res.status(200).json({
        success: true,
        message: 'Cliente actualizado exitosamente',
        warning: syncWarning
      });

    } else {
      return res.status(405).json({
        success: false,
        error: 'Método no permitido'
      });
    }

  } catch (error) {
    console.error('Error en API de cliente:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    });
  }
}
