import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faChevronLeft, faChevronRight, faAnglesLeft, faAnglesRight } from '@fortawesome/free-solid-svg-icons';

const DataTable = ({
  data = [],
  columns = [],
  searchTerm = '',
  onSearchChange,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  loading = false,
  searchPlaceholder = 'Buscar...',
  emptyStateTitle = 'No hay datos',
  emptyStateDescription = 'No se encontraron elementos',
  className = '',
  showSearch = true,
  showPagination = true,
  headerTitle = null, // Título opcional para el encabezado
}) => {
  // Estado local para el input de búsqueda
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [isSearching, setIsSearching] = useState(false);

  // Efecto para sincronizar el término de búsqueda externo con el local
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  // Debounce: esperar 1.5 segundos después de que el usuario deje de escribir
  useEffect(() => {
    if (localSearchTerm !== searchTerm) {
      setIsSearching(true);
    }

    const timeoutId = setTimeout(() => {
      if (onSearchChange && localSearchTerm !== searchTerm) {
        onSearchChange(localSearchTerm);
      }
      setIsSearching(false);
    }, 1500); // 1.5 segundos de delay

    // Limpiar el timeout si el usuario sigue escribiendo
    return () => clearTimeout(timeoutId);
  }, [localSearchTerm, onSearchChange, searchTerm]);

  const handleSearchChange = (e) => {
    setLocalSearchTerm(e.target.value);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && onPageChange) {
      onPageChange(page);
    }
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      const end = Math.min(totalPages, start + maxVisiblePages - 1);

      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }
    }

    return pageNumbers;
  };

  const renderPagination = () => {
    if (!showPagination || totalPages <= 1) return null;

    const pageNumbers = getPageNumbers();
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <div className="bg-white px-6 py-4 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between">
        <div className="text-sm text-gray-700 mb-4 md:mb-0">
          Mostrando <span className="font-medium">{startItem}</span> a{' '}
          <span className="font-medium">{endItem}</span> de{' '}
          <span className="font-medium">{totalItems}</span> resultados
        </div>

        <div className="flex items-center space-x-2">
          {/* Primera página */}
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Primera página"
          >
            <FontAwesomeIcon icon={faAnglesLeft} className="w-4 h-4" />
          </button>

          {/* Página anterior */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Página anterior"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
          </button>

          {/* Números de página */}
          <div className="flex space-x-1">
            {pageNumbers.map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${pageNum === currentPage
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                {pageNum}
              </button>
            ))}
          </div>

          {/* Página siguiente */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Página siguiente"
          >
            <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
          </button>

          {/* Última página */}
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Última página"
          >
            <FontAwesomeIcon icon={faAnglesRight} className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderTableHeader = () => (
    <thead className="bg-gray-50">
      <tr>
        {columns.map((column, index) => (
          <th
            key={column.key || index}
            scope="col"
            className={`px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${column.className || ''
              }`}
            style={{ width: column.width }}
          >
            {column.title}
          </th>
        ))}
      </tr>
    </thead>
  );

  const renderTableBody = () => {
    if (loading) {
      return (
        <tbody className="bg-white divide-y divide-gray-100">
          {Array.from({ length: itemsPerPage }).map((_, index) => (
            <tr key={index}>
              {columns.map((column, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <div className="animate-pulse bg-gray-200 h-4 rounded"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      );
    }

    if (data.length === 0) {
      return (
        <tbody className="bg-white">
          <tr>
            <td colSpan={columns.length} className="px-6 py-12 text-center">
              <div className="text-gray-500">
                <h3 className="text-lg font-medium mb-2">{emptyStateTitle}</h3>
                <p className="text-sm">{emptyStateDescription}</p>
              </div>
            </td>
          </tr>
        </tbody>
      );
    }

    return (
      <tbody className="bg-white divide-y divide-gray-100">
        {data.map((row, rowIndex) => (
          <tr key={row.id || rowIndex} className="hover:bg-gray-50 transition-colors duration-150">
            {columns.map((column, colIndex) => (
              <td
                key={column.key || colIndex}
                className={`px-6 py-4 ${column.cellClassName || ''}`}
              >
                {column.render ? column.render(row, rowIndex) : row[column.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Barra de búsqueda */}
      {showSearch && (
        <div className="p-6 border-b border-gray-200">
          {headerTitle && (
            <h1 className="text-lg font-semibold text-gray-900 mb-4">{headerTitle}</h1>
          )}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={localSearchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="animate-spin h-5 w-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <span className="font-medium">{totalItems}</span> elementos encontrados
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {renderTableHeader()}
          {renderTableBody()}
        </table>
      </div>

      {/* Paginación */}
      {renderPagination()}
    </div>
  );
};

export default DataTable;