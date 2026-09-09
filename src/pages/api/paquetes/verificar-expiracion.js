import { db } from '../../../../lib/firebase';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { sendPlanExpirationEmail } from '../../../../lib/email';

/**
 * API para verificar y actualizar el estado de expiración de los paquetes
 * Los paquetes tienen una duración de 30 días desde la fecha de asignación
 */
export default async function handler(req, res) {
  // Solo permitir POST o GET
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const now = new Date();
    const duracionDias = 30; // Duración de los paquetes en días
    let paquetesActualizados = 0;
    let paquetesVerificados = 0;
    let emailsEnviados = 0;
    const errores = [];

    // Verificar en clientes
    const clientesSnapshot = await getDocs(collection(db, 'clientes'));
    
    for (const clienteDoc of clientesSnapshot.docs) {
      const clienteId = clienteDoc.id;
      
      // Obtener paquetes activos del cliente
      const paquetesRef = collection(db, 'clientes', clienteId, 'paquetesAsignados');
      const q = query(paquetesRef, where('status', '==', 'active'));
      const paquetesSnapshot = await getDocs(q);
      
      for (const paqueteDoc of paquetesSnapshot.docs) {
        paquetesVerificados++;
        const paqueteData = paqueteDoc.data();
        
        // Verificar si tiene fecha de asignación
        if (!paqueteData.fechaAsignacion) {
          console.warn(`Paquete ${paqueteDoc.id} del cliente ${clienteId} no tiene fechaAsignacion`);
          continue;
        }
        
        // Convertir fecha de asignación a Date
        let fechaAsignacion;
        if (paqueteData.fechaAsignacion.toDate && typeof paqueteData.fechaAsignacion.toDate === 'function') {
          fechaAsignacion = paqueteData.fechaAsignacion.toDate();
        } else if (typeof paqueteData.fechaAsignacion === 'string') {
          fechaAsignacion = new Date(paqueteData.fechaAsignacion);
        } else {
          console.warn(`Formato de fecha no reconocido para paquete ${paqueteDoc.id}`);
          continue;
        }
        
        // Calcular días transcurridos
        const diffTime = now - fechaAsignacion;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        // Si han pasado 30 días o más, marcar como expirado
        if (diffDays >= duracionDias) {
          try {
            const paqueteRef = doc(db, 'clientes', clienteId, 'paquetesAsignados', paqueteDoc.id);
            await updateDoc(paqueteRef, {
              status: 'expired',
              fechaExpiracion: now,
              activo: false
            });
            paquetesActualizados++;
            console.log(`Paquete ${paqueteDoc.id} del cliente ${clienteId} marcado como expirado`);
            // Enviar correo de alerta al cliente
            try {
              const clienteData = clienteDoc.data();
              if (clienteData.email) {
                const emailResult = await sendPlanExpirationEmail(
                  { nombre: clienteData.nombre, apellido: clienteData.apellido, email: clienteData.email },
                  { nombre: paqueteData.nombre || paqueteData.planNombre, fechaExpiracion: now, diasRestantes: 0 }
                );
                if (emailResult.success) emailsEnviados++;
                else console.warn(`Email no enviado a ${clienteData.email}:`, emailResult.error);
              }
            } catch (emailErr) {
              console.warn(`Error enviando email al cliente ${clienteId}:`, emailErr.message);
            }
          } catch (error) {
            errores.push({
              paqueteId: paqueteDoc.id,
              clienteId: clienteId,
              error: error.message
            });
          }
        }
      }
    }
    
    // Verificar en atletas
    const atletasSnapshot = await getDocs(collection(db, 'atletas'));
    
    for (const atletaDoc of atletasSnapshot.docs) {
      const atletaId = atletaDoc.id;
      
      // Obtener paquetes activos del atleta
      const paquetesRef = collection(db, 'atletas', atletaId, 'paquetesAsignados');
      const q = query(paquetesRef, where('status', '==', 'active'));
      const paquetesSnapshot = await getDocs(q);
      
      for (const paqueteDoc of paquetesSnapshot.docs) {
        paquetesVerificados++;
        const paqueteData = paqueteDoc.data();
        
        // Verificar si tiene fecha de asignación
        if (!paqueteData.fechaAsignacion) {
          console.warn(`Paquete ${paqueteDoc.id} del atleta ${atletaId} no tiene fechaAsignacion`);
          continue;
        }
        
        // Convertir fecha de asignación a Date
        let fechaAsignacion;
        if (paqueteData.fechaAsignacion.toDate && typeof paqueteData.fechaAsignacion.toDate === 'function') {
          fechaAsignacion = paqueteData.fechaAsignacion.toDate();
        } else if (typeof paqueteData.fechaAsignacion === 'string') {
          fechaAsignacion = new Date(paqueteData.fechaAsignacion);
        } else {
          console.warn(`Formato de fecha no reconocido para paquete ${paqueteDoc.id}`);
          continue;
        }
        
        // Calcular días transcurridos
        const diffTime = now - fechaAsignacion;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        // Si han pasado 30 días o más, marcar como expirado
        if (diffDays >= duracionDias) {
          try {
            const paqueteRef = doc(db, 'atletas', atletaId, 'paquetesAsignados', paqueteDoc.id);
            await updateDoc(paqueteRef, {
              status: 'expired',
              fechaExpiracion: now,
              activo: false
            });
            paquetesActualizados++;
            console.log(`Paquete ${paqueteDoc.id} del atleta ${atletaId} marcado como expirado`);
            // Enviar correo de alerta al atleta
            try {
              const atletaData = atletaDoc.data();
              if (atletaData.email) {
                const emailResult = await sendPlanExpirationEmail(
                  { nombre: atletaData.nombre, apellido: atletaData.apellido, email: atletaData.email },
                  { nombre: paqueteData.nombre || paqueteData.planNombre, fechaExpiracion: now, diasRestantes: 0 }
                );
                if (emailResult.success) emailsEnviados++;
                else console.warn(`Email no enviado a ${atletaData.email}:`, emailResult.error);
              }
            } catch (emailErr) {
              console.warn(`Error enviando email al atleta ${atletaId}:`, emailErr.message);
            }
          } catch (error) {
            errores.push({
              paqueteId: paqueteDoc.id,
              atletaId: atletaId,
              error: error.message
            });
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      mensaje: 'Verificación de expiración completada',
      paquetesVerificados,
      paquetesActualizados,
      emailsEnviados,
      errores: errores.length > 0 ? errores : undefined,
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error('Error en verificación de expiración:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al verificar expiración de paquetes',
      details: error.message
    });
  }
}
