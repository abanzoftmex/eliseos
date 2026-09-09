import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faTimes } from '@fortawesome/free-solid-svg-icons';

/**
 * Componente reutilizable de búsqueda
 * Diseñado para integrarse con el sistema de diseño del dashboard
 * @param {string} value - Valor actual del campo de búsqueda
 * @param {function} onChange - Callback cuando cambia el valor
 * @param {string} placeholder - Texto placeholder del input
 * @param {string} className - Clases CSS adicionales opcionales
 */
const SearchBar = ({ 
  value, 
  onChange, 
  placeholder = "Buscar...",
  className = ""
}) => {
  const handleClear = () => {
    onChange({ target: { value: '' } });
  };

  return (
    <div className={`relative ${className}`}>
      {/* Ícono de búsqueda */}
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="h-5 w-5 text-teal-500 transition-colors" />
      </div>
      
      {/* Input de búsqueda */}
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-12 pr-12 py-3 bg-white border-2 border-gray-200 rounded-xl 
                   focus:ring-2 focus:ring-teal-500 focus:border-teal-500 
                   hover:border-gray-300
                   outline-none transition-all duration-200 shadow-sm 
                   text-gray-800 placeholder-gray-400
                   font-medium text-sm"
      />
      
      {/* Botón para limpiar (solo visible cuando hay texto) */}
      {value && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-4 flex items-center 
                     text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Limpiar búsqueda"
        >
          <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
