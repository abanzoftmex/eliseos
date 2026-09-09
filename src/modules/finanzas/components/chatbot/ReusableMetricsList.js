import React from 'react';
import { formatCurrency } from '../../lib/utils/formatters';

const ReusableMetricsList = ({ 
  title, 
  metrics, 
  className = "",
  layout = 'vertical' // 'vertical' | 'horizontal' | 'grid'
}) => {
  if (!metrics || metrics.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-8">
          <div className="text-gray-500">
            <svg
              className="mx-auto h-12 w-12 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p className="text-lg font-medium mb-2">No hay métricas disponibles</p>
            <p className="text-sm">No se encontraron datos para mostrar</p>
          </div>
        </div>
      </div>
    );
  }

  const formatValue = (value, type) => {
    // Verificar valores nulos, undefined o NaN
    if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
      return type === 'currency' ? '$0.00' : type === 'percentage' ? '0.0%' : '0';
    }
    
    switch (type) {
      case 'currency':
        const currencyValue = parseFloat(value);
        if (isNaN(currencyValue)) return '$0.00';
        return formatCurrency(currencyValue);
      case 'percentage':
        const percentageValue = parseFloat(value);
        if (isNaN(percentageValue)) return '0.0%';
        return `${percentageValue.toFixed(1)}%`;
      case 'number':
        const numberValue = parseFloat(value);
        if (isNaN(numberValue)) return '0';
        return numberValue.toLocaleString('es-MX');
      case 'count':
        const countValue = parseInt(value) || 0;
        return `${countValue} ${countValue === 1 ? 'transacción' : 'transacciones'}`;
      default:
        return value || 'N/A';
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'currency':
      case 'income':
        return (
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'expense':
        return (
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        );
      case 'balance':
        return (
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'count':
        return (
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
        );
      case 'percentage':
        return (
          <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getContainerClass = () => {
    switch (layout) {
      case 'horizontal':
        return 'flex flex-wrap gap-4';
      case 'grid':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
      default:
        return 'space-y-4';
    }
  };

  const getItemClass = () => {
    switch (layout) {
      case 'horizontal':
        return 'flex-1 min-w-[200px] bg-gray-50 rounded-lg p-4 border border-gray-200';
      case 'grid':
        return 'bg-gray-50 rounded-lg p-4 border border-gray-200';
      default:
        return 'bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-center justify-between';
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div className={getContainerClass()}>
        {metrics.map((metric, index) => (
          <div key={index} className={getItemClass()}>
            <div className={layout === 'vertical' ? 'flex items-center space-x-3' : 'text-center'}>
              <div className={layout !== 'vertical' ? 'flex justify-center mb-3' : ''}>
                {getIconForType(metric.type)}
              </div>
              <div className={layout !== 'vertical' ? 'text-center' : 'flex-1'}>
                <h4 className="text-sm font-medium text-gray-600 mb-1">
                  {metric.label}
                </h4>
                <p className={`font-bold ${
                  metric.type === 'income' || (metric.type === 'balance' && parseFloat(metric.value) > 0) 
                    ? 'text-green-600' 
                    : metric.type === 'expense' || (metric.type === 'balance' && parseFloat(metric.value) < 0)
                    ? 'text-red-600'
                    : 'text-gray-900'
                } ${layout === 'vertical' ? 'text-xl' : 'text-lg'}`}>
                  {formatValue(metric.value, metric.type)}
                </p>
                {metric.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {metric.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReusableMetricsList;
