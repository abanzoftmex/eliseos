import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { clienteService } from '../../lib/services/clienteService';
import { ChevronDownIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const ClienteSelector = forwardRef(({ 
  value, 
  onChange, 
  className = '',
  placeholder = 'Buscar cliente...',
  required = false,
  disabled = false,
  sucursalId = null // Optional filter by sucursal
}, ref) => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadClientes();
  }, [sucursalId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadClientes = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = {};
      if (sucursalId) {
        filters.sucursal = sucursalId;
      }
      const result = await clienteService.getAll(filters);
      setClientes(result.clientes || []);
    } catch (err) {
      setError(err.message);
      console.error('Error loading clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (clienteId) => {
    onChange(clienteId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  const refreshClientes = async () => {
    await loadClientes();
  };

  useImperativeHandle(ref, () => ({
    refreshClientes
  }));

  // Get selected cliente name
  const selectedCliente = clientes.find(c => c.id === value);

  // Filter clientes based on search term
  const filteredClientes = clientes.filter(cliente => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (cliente.nombre || '').toLowerCase().includes(search) ||
      (cliente.email || '').toLowerCase().includes(search) ||
      (cliente.telefono || '').toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 flex items-center">
          <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full mr-2"></div>
          Cargando clientes...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full px-3 py-2 border border-red-300 rounded-md bg-red-50 text-red-500 flex items-center justify-between">
          <span>Error al cargar clientes</span>
          <button
            type="button"
            onClick={loadClientes}
            className="text-red-600 hover:text-red-800 font-medium"
          >
            ↻ Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Main button/display */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-md flex items-center justify-between cursor-pointer transition-colors
          ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300' : 'bg-white border-gray-300 hover:border-gray-400'}
          ${isOpen ? 'ring-2 ring-cyan-500 border-cyan-500' : ''}
        `}
      >
        <span className={selectedCliente ? 'text-gray-900' : 'text-gray-500'}>
          {selectedCliente ? selectedCliente.nombre : placeholder}
        </span>
        <div className="flex items-center space-x-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
          <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, email o teléfono..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>
          
          {/* Options list */}
          <div className="overflow-y-auto max-h-48">
            {/* Empty option */}
            <div
              onClick={() => handleSelect('')}
              className={`px-3 py-2 cursor-pointer hover:bg-gray-50 text-gray-500 text-sm border-b border-gray-50
                ${!value ? 'bg-cyan-50' : ''}
              `}
            >
              Sin cliente
            </div>
            
            {filteredClientes.length === 0 ? (
              <div className="px-3 py-4 text-center text-gray-500 text-sm">
                {searchTerm ? 'No se encontraron clientes' : 'No hay clientes disponibles'}
              </div>
            ) : (
              filteredClientes.map((cliente) => (
                <div
                  key={cliente.id}
                  onClick={() => handleSelect(cliente.id)}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors
                    ${value === cliente.id ? 'bg-cyan-50 border-l-2 border-cyan-500' : ''}
                  `}
                >
                  <div className="font-medium text-gray-900 text-sm">{cliente.nombre}</div>
                  {(cliente.email || cliente.telefono) && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {cliente.email && <span>{cliente.email}</span>}
                      {cliente.email && cliente.telefono && <span className="mx-1">•</span>}
                      {cliente.telefono && <span>{cliente.telefono}</span>}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          
          {/* Footer with count */}
          {clientes.length > 0 && (
            <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
              {filteredClientes.length} de {clientes.length} clientes
            </div>
          )}
        </div>
      )}
      
      {/* Hidden input for form validation */}
      {required && (
        <input
          type="hidden"
          value={value || ''}
          required={required}
        />
      )}
    </div>
  );
});

ClienteSelector.displayName = 'ClienteSelector';

export default ClienteSelector;
