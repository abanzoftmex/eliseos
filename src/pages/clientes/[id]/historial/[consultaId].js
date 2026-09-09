import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../../lib/firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faFileText } from '@fortawesome/free-solid-svg-icons';

const DetalleConsultaPage = () => {
  const router = useRouter();
  const { id: clienteId, consultaId } = router.query;

  const [cliente, setCliente] = useState(null);
  const [consulta, setConsulta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clienteId && consultaId) {
      loadData();
    }
  }, [clienteId, consultaId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar información del cliente
      const clienteDoc = await getDoc(doc(db, 'clientes', clienteId));
      if (clienteDoc.exists()) {
        setCliente(clienteDoc.data());
      }

      // Cargar consulta específica
      const consultaDoc = await getDoc(doc(db, 'consultas', consultaId));
      if (consultaDoc.exists()) {
        const consultaData = {
          id: consultaDoc.id,
          ...consultaDoc.data()
        };
        setConsulta(consultaData);
        
        // Redirigir a la interfaz de formulario apropiada en modo solo lectura
        if (consultaData.type === 'atleta') {
          router.replace(`/clientes/${clienteId}/citas-deportivas?consultaId=${consultaId}&viewMode=true`);
        } else {
          router.replace(`/clientes/${clienteId}/citas?consultaId=${consultaId}&viewMode=true`);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Fecha no disponible';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando consulta...</p>
        </div>
      </div>
    );
  }

  if (!consulta) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faFileText} className="mx-auto text-gray-300 mb-4 w-16 h-16" />
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Consulta no encontrada
          </h2>
          <button
            onClick={() => router.back()}
            className="mt-4 inline-flex items-center px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-5 h-5 mr-2" />
            Volver
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default DetalleConsultaPage;
