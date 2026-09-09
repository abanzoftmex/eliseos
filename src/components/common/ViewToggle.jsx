import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTh, faList } from '@fortawesome/free-solid-svg-icons';
import useViewStore from '../../store/viewStore';

/**
 * Componente reutilizable para alternar entre vista de cards (grid) y tabla (list)
 * Se conecta automáticamente al store de Zustand
 * 
 * @param {string} className - Clases CSS adicionales opcionales
 */
const ViewToggle = ({ className = '' }) => {
  const { viewMode, setViewMode } = useViewStore();

  return (
    <div className={`flex items-center gap-1 bg-gray-100 p-1 rounded-lg ${className}`}>
      {/* Botón de vista Grid */}
      <button
        onClick={() => setViewMode('grid')}
        className={`
          flex items-center justify-center px-3 py-2 rounded-md transition-all duration-200
          ${viewMode === 'grid'
            ? 'bg-white text-teal-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }
        `}
        title="Vista de tarjetas"
        aria-label="Vista de tarjetas"
      >
        <FontAwesomeIcon icon={faTh} className="w-4 h-4" />
      </button>

      {/* Botón de vista List (Tabla) */}
      <button
        onClick={() => setViewMode('list')}
        className={`
          flex items-center justify-center px-3 py-2 rounded-md transition-all duration-200
          ${viewMode === 'list'
            ? 'bg-white text-teal-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }
        `}
        title="Vista de tabla"
        aria-label="Vista de tabla"
      >
        <FontAwesomeIcon icon={faList} className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ViewToggle;
