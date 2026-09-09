import React from 'react';
import { useRouter } from 'next/router';
import DirectorioForm from '../../../components/DirectorioForm';

export default function EditarDirectorio({ profesional }) {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (!profesional) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Profesional no encontrado</h2>
          <button
            onClick={() => router.push('/directorio')}
            className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            Volver al Directorio
          </button>
        </div>
      </div>
    );
  }

  return <DirectorioForm profesional={profesional} mode="edit" />;
}

export async function getServerSideProps(context) {
  const { id } = context.params;

  try {
    // Importar Firebase directamente para acceso desde el servidor
    const { db } = await import('../../../../lib/firebase');
    const { doc, getDoc } = await import('firebase/firestore');

    const profesionalRef = doc(db, 'directorio', id);
    const profesionalSnap = await getDoc(profesionalRef);

    if (!profesionalSnap.exists()) {
      return {
        redirect: {
          destination: '/directorio',
          permanent: false,
        },
      };
    }

    const profesionalData = {
      id: profesionalSnap.id,
      ...profesionalSnap.data()
    };

    return {
      props: {
        title: `Editar ${profesionalData.nombre} ${profesionalData.apellidoPaterno} - Elíseos Box & Fitness`,
        breadcrumbs: [
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Coaches/Staff', href: '/directorio' },
          { label: `${profesionalData.nombre} ${profesionalData.apellidoPaterno}`, href: `/directorio/${id}` },
          { label: 'Editar', href: `/directorio/editar/${id}`, isLast: true }
        ],
        showBreadcrumbs: true,
        requireAuth: true,
        allowedRoles: ['admin'],
        profesional: profesionalData
      }
    };
  } catch (error) {
    console.error('Error fetching profesional:', error);
    return {
      redirect: {
        destination: '/directorio',
        permanent: false,
      },
    };
  }
}
