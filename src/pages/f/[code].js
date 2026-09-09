import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileText } from '@fortawesome/free-solid-svg-icons';

/**
 * Página intermedia para resolver y redirigir a la ficha pública correcta
 * Redirige a /f/citas/ o /f/citas-deportivas/ según el tipo
 */
const SharedConsultaRedirect = () => {
  const router = useRouter();
  const { code } = router.query;

  const [error, setError] = useState(null);

  useEffect(() => {
    if (code) {
      resolveAndRedirect();
    }
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  const resolveAndRedirect = async () => {
    try {
      // Resolver el código corto para obtener el consultaId y tipo
      const response = await fetch(`/api/s/${code}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Consulta no encontrada o el enlace ha expirado');
        } else {
          setError('Error al cargar la consulta');
        }
        return;
      }

      const { type } = await response.json();

      // Redirigir a la página correcta según el tipo
      if (type === 'atleta') {
        router.replace(`/f/citas-deportivas/${code}`);
      } else {
        router.replace(`/f/citas/${code}`);
      }
    } catch (err) {
      console.error('Error resolviendo consulta:', err);
      setError('Error al cargar la consulta');
    }
  };

  if (error) {
    return (
      <>
        <Head>
          <title>Error - Elíseos Box & Fitness</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
            <FontAwesomeIcon icon={faFileText} className="mx-auto text-gray-300 mb-4 w-16 h-16" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {error}
            </h2>
            <p className="text-gray-600">
              No pudimos cargar la información de esta consulta.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Cargando Consulta - Elíseos Box & Fitness</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando consulta...</p>
        </div>
      </div>
    </>
  );
};

export default SharedConsultaRedirect;
