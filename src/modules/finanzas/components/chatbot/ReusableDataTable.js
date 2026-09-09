import React from 'react';
import { formatCurrency } from '../../lib/utils/formatters';

const ReusableDataTable = ({ 
  title, 
  data, 
  columns, 
  showTotal = false,
  totalLabel = "Total",
  className = "",
  maxHeight = "400px"
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg font-medium mb-2">No hay datos disponibles</p>
            <p className="text-sm">No se encontraron registros para mostrar</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate total if needed
  const total = showTotal && columns.length > 0 ? 
    data.reduce((sum, item) => {
      const amountColumn = columns.find(col => col.type === 'currency' || col.key === 'amount' || col.key === 'total');
      if (amountColumn && item[amountColumn.key] !== null && item[amountColumn.key] !== undefined) {
        const value = parseFloat(item[amountColumn.key]);
        return sum + (isNaN(value) ? 0 : value);
      }
      return sum;
    }, 0) : 0;

  const formatValue = (value, column) => {
    // Verificar si el valor es nulo, undefined, NaN o no es un número válido para tipos numéricos
    if (value === null || value === undefined) return 'N/A';
    
    switch (column.type) {
      case 'currency':
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return '$0.00';
        return formatCurrency(numValue);
      case 'percentage':
        const pctValue = parseFloat(value);
        if (isNaN(pctValue)) return '0.0%';
        return `${pctValue.toFixed(1)}%`;
      case 'number':
        const numberValue = parseFloat(value);
        if (isNaN(numberValue)) return '0';
        return numberValue.toLocaleString('es-MX');
      case 'date':
        if (!value) return 'N/A';
        return new Date(value).toLocaleDateString('es-MX');
      case 'status':
        if (!value) return 'N/A';
        return (
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            value === 'pagado' ? 'bg-green-100 text-green-800' :
            value === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
            value === 'parcial' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {value === 'pagado' ? 'Pagado' :
             value === 'pendiente' ? 'Pendiente' :
             value === 'parcial' ? 'Parcial' : value}
          </span>
        );
      default:
        if (value === '' || (typeof value === 'number' && isNaN(value))) return 'N/A';
        return column.format ? column.format(value) : value;
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      
      <div style={{ maxHeight }} className="overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.align === 'right' ? 'text-right' : 
                    column.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                      column.align === 'right' ? 'text-right' : 
                      column.align === 'center' ? 'text-center' : 'text-left'
                    } ${
                      column.type === 'currency' ? 'font-medium text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {formatValue(item[column.key], column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {showTotal && (
            <tfoot className="bg-gray-50">
              <tr>
                <td
                  colSpan={columns.length - 1}
                  className="px-6 py-4 text-sm font-medium text-gray-900 text-right"
                >
                  {totalLabel}:
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                  {formatCurrency(total)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default ReusableDataTable;
