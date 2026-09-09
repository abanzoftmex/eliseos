import React from 'react';
import PropTypes from 'prop-types';

/**
 * FMSScoreInput - Componente reutilizable para la puntuación de tests FMS
 * 
 * Este componente maneja la lógica de puntuación incluyendo:
 * - Selección entre puntuación NEUTRAL o LATERAL (DER/IZQ)
 * - Campos de puntuación bruta (0-3)
 * - Selección de estado de compensación
 * 
 * @component
 * @param {Object} testData - Datos del test FMS
 * @param {string} testName - Nombre del test (ej: 'fmsDeepSquat')
 * @param {Function} handleNestedChange - Función para actualizar campos anidados
 */
const FMSScoreInput = ({ testData, testName, handleNestedChange }) => {
    const compensacionOptions = [
        { value: '', label: 'Seleccionar...' },
        { value: 'sin_compensacion', label: 'Sin compensación' },
        { value: 'con_compensacion', label: 'Con compensación' },
        { value: 'no_realiza', label: 'No realiza movimiento' },
        { value: 'dolor', label: 'Dolor' }
    ];

    return (
        <div className="space-y-2">
            {/* Selector de tipo de puntuación */}
            <select
                value={testData.tipoPuntuacionBruta}
                onChange={(e) => handleNestedChange(testName, 'tipoPuntuacionBruta', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
                <option value="neutral">NEUTRAL</option>
                <option value="lateral">DER/IZQ</option>
            </select>

            {/* Puntuación Bruta - NEUTRAL */}
            {testData.tipoPuntuacionBruta === 'neutral' ? (
                <div className="space-y-2">
                    <input
                        type="number"
                        min="0"
                        max="3"
                        value={testData.puntuacionBruta}
                        onChange={(e) => handleNestedChange(testName, 'puntuacionBruta', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="0-3"
                    />
                    
                    {/* Select de compensación para NEUTRAL */}
                    <select
                        value={testData.estadoCompensacion || ''}
                        onChange={(e) => handleNestedChange(testName, 'estadoCompensacion', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 bg-teal-50"
                    >
                        {compensacionOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                /* Puntuación Bruta - LATERAL (DER/IZQ) */
                <div className="space-y-2">
                    <div className="space-y-1">
                        <input
                            type="number"
                            min="0"
                            max="3"
                            value={testData.puntuacionBrutaDerecha}
                            onChange={(e) => handleNestedChange(testName, 'puntuacionBrutaDerecha', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="Der"
                        />
                        
                        {/* Select de compensación para DERECHA */}
                        <select
                            value={testData.estadoCompensacionDerecha || ''}
                            onChange={(e) => handleNestedChange(testName, 'estadoCompensacionDerecha', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 bg-teal-50"
                        >
                            {compensacionOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="space-y-1">
                        <input
                            type="number"
                            min="0"
                            max="3"
                            value={testData.puntuacionBrutaIzquierda}
                            onChange={(e) => handleNestedChange(testName, 'puntuacionBrutaIzquierda', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="Izq"
                        />
                        
                        {/* Select de compensación para IZQUIERDA */}
                        <select
                            value={testData.estadoCompensacionIzquierda || ''}
                            onChange={(e) => handleNestedChange(testName, 'estadoCompensacionIzquierda', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 bg-teal-50"
                        >
                            {compensacionOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
};

FMSScoreInput.propTypes = {
    testData: PropTypes.shape({
        tipoPuntuacionBruta: PropTypes.string,
        puntuacionBruta: PropTypes.string,
        puntuacionBrutaDerecha: PropTypes.string,
        puntuacionBrutaIzquierda: PropTypes.string,
        estadoCompensacion: PropTypes.string,
        estadoCompensacionDerecha: PropTypes.string,
        estadoCompensacionIzquierda: PropTypes.string,
    }).isRequired,
    testName: PropTypes.string.isRequired,
    handleNestedChange: PropTypes.func.isRequired,
};

export default FMSScoreInput;
