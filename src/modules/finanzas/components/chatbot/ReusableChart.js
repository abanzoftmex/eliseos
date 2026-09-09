import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';

// Sistema de colores consistente
const getColorPalette = () => [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', 
  '#84CC16', '#F97316', '#EC4899', '#6366F1', '#14B8A6', '#A855F7',
  '#22C55E', '#EAB308', '#DC2626', '#7C3AED', '#059669', '#D97706',
  '#BE185D', '#1E40AF'
];

const getConceptColor = (conceptName, isGrouped = false, format = 'hex') => {
  const colorPalette = getColorPalette();
  
  // Color especial para categorías agrupadas
  if (isGrouped || conceptName.includes('Gastos +$100K')) {
    return '#8B5CF6'; // Color púrpura para categorías agrupadas
  }
  
  const hashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  const colorIndex = hashCode(conceptName.toLowerCase().trim()) % colorPalette.length;
  return colorPalette[colorIndex];
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
};

const ReusableChart = ({ 
  type = 'bar', 
  title, 
  data, 
  dataKey = 'value',
  nameKey = 'name',
  width = '100%',
  height = 400,
  showLegend = true,
  showTooltip = true,
  className = ""
}) => {
  if (!data || data.length === 0) {
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
            <p className="text-lg font-medium mb-2">No hay datos para mostrar</p>
            <p className="text-sm">No se encontraron datos para el gráfico</p>
          </div>
        </div>
      </div>
    );
  }

  // Función para calcular el rango truncado del gráfico
  const calculateTruncatedRange = (data) => {
    if (!data || data.length === 0) return { min: 0, max: 100000, isTruncated: false };
    
    const values = data.map(item => parseFloat(item[dataKey]) || 0);
    const maxValue = Math.max(...values);
    const threshold = 100000; // Threshold para truncar (100K)
    
    // Si el valor máximo excede el threshold, truncar
    if (maxValue > threshold) {
      return {
        min: 0,
        max: threshold,
        isTruncated: true,
        originalMax: maxValue
      };
    }
    
    return {
      min: 0,
      max: maxValue * 1.1, // 10% margen
      isTruncated: false
    };
  };

  // Prepare data with colors (usar porcentajes existentes si están disponibles)
  const dataWithColors = data.map((item, index) => {
    let itemWithPercentage = { ...item };
    
    // Si no tiene porcentaje calculado, calcularlo
    if (!item.percentage) {
      const total = data.reduce((sum, dataItem) => sum + (parseFloat(dataItem[dataKey]) || 0), 0);
      itemWithPercentage.percentage = total > 0 ? ((parseFloat(item[dataKey]) || 0) / total * 100).toFixed(1) : 0;
    }
    
    return {
      ...itemWithPercentage,
      color: getConceptColor(item[nameKey] || item.name || `item-${index}`, item.isGrouped)
    };
  });

  // Custom label function para el pie chart
  const renderCustomLabel = ({ name, value, payload }) => {
    const displayName = name || payload?.[nameKey] || 'Sin nombre';
    const displayPercentage = payload?.percentage || 0;
    return `${displayName}: ${displayPercentage}%`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const item = data.payload;
      
      // Usar el valor original si existe, si no el valor del dataKey
      const displayValue = item.originalValue || data.value;
      const isTruncated = item.isTruncated || false;
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-xs">
          <p className="font-medium text-gray-900">{item[nameKey] || label}</p>
          <p className="text-blue-600 font-semibold">
            {typeof displayValue === 'number' ? formatCurrency(displayValue) : displayValue}
          </p>
          {isTruncated && (
            <p className="text-cyan-600 text-xs font-medium">
              ⚠️ Valor truncado en gráfico
            </p>
          )}
          {item.percentage && (
            <p className="text-gray-600 text-sm">
              {item.percentage}% del total
            </p>
          )}
          {item.count && (
            <p className="text-gray-600 text-sm">
              {item.count} transacciones
            </p>
          )}
          {item.isGrouped && item.groupedItems && (
            <div className="mt-2 text-xs text-gray-500">
              <p className="font-medium">Incluye:</p>
              <p className="truncate">{item.groupedItems.slice(0, 3).join(', ')}{item.groupedItems.length > 3 ? '...' : ''}</p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (type) {
      case 'pie':
        return (
          <RechartsPieChart width="100%" height={height}>
            <Pie
              data={dataWithColors}
              cx="50%"
              cy="50%"
              outerRadius={Math.min(height * 0.3, 120)}
              fill="#8884d8"
              dataKey={dataKey}
              nameKey={nameKey}
              label={renderCustomLabel}
              labelLine={false}
            >
              {dataWithColors.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
          </RechartsPieChart>
        );
      
      case 'bar':
        const range = calculateTruncatedRange(dataWithColors);
        
        // Crear datos con valores truncados para el display visual
        const displayData = dataWithColors.map(item => ({
          ...item,
          displayValue: Math.min(parseFloat(item[dataKey]) || 0, range.max),
          originalValue: parseFloat(item[dataKey]) || 0,
          isTruncated: parseFloat(item[dataKey]) > range.max
        }));
        
        return (
          <BarChart width="100%" height={height} data={displayData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={nameKey}
              tick={{ fontSize: 11 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={100}
              width={150}
            />
            <YAxis 
              type="number"
              domain={[0, range.max]}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                if (value >= 1000000) {
                  return `$${(value / 1000000).toFixed(1)}M`;
                } else if (value >= 1000) {
                  return `$${(value / 1000).toFixed(0)}K`;
                } else {
                  return `$${value.toFixed(0)}`;
                }
              }}
            />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
            <Bar dataKey="displayValue" fill="#3B82F6" radius={[4, 4, 0, 0]}>
              {displayData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.isTruncated ? '#F59E0B' : entry.color} // Color naranja para valores truncados
                  stroke={entry.isTruncated ? '#D97706' : 'none'}
                  strokeWidth={entry.isTruncated ? 2 : 0}
                />
              ))}
            </Bar>
            {/* Indicador visual de truncado */}
            {range.isTruncated && displayData.some(entry => entry.isTruncated) && (
              <text x="50%" y={height - 10} textAnchor="middle" fontSize="12" fill="#F59E0B">
                ⚠️ Algunos valores están truncados
              </text>
            )}
          </BarChart>
        );
      
      case 'line':
        return (
          <LineChart width="100%" height={height} data={dataWithColors}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={nameKey}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatCurrency(value)}
            />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        );
      
      default:
        return <div>Tipo de gráfico no soportado</div>;
    }
  };

  // Calcular el rango para mostrar información de truncado
  const chartRange = type === 'bar' ? calculateTruncatedRange(dataWithColors) : null;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="w-full">
        <ResponsiveContainer width={width} height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
      {chartRange && chartRange.isTruncated && (
        <div className="mt-3 p-2 bg-cyan-50 border-l-4 border-cyan-400 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2">
              <p className="text-sm text-cyan-700">
                <strong>Escala truncada:</strong> Algunos valores superiores a {formatCurrency(chartRange.max)} se muestran cortados para mejorar la visualización de valores menores.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReusableChart;
