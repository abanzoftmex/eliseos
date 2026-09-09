import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { sucursalService } from '../../lib/services/sucursalService';

const SucursalSelector = forwardRef(({ 
  value, 
  onChange, 
  className = '',
  placeholder = 'Seleccionar sucursal...',
  required = false,
  disabled = false,
  showAllOption = false,
  allOptionLabel = 'Todas las sucursales'
}, ref) => {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSucursales();
  }, []);

  const loadSucursales = async () => {
    try {
      setLoading(true);
      setError(null);
      const sucursalesData = await sucursalService.getAll();
      setSucursales(sucursalesData);
    } catch (err) {
      setError(err.message);
      console.error('Error loading sucursales:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChange = (e) => {
    const selectedValue = e.target.value;
    onChange(selectedValue);
  };

  const refreshSucursales = async () => {
    await loadSucursales();
  };

  useImperativeHandle(ref, () => ({
    refreshSucursales,
    getSucursales: () => sucursales
  }));

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <select 
          disabled 
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
        >
          <option>Cargando sucursales...</option>
        </select>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative ${className}`}>
        <select 
          disabled 
          className="w-full px-3 py-2 border border-red-300 rounded-md bg-red-50 text-red-500"
        >
          <option>Error al cargar sucursales</option>
        </select>
        <button
          type="button"
          onClick={loadSucursales}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-600 hover:text-red-800"
        >
          ↻
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <select
        value={value || ''}
        onChange={handleSelectChange}
        required={required}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
      >
        <option value="">{showAllOption ? allOptionLabel : placeholder}</option>
        {sucursales.map((sucursal) => (
          <option key={sucursal.id} value={sucursal.id}>
            {sucursal.name}
          </option>
        ))}
      </select>
    </div>
  );
});

SucursalSelector.displayName = 'SucursalSelector';

export default SucursalSelector;
