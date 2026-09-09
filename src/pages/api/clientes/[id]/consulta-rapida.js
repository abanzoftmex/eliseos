import { db } from '../../../../../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';

export default async function handler(req, res) {
    const { id: clienteId } = req.query;

    if (!clienteId) {
        return res.status(400).json({ success: false, error: 'ID de cliente requerido' });
    }

    try {
        switch (req.method) {
            case 'GET':
                return await getConsultasRapidas(clienteId, res);
            case 'POST':
                return await createConsultaRapida(clienteId, req.body, res);
            case 'PUT':
                return await updateConsultaRapida(clienteId, req.body, res);
            case 'DELETE':
                return await deleteConsultaRapida(clienteId, req.body, res);
            default:
                return res.status(405).json({ success: false, error: 'Método no permitido' });
        }
    } catch (error) {
        console.error('Error in consulta-rapida API:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

// GET - Obtener todas las consultas rápidas de un cliente
async function getConsultasRapidas(clienteId, res) {
    try {
        const consultasRef = collection(db, 'consultasRapidas');
        const q = query(
            consultasRef,
            where('clienteId', '==', clienteId)
            // Removed orderBy to avoid composite index requirement
            // We'll sort in memory instead
        );

        const querySnapshot = await getDocs(q);
        const consultas = [];

        querySnapshot.forEach((doc) => {
            consultas.push({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || null,
                updatedAt: doc.data().updatedAt?.toDate?.() || null,
            });
        });

        // Sort by createdAt in memory (most recent first)
        consultas.sort((a, b) => {
            const aDate = a.createdAt || new Date(0);
            const bDate = b.createdAt || new Date(0);
            return bDate - aDate;
        });

        return res.status(200).json({
            success: true,
            consultas,
        });
    } catch (error) {
        console.error('Error getting consultas rápidas:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al obtener las consultas rápidas',
        });
    }
}

// POST - Crear nueva consulta rápida
async function createConsultaRapida(clienteId, data, res) {
    try {
        const {
            fechaEvaluacion,
            numeroExpediente,
            datosPersonales,
            motivoConsulta,
            tipoPadecimiento,
            descripcion,
            antecedentes,
            exploracionFisica,
            diagnosticoMedico,
        } = data;

        // Validación básica
        if (!fechaEvaluacion) {
            return res.status(400).json({
                success: false,
                error: 'La fecha de evaluación es requerida',
            });
        }

        const consultaData = {
            clienteId,
            fechaEvaluacion,
            numeroExpediente: numeroExpediente || '',
            datosPersonales: {
                nombre: datosPersonales?.nombre || '',
                apellidoPaterno: datosPersonales?.apellidoPaterno || '',
                apellidoMaterno: datosPersonales?.apellidoMaterno || '',
                edad: datosPersonales?.edad || '',
                fechaNacimiento: datosPersonales?.fechaNacimiento || '',
                genero: datosPersonales?.genero || '',
                ladoDominante: datosPersonales?.ladoDominante || '',
                ocupacion: datosPersonales?.ocupacion || '',
                contacto: datosPersonales?.contacto || '',
                contactoEmergencia: datosPersonales?.contactoEmergencia || '',
            },
            motivoConsulta: {
                enfermedad: motivoConsulta?.enfermedad || false,
                accidente: motivoConsulta?.accidente || false,
                urgencia: motivoConsulta?.urgencia || false,
                segundaOpinion: motivoConsulta?.segundaOpinion || false,
            },
            tipoPadecimiento: {
                congenito: tipoPadecimiento?.congenito || false,
                adquirido: tipoPadecimiento?.adquirido || false,
                agudo: tipoPadecimiento?.agudo || false,
                cronico: tipoPadecimiento?.cronico || false,
                fechaPadecimiento: tipoPadecimiento?.fechaPadecimiento || '',
                fechaDx: tipoPadecimiento?.fechaDx || '',
            },
            descripcion: descripcion || '',
            antecedentes: antecedentes || '',
            exploracionFisica: exploracionFisica || '',
            diagnosticoMedico: diagnosticoMedico || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const consultasRef = collection(db, 'consultasRapidas');
        const docRef = await addDoc(consultasRef, consultaData);

        return res.status(201).json({
            success: true,
            message: 'Consulta rápida creada exitosamente',
            consultaId: docRef.id,
        });
    } catch (error) {
        console.error('Error creating consulta rápida:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al crear la consulta rápida',
        });
    }
}

// PUT - Actualizar consulta rápida existente
async function updateConsultaRapida(clienteId, data, res) {
    try {
        const { consultaId, ...updateData } = data;

        if (!consultaId) {
            return res.status(400).json({
                success: false,
                error: 'ID de consulta requerido',
            });
        }

        const consultaRef = doc(db, 'consultasRapidas', consultaId);

        // Preparar datos de actualización
        const dataToUpdate = {
            ...updateData,
            updatedAt: serverTimestamp(),
        };

        await updateDoc(consultaRef, dataToUpdate);

        return res.status(200).json({
            success: true,
            message: 'Consulta rápida actualizada exitosamente',
        });
    } catch (error) {
        console.error('Error updating consulta rápida:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al actualizar la consulta rápida',
        });
    }
}

// DELETE - Eliminar consulta rápida
async function deleteConsultaRapida(clienteId, data, res) {
    try {
        const { consultaId } = data;

        if (!consultaId) {
            return res.status(400).json({
                success: false,
                error: 'ID de consulta requerido',
            });
        }

        const consultaRef = doc(db, 'consultasRapidas', consultaId);
        await deleteDoc(consultaRef);

        return res.status(200).json({
            success: true,
            message: 'Consulta rápida eliminada exitosamente',
        });
    } catch (error) {
        console.error('Error deleting consulta rápida:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al eliminar la consulta rápida',
        });
    }
}
