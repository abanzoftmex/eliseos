import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ClientesContent from '../../components/dashboard/ClientesContent';
import SearchBar from '../../components/common/SearchBar';
import ViewToggle from '../../components/common/ViewToggle';
import useSucursalStore from '../../store/sucursalStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faMapMarkerAlt
}
  from '@fortawesome/free-solid-svg-icons';


function ClientesPage({ initialClientes = [], initialDrafts = { normalDrafts: {}, atletaDrafts: {} } }) {
  const router = useRouter();
  const { filter, search, sortBy, sucursal } = router.query;
  const sucursales = useSucursalStore((state) => state.sucursales);
  const [searchTerm, setSearchTerm] = useState(search || '');
  const [sortByValue, setSortByValue] = useState(sortBy || 'nombre');
  const [sucursalValue, setSucursalValue] = useState(sucursal || '');

  // Sincronizar searchTerm con el parámetro de URL
  useEffect(() => {
    if (search !== undefined) {
      setSearchTerm(search);
    }
  }, [search]);

  // Sincronizar sortBy con el parámetro de URL
  useEffect(() => {
    if (sortBy !== undefined) {
      setSortByValue(sortBy);
    }
  }, [sortBy]);

  // Sincronizar sucursal con el parámetro de URL
  useEffect(() => {
    if (sucursal !== undefined) {
      setSucursalValue(sucursal);
      return;
    }

    setSucursalValue('');
  }, [sucursal]);

  const handleSearchChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);

    // Actualizar la URL con el nuevo término de búsqueda
    const query = { ...router.query };
    if (newValue) {
      query.search = newValue;
    } else {
      delete query.search;
    }

    router.push(
      {
        pathname: router.pathname,
        query: query,
      },
      undefined,
      { shallow: true } // Evita recarga completa de la página
    );
  };

  const handleSortChange = (e) => {
    const newValue = e.target.value;
    setSortByValue(newValue);

    // Actualizar la URL con el nuevo ordenamiento
    const query = { ...router.query };
    if (newValue && newValue !== 'nombre') {
      query.sortBy = newValue;
    } else {
      delete query.sortBy;
    }

    router.push(
      {
        pathname: router.pathname,
        query: query,
      },
      undefined,
      { shallow: true }
    );
  };

  const handleSucursalChange = (e) => {
    const newValue = e.target.value;
    setSucursalValue(newValue);

    const query = { ...router.query };
    delete query.page;

    if (newValue) {
      query.sucursal = newValue;
    } else {
      delete query.sucursal;
    }

    router.push(
      {
        pathname: router.pathname,
        query,
      },
      undefined,
      { shallow: true }
    );
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
              <h1 className="text-xl font-semibold text-gray-900">Miembros</h1>
              <p className="text-sm text-gray-400">Administra los miembros de Elíseos Box & Fitness</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <SearchBar
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Buscar miembros por nombre, email, teléfono..."
              className="flex-1 min-w-[220px]"
            />
            <div className="relative">
              <FontAwesomeIcon
                icon={faMapMarkerAlt}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5"
              />
              <select
                value={sucursalValue}
                onChange={handleSucursalChange}
                className="appearance-none pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1c4040] focus:border-transparent transition-all"
              >
                <option value="">Todas las sucursales</option>
                {sucursales.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
                <option value="sin-sucursal">Sin sucursal</option>
              </select>
            </div>
            <select
              value={sortByValue}
              onChange={handleSortChange}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1c4040] focus:border-transparent transition-all"
            >
              <option value="nombre">Nombre</option>
              <option value="numeroExpediente">No. Expediente</option>
            </select>
            <ViewToggle />
          </div>
        </div>
      </header>

      <main className="p-6">
        <ClientesContent
          searchTerm={searchTerm}
          initialClientes={initialClientes}
          initialDrafts={initialDrafts}
          filterType={filter}
          sortBy={sortByValue}
        />
      </main>
    </>
  );
}

// Configurar props estáticas para optimizar carga
export async function getStaticProps() {
  return {
    props: {
      title: "Directorio de Miembros - Elíseos Box & Fitness",
      breadcrumbs: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Miembros', href: '/clientes', isLast: true }
      ],
      showBreadcrumbs: true,
      requireAuth: true,
      allowedRoles: ['admin', 'medico', 'secretario'],
      // No cargar datos iniciales en SSR/SSG - cargar en cliente para mejor rendimiento
      initialClientes: [],
      initialDrafts: { normalDrafts: {}, atletaDrafts: {} }
    }
  };
}

// Proteger la ruta - requiere permiso 'clientes'
// Roles permitidos: admin, medico, secretario
export default ClientesPage;
