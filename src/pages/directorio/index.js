import React, { useState } from 'react';
import DirectorioContent from '../../components/dashboard/DirectorioContent';
import SearchBar from '../../components/common/SearchBar';
import ViewToggle from '../../components/common/ViewToggle';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers } from '@fortawesome/free-solid-svg-icons';

function DirectorioPage({ initialProfesionales }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <>
      <header className="bg-white border-b border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1c4040] flex items-center justify-center">
              <FontAwesomeIcon icon={faUsers} className="w-5 h-5 text-[#c2ef03]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Personal Interno</h1>
              <p className="text-sm text-gray-400">Coaches, entrenadores y staff de Elíseos Box & Fitness</p>
            </div>
          </div>

          <div className="flex items-center gap-3 max-w-xl w-full lg:w-auto">
            <SearchBar
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Buscar por nombre, especialidad o área..."
              className="flex-1"
            />
            <ViewToggle />
          </div>
        </div>
      </header>

      <main className="p-6">
        <DirectorioContent 
          searchTerm={searchTerm} 
          initialProfesionales={initialProfesionales}
        />
      </main>
    </>
  );
}

// Implementar SSR para mejorar SEO y rendimiento inicial
export async function getServerSideProps(context) {
  try {
    // Cargar datos iniciales de profesionales en el servidor
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Fetch profesionales iniciales
    const directorioResponse = await fetch(`${baseUrl}/api/directorio?limit=50`);
    const directorioResult = await directorioResponse.json();

    return {
      props: {
        title: "Coaches/Staff - Elíseos Box & Fitness",
        breadcrumbs: [
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Coaches/Staff', href: '/directorio', isLast: true }
        ],
        showBreadcrumbs: true,
        requireAuth: true,
        allowedRoles: ['admin', 'medico'],
        // Datos iniciales para SSR
        initialProfesionales: directorioResult.success ? directorioResult.data : []
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps for directorio:', error);
    
    // En caso de error, devolver props mínimas
    return {
      props: {
        title: "Coaches/Staff - Elíseos Box & Fitness",
        breadcrumbs: [
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Coaches/Staff', href: '/directorio', isLast: true }
        ],
        showBreadcrumbs: false,
        requireAuth: true,
        allowedRoles: ['admin', 'medico'],
        initialProfesionales: []
      }
    };
  }
}

// Proteger la ruta - requiere permiso 'directorio'
// Roles permitidos: admin, medico
export default DirectorioPage;
