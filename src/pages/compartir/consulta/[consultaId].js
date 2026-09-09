import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { FileText } from 'lucide-react';
import ConsultaReadView from '@/components/ConsultaReadView';

const SharedConsultaPage = () => {
  const router = useRouter();
  const { consultaId } = router.query;

  const [consulta, setConsulta] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (consultaId) loadConsultaData();
  }, [consultaId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadConsultaData = async () => {
    setLoading(true);
    setError(null);
    try {
      const consultaDoc = await getDoc(doc(db, 'consultas', consultaId));
      if (!consultaDoc.exists()) {
        setError('Consulta no encontrada');
        setLoading(false);
        return;
      }
      const consultaData = { id: consultaDoc.id, ...consultaDoc.data() };
      setConsulta(consultaData);

      if (consultaData.clienteId) {
        try {
          let clienteDoc = await getDoc(doc(db, 'clientes', consultaData.clienteId));
          if (!clienteDoc.exists()) {
            clienteDoc = await getDoc(doc(db, 'atletas', consultaData.clienteId));
          }
          if (clienteDoc.exists()) {
            const cd = clienteDoc.data();
            setCliente({
              nombre: `${cd.nombre || ''} ${cd.apellidoPaterno || ''} ${cd.apellidoMaterno || ''}`.trim(),
              email: cd.email,
              telefono: cd.telefono || cd.telefonoContacto,
            });
          }
        } catch (err) {
          console.error('Error cargando cliente:', err);
        }
      }
    } catch (err) {
      console.error('Error cargando consulta:', err);
      setError('Error al cargar la consulta');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Head><title>Cargando Consulta - Elíseos Box & Fitness</title></Head>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-600 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Cargando consulta...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !consulta) {
    return (
      <>
        <Head><title>Error - Elíseos Box & Fitness</title></Head>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
            <FileText size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{error || 'Consulta no encontrada'}</h2>
            <p className="text-gray-600">No pudimos cargar la información de esta consulta.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{`Consulta - ${cliente?.nombre || 'Miembro'} - Elíseos Box & Fitness`}</title>
        <meta name="description" content="Consulta compartida de Elíseos Box & Fitness" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
        <ConsultaReadView consulta={consulta} cliente={cliente} />
      </div>
    </>
  );
};

export default SharedConsultaPage;
