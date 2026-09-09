import React from 'react';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faEnvelope, 
  faPhone, 
  faBuilding, 
  faFileText, 
  faUserPlus,
  faEdit,
  faCheckCircle,
  faTimesCircle,
  faTag,
  faComments,
  faMapMarkerAlt,
  faUser
} from '@fortawesome/free-solid-svg-icons';
import useSucursalStore from '../../store/sucursalStore';

export default function DirectorioProfesionalDetail({ profesional }) {
  const router = useRouter();
  const sucursales = useSucursalStore((state) => state.sucursales);
  
  // Helper para obtener nombres de sucursales (maneja tanto array como string)
  const getSucursalesNames = (prof) => {
    const sucursalesArray = Array.isArray(prof.sucursales) 
      ? prof.sucursales 
      : (prof.sucursal ? [prof.sucursal] : []);
    
    if (sucursalesArray.length === 0) return ['Sin sucursal'];
    
    return sucursalesArray.map(sucursalId => {
      const sucursal = sucursales.find(s => s.id === sucursalId);
      return sucursal ? sucursal.name : sucursalId;
    });
  };
  const currentProfesional = profesional;

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

  if (!currentProfesional) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FontAwesomeIcon icon={faTimesCircle} className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Profesional no encontrado</h2>
          <p className="text-gray-600 mb-4">El profesional que buscas no existe o fue eliminado.</p>
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

  return (
    <>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200">
        <div className="px-6 py-5">
          <button
            onClick={() => router.push('/directorio')}
            className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 font-semibold mb-4 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-5 h-5" />
            Volver al Directorio
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {currentProfesional.foto ? (
                <img 
                  src={currentProfesional.foto} 
                  alt={`${currentProfesional.nombre} ${currentProfesional.apellidoPaterno}`}
                  className="w-20 h-20 rounded-xl object-cover shadow-lg border-2 border-cyan-300"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FontAwesomeIcon icon={faUser} className="w-8 h-8 text-white" />
                </div>
              )}
              
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  {currentProfesional.nombre} {currentProfesional.apellidoPaterno} {currentProfesional.apellidoMaterno}
                </h1>
                <p className="text-lg text-gray-600 mt-1">
                  {currentProfesional.puesto || currentProfesional.ocupacion || 'Profesional'}
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push(`/directorio/editar/${currentProfesional.id}`)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white font-semibold rounded-lg hover:from-cyan-700 hover:to-cyan-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
              Editar
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-8 px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Principal - Información de Contacto */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card de Información de Contacto */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FontAwesomeIcon icon={faEnvelope} className="w-6 h-6 text-cyan-600" />
                Información de Contacto
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-cyan-50 rounded-lg">
                    <FontAwesomeIcon icon={faEnvelope} className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-semibold">Correo Electrónico</p>
                    <p className="text-gray-800 mt-1">
                      {currentProfesional.email || 'No especificado'}
                    </p>
                  </div>
                </div>

                {/* Teléfono */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-cyan-50 rounded-lg">
                    <FontAwesomeIcon icon={faPhone} className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-semibold">Teléfono</p>
                    <p className="text-gray-800 mt-1">
                      {currentProfesional.telefono || 'No especificado'}
                    </p>
                  </div>
                </div>

                {/* Teléfono de Contacto */}
                {currentProfesional.telefonoContacto && currentProfesional.telefonoContacto !== currentProfesional.telefono && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-cyan-50 rounded-lg">
                      <FontAwesomeIcon icon={faPhone} className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 font-semibold">Teléfono de Contacto Alternativo</p>
                      <p className="text-gray-800 mt-1">
                        {currentProfesional.telefonoContacto}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card de Información Profesional */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FontAwesomeIcon icon={faBuilding} className="w-6 h-6 text-cyan-600" />
                Información Profesional
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Especialidad */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-cyan-50 rounded-lg">
                    <FontAwesomeIcon icon={faFileText} className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-semibold">Especialidad</p>
                    <p className="text-gray-800 mt-1">
                      {currentProfesional.especialidad || 'No especificada'}
                    </p>
                  </div>
                </div>

                {/* Puesto */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-cyan-50 rounded-lg">
                    <FontAwesomeIcon icon={faBuilding} className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-semibold">Puesto</p>
                    <p className="text-gray-800 mt-1">
                      {currentProfesional.puesto || currentProfesional.ocupacion || 'No especificado'}
                    </p>
                  </div>
                </div>

                {/* Área */}
                {currentProfesional.area && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-cyan-50 rounded-lg">
                      <FontAwesomeIcon icon={faTag} className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 font-semibold">Área</p>
                      <p className="text-gray-800 mt-1">
                        {currentProfesional.area}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Observaciones */}
            {currentProfesional.observaciones && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FontAwesomeIcon icon={faComments} className="w-6 h-6 text-cyan-600" />
                  Observaciones
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {currentProfesional.observaciones}
                </p>
              </div>
            )}
          </div>

          {/* Columna Lateral - Estado e Información Adicional */}
          <div className="space-y-6">
            {/* Card de Estado */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Estado</h3>
              
              <div className="space-y-4">
                {/* Estado Actual */}
                <div className="flex items-center gap-3">
                  {currentProfesional.status === 'active' ? (
                    <FontAwesomeIcon icon={faCheckCircle} className="w-6 h-6 text-green-500" />
                  ) : (
                    <FontAwesomeIcon icon={faTimesCircle} className="w-6 h-6 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Estado</p>
                    <p className={`font-semibold ${
                      currentProfesional.status === 'active' 
                        ? 'text-green-700' 
                        : 'text-red-700'
                    }`}>
                      {currentProfesional.status === 'active' ? 'Activo' : 'Inactivo'}
                    </p>
                  </div>
                </div>

                {/* Tipo */}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-50 rounded-lg">
                    <FontAwesomeIcon icon={faTag} className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tipo</p>
                    <p className="font-semibold text-gray-800">
                      {currentProfesional.tipo || 'Médico'}
                    </p>
                  </div>
                </div>

                {/* Sucursales */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-cyan-50 rounded-lg">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sucursales</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {getSucursalesNames(currentProfesional).map((nombre, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded-full text-sm font-medium">
                          {nombre}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps(context) {
  const { id } = context.params;

  try {
    // Importar Firebase admin para acceso directo desde el servidor
    const { db } = await import('../../../lib/firebase');
    const { doc, getDoc } = await import('firebase/firestore');
    
    const profesionalRef = doc(db, 'directorio', id);
    const profesionalSnap = await getDoc(profesionalRef);

    if (!profesionalSnap.exists()) {
      return {
        props: {
          title: "Personal no encontrado - Elíseos Box & Fitness",
          breadcrumbs: [
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Coaches/Staff', href: '/directorio' },
            { label: 'Detalle', href: `/directorio/${id}`, isLast: true }
          ],
          showBreadcrumbs: true,
          requireAuth: true,
          allowedRoles: ['admin', 'medico'],
          profesional: null
        }
      };
    }

    const profesionalData = {
      id: profesionalSnap.id,
      ...profesionalSnap.data()
    };

    return {
      props: {
        title: `${profesionalData.nombre} ${profesionalData.apellidoPaterno} - Coaches/Staff`,
        breadcrumbs: [
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Coaches/Staff', href: '/directorio' },
          { label: `${profesionalData.nombre} ${profesionalData.apellidoPaterno}`, href: `/directorio/${id}`, isLast: true }
        ],
        showBreadcrumbs: true,
        requireAuth: true,
        allowedRoles: ['admin', 'medico'],
        profesional: profesionalData
      }
    };
  } catch (error) {
    console.error('Error fetching professional details:', error);
    
    return {
      props: {
        title: "Error - Elíseos Box & Fitness",
        breadcrumbs: [
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Coaches/Staff', href: '/directorio' },
          { label: 'Detalle', href: `/directorio/${id}`, isLast: true }
        ],
        showBreadcrumbs: true,
        requireAuth: true,
        allowedRoles: ['admin', 'medico'],
        profesional: null
      }
    };
  }
}
